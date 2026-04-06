import base64
import binascii
import io
import logging
from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Tuple

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image, ImageDraw, UnidentifiedImageError
from pydantic import BaseModel
from sklearn.linear_model import LogisticRegression

app = FastAPI(title="KrishiMitra AI Service")
log = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).with_name("disease_model.joblib")

# Crop-specific disease classes: tomato (4), potato (2), corn (2), healthy (1)
CLASSES = [
    "healthy",
    "tomato_early_blight",
    "tomato_late_blight",
    "tomato_septoria_leaf_spot",
    "tomato_leaf_mold",
    "potato_early_blight",
    "potato_late_blight",
    "corn_northern_leaf_blight",
    "corn_common_rust",
]

# Symptom descriptions per disease
DISEASE_SYMPTOMS: dict = {
    "healthy": ["No visible disease symptoms", "Green healthy foliage"],
    "tomato_early_blight": [
        "Circular brown spots with concentric rings",
        "Yellow halo surrounding spots",
        "Lower leaves affected first",
    ],
    "tomato_late_blight": [
        "Water-soaked dark lesions on leaves",
        "White mold visible on leaf underside in humid conditions",
        "Rapid browning and leaf collapse",
    ],
    "tomato_septoria_leaf_spot": [
        "Small circular spots with dark borders and light centers",
        "Yellowing between spots",
        "Spots first appear on older lower leaves",
    ],
    "tomato_leaf_mold": [
        "Yellow patches on upper leaf surface",
        "Pale olive-green to grayish-purple mold on underside",
        "Leaves wilt and drop in severe cases",
    ],
    "potato_early_blight": [
        "Dark brown circular lesions with concentric rings",
        "Yellowing and death of older leaves",
        "Angular lesions near leaf margins",
    ],
    "potato_late_blight": [
        "Water-soaked dark lesions expanding rapidly",
        "White cottony growth on underside in wet weather",
        "Entire leaflet collapses quickly",
    ],
    "corn_northern_leaf_blight": [
        "Long gray-green to tan cigar-shaped lesions",
        "Lesions run parallel to leaf veins",
        "Significant leaf area loss in severe cases",
    ],
    "corn_common_rust": [
        "Small round to elongated brownish-red pustules",
        "Powdery rust-colored spores on both leaf surfaces",
        "Pustules turn dark brown as they mature",
    ],
}

# Training constants
MODEL_RANDOM_SEED = 7
SAMPLES_PER_CLASS = 60
MODEL_MAX_ITERATIONS = 500
SYNTHETIC_IMAGE_SIZE = 128
BASE_LEAF_COLOR = np.array([40, 140, 50], dtype=np.float32)
NOISE_STD = 18.0
RED_TO_GREEN_RATIO_THRESHOLD = 1.05
GREEN_TO_BLUE_RATIO_THRESHOLD = 0.9
DARK_PIXEL_THRESHOLD = 0.35

# Plant validation: minimum fraction of plant-like pixels required
PLANT_PIXEL_THRESHOLD = 0.15


class PredictRequest(BaseModel):
    crop_type: str
    image_base64: str


class PredictResponse(BaseModel):
    crop_type: Optional[str] = None
    is_healthy: Optional[bool] = None
    disease: Optional[str] = None
    confidence: Optional[float] = None
    severity: Optional[str] = None
    affected_area_percent: Optional[float] = None
    symptoms: Optional[List[str]] = None
    error: Optional[bool] = None
    error_code: Optional[str] = None
    message: Optional[str] = None


def _decode_image(image_base64: str) -> Image.Image:
    try:
        image_bytes = base64.b64decode(image_base64, validate=True)
    except binascii.Error as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Could not read image") from exc


def _is_plant_image(image: Image.Image) -> Tuple[bool, float]:
    """Validate whether the image contains a plant or leaf using color analysis.

    Examines pixel color distribution: plants have green, yellow, or warm-brown
    tones (diseased tissue).  Non-plant images (animals, buildings, sky) lack
    sufficient plant-like pixel coverage.

    Returns (is_plant, plant_pixel_fraction).
    """
    small = image.resize((64, 64))
    arr = np.asarray(small).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # Green pixels: green channel is distinctly dominant (healthy leaf tissue)
    green_mask = (g > r + 8) & (g > b + 8) & (g > 50)

    # Warm plant pixels: yellow/brown tones from diseased or senescent leaves.
    # The red–green gap must be small (< 60) to exclude saturated orange tones
    # typical of animal fur or terracotta.  Near-white pixels are also excluded.
    warm_plant_mask = (r > 80) & (g > 70) & (b < r - 20) & (r < g + 60) & ~((r > 200) & (g > 200) & (b > 200))

    plant_fraction = float((green_mask | warm_plant_mask).mean())
    return plant_fraction >= PLANT_PIXEL_THRESHOLD, plant_fraction


def _compute_severity(image: Image.Image) -> Tuple[str, float]:
    """Estimate disease severity from lesion coverage.

    Analyses brown/dark necrotic and yellow lesion pixels relative to the
    total leaf area.  Returns (severity_label, affected_area_percent).
    """
    arr = np.asarray(image).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    gray = arr.mean(axis=2)

    # Lesion pixels: brown necrotic tissue, dark patches, or yellow spots
    brown_mask = (r > g + 15) & (r > 60) & (b < 150)
    dark_mask = gray < 60
    yellow_mask = (r > 150) & (g > 130) & (b < 80)
    lesion_mask = brown_mask | dark_mask | yellow_mask

    # Leaf area approximation: any plant-like or lesion pixel
    green_mask = (g > r + 5) | (g > b + 5)
    leaf_area = float((green_mask | lesion_mask).sum())
    if leaf_area == 0:
        return "low", 0.0

    affected_pct = min(float(lesion_mask.sum()) / leaf_area * 100.0, 100.0)

    if affected_pct < 10.0:
        severity = "low"
    elif affected_pct < 30.0:
        severity = "medium"
    else:
        severity = "high"

    return severity, round(affected_pct, 1)


def _extract_features(image: Image.Image) -> np.ndarray:
    """Extract color and texture features used by the disease classifier.

    Features (9 total): mean R/G/B, stddev R/G/B, dark-pixel fraction,
    brown-pixel fraction, and grayscale contrast.
    """
    arr = np.asarray(image).astype(np.float32) / 255.0
    mean_channels = arr.reshape(-1, 3).mean(axis=0)
    std_channels = arr.reshape(-1, 3).std(axis=0)
    gray = arr.mean(axis=2)
    dark_fraction = float((gray < DARK_PIXEL_THRESHOLD).mean())
    brown_pixel_fraction = float(
        (
            (arr[:, :, 0] > arr[:, :, 1] * RED_TO_GREEN_RATIO_THRESHOLD)
            & (arr[:, :, 1] > arr[:, :, 2] * GREEN_TO_BLUE_RATIO_THRESHOLD)
        ).mean()
    )
    contrast = float(np.std(gray))
    return np.concatenate([mean_channels, std_channels, [dark_fraction, brown_pixel_fraction, contrast]])


def _draw_spots(
    base: np.ndarray, count: int, color: Tuple[int, int, int], radius: int, rng: np.random.Generator
) -> np.ndarray:
    """Draw circular lesions of a given color and radius onto a leaf image."""
    img = Image.fromarray(base)
    draw = ImageDraw.Draw(img)
    h, w, _ = base.shape
    effective_radius = min(radius, (w - 1) // 2, (h - 1) // 2)
    if effective_radius <= 0:
        return base
    for _ in range(count):
        x = int(rng.integers(effective_radius, w - effective_radius))
        y = int(rng.integers(effective_radius, h - effective_radius))
        draw.ellipse(
            (x - effective_radius, y - effective_radius, x + effective_radius, y + effective_radius),
            fill=color,
        )
    return np.asarray(img)


def _synthetic_leaf(label: str, rng: np.random.Generator) -> Image.Image:
    """Create a synthetic leaf image for a given disease label."""
    noise = rng.normal(0, NOISE_STD, size=(SYNTHETIC_IMAGE_SIZE, SYNTHETIC_IMAGE_SIZE, 3))
    leaf = np.clip(BASE_LEAF_COLOR + noise, 0, 255).astype(np.uint8)

    if label == "healthy":
        pass
    elif label in ("tomato_early_blight", "potato_early_blight"):
        leaf = _draw_spots(leaf, 18, (160, 120, 60), 6, rng)
    elif label in ("tomato_late_blight", "potato_late_blight"):
        leaf = np.clip(leaf * 0.8, 0, 255).astype(np.uint8)
        leaf = _draw_spots(leaf, 12, (70, 60, 70), 10, rng)
    elif label == "tomato_septoria_leaf_spot":
        leaf = _draw_spots(leaf, 30, (200, 200, 170), 3, rng)
    elif label == "tomato_leaf_mold":
        leaf = _draw_spots(leaf, 10, (180, 170, 120), 8, rng)
    elif label == "corn_northern_leaf_blight":
        leaf = _draw_spots(leaf, 8, (150, 130, 80), 12, rng)
    elif label == "corn_common_rust":
        leaf = _draw_spots(leaf, 40, (180, 100, 50), 3, rng)
    return Image.fromarray(leaf)


def _train_and_save_model(path: Path) -> LogisticRegression:
    """Train a logistic regression on synthetic leaves and persist to disk."""
    rng = np.random.default_rng(MODEL_RANDOM_SEED)
    samples: list = []
    targets: list = []
    for cls in CLASSES:
        for _ in range(SAMPLES_PER_CLASS):
            img = _synthetic_leaf(cls, rng)
            samples.append(_extract_features(img))
            targets.append(cls)

    model = LogisticRegression(
        max_iter=MODEL_MAX_ITERATIONS,
        random_state=MODEL_RANDOM_SEED,
    )
    model.fit(np.stack(samples), targets)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    return model


@lru_cache(maxsize=1)
def _load_model() -> LogisticRegression:
    """Load or (re)train the disease classifier.

    If the persisted model was trained on a different set of classes it is
    discarded and a fresh model is trained to keep classes in sync.
    """
    if MODEL_PATH.exists():
        try:
            model: LogisticRegression = joblib.load(MODEL_PATH)
            if set(model.classes_) == set(CLASSES):
                return model
        except Exception as exc:  # noqa: BLE001
            log.warning("Failed to load persisted model (%s); retraining.", exc)
    return _train_and_save_model(MODEL_PATH)


def _predict_label(image: Image.Image) -> Tuple[str, float]:
    """Return the most probable disease class and its confidence score."""
    model = _load_model()
    features = _extract_features(image).reshape(1, -1)
    proba = model.predict_proba(features)[0]
    best_idx = int(np.argmax(proba))
    return str(model.classes_[best_idx]), float(proba[best_idx])


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest) -> PredictResponse:
    """Two-stage pipeline: plant validation → disease detection.

    Stage 1 – Plant validation: reject images that do not contain a plant or
    leaf (e.g. animals, buildings).  This prevents false-positive diagnoses on
    non-crop images.

    Stage 2 – Disease detection: classify the disease, estimate severity, and
    return a structured response including affected area percentage and
    observable symptoms.
    """
    image = _decode_image(payload.image_base64)

    # Stage 1: validate that the image contains plant/leaf content
    is_plant, _ = _is_plant_image(image)
    if not is_plant:
        return PredictResponse(
            error=True,
            error_code="NOT_A_PLANT_IMAGE",
            message="Image does not appear to be a crop leaf. Please upload a plant image.",
            crop_type=None,
            disease=None,
            confidence=None,
        )

    # Stage 2: classify disease
    disease, confidence = _predict_label(image)
    is_healthy = disease == "healthy"

    # Stage 3: estimate severity (healthy plants have no affected area)
    if is_healthy:
        severity, affected_area_percent = "low", 0.0
    else:
        severity, affected_area_percent = _compute_severity(image)

    symptoms = DISEASE_SYMPTOMS.get(disease, [])

    return PredictResponse(
        crop_type=payload.crop_type,
        is_healthy=is_healthy,
        disease=disease,
        confidence=round(confidence, 4),
        severity=severity,
        affected_area_percent=affected_area_percent,
        symptoms=symptoms,
        error=None,
        error_code=None,
        message=None,
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
