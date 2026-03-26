import base64
import binascii
import io
from functools import lru_cache
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image, ImageDraw, UnidentifiedImageError
from pydantic import BaseModel
from sklearn.linear_model import LogisticRegression

app = FastAPI(title="KrishiMitra AI Service")

MODEL_PATH = Path(__file__).with_name("disease_model.joblib")
CLASSES = ["healthy", "early_blight", "late_blight", "septoria_leaf_spot"]
MODEL_RANDOM_SEED = 7
SAMPLES_PER_CLASS = 60
MODEL_MAX_ITERATIONS = 300
SYNTHETIC_IMAGE_SIZE = 128
BASE_LEAF_COLOR = np.array([40, 140, 50], dtype=np.float32)
NOISE_STD = 18.0
LATE_BLIGHT_DARKNESS_FACTOR = 0.8
RED_TO_GREEN_RATIO_THRESHOLD = 1.05
GREEN_TO_BLUE_RATIO_THRESHOLD = 0.9


class PredictRequest(BaseModel):
    crop_type: str
    image_base64: str


class PredictResponse(BaseModel):
    disease: str
    confidence: float


def _decode_image(image_base64: str) -> Image.Image:
    try:
        image_bytes = base64.b64decode(image_base64, validate=True)
    except binascii.Error as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Could not read image") from exc


def _extract_features(image: Image.Image) -> np.ndarray:
    """Extract simple color/texture features for classification.

    Features (9 total):
    - mean R, G, B
    - stddev R, G, B
    - fraction of dark pixels
    - fraction of brown-tinted pixels (red > green*RED_TO_GREEN_RATIO_THRESHOLD and green > blue*GREEN_TO_BLUE_RATIO_THRESHOLD)
    - grayscale contrast (stddev)
    """
    arr = np.asarray(image).astype(np.float32) / 255.0
    mean_channels = arr.reshape(-1, 3).mean(axis=0)
    std_channels = arr.reshape(-1, 3).std(axis=0)
    gray = arr.mean(axis=2)
    dark_fraction = float((gray < 0.35).mean())
    brown_pixel_fraction = float(
        (
            (arr[:, :, 0] > arr[:, :, 1] * RED_TO_GREEN_RATIO_THRESHOLD)
            & (arr[:, :, 1] > arr[:, :, 2] * GREEN_TO_BLUE_RATIO_THRESHOLD)
        ).mean()  # highlights yellow/brown lesions where red is slightly above green and green above blue
    )
    contrast = float(np.std(gray))
    return np.concatenate([mean_channels, std_channels, [dark_fraction, brown_pixel_fraction, contrast]])


def _draw_spots(base: np.ndarray, count: int, color: Tuple[int, int, int], radius: int, rng: np.random.Generator) -> np.ndarray:
    img = Image.fromarray(base)
    draw = ImageDraw.Draw(img)
    h, w, _ = base.shape
    for _ in range(count):
        x = int(rng.integers(radius, w - radius))
        y = int(rng.integers(radius, h - radius))
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
    return np.asarray(img)


def _synthetic_leaf(label: str, rng: np.random.Generator) -> Image.Image:
    """Create a synthetic leaf image for a given disease label using color noise and spots."""
    noise = rng.normal(0, NOISE_STD, size=(SYNTHETIC_IMAGE_SIZE, SYNTHETIC_IMAGE_SIZE, 3))
    leaf = np.clip(BASE_LEAF_COLOR + noise, 0, 255).astype(np.uint8)

    if label == "healthy":
        pass
    elif label == "early_blight":
        leaf = _draw_spots(leaf, 18, (160, 120, 60), 6, rng)
    elif label == "late_blight":
        leaf = np.clip(leaf * LATE_BLIGHT_DARKNESS_FACTOR, 0, 255).astype(np.uint8)
        leaf = _draw_spots(leaf, 12, (70, 60, 70), 10, rng)
    elif label == "septoria_leaf_spot":
        leaf = _draw_spots(leaf, 30, (200, 200, 170), 3, rng)
    return Image.fromarray(leaf)


def _train_and_save_model(path: Path) -> LogisticRegression:
    """Train a lightweight logistic regression on synthetic leaves and persist to disk."""
    rng = np.random.default_rng(MODEL_RANDOM_SEED)
    samples = []
    targets = []
    for cls in CLASSES:
        for _ in range(SAMPLES_PER_CLASS):
            img = _synthetic_leaf(cls, rng)
            samples.append(_extract_features(img))
            targets.append(cls)

    model = LogisticRegression(
        max_iter=MODEL_MAX_ITERATIONS,
        multi_class="multinomial",
        random_state=MODEL_RANDOM_SEED,
    )
    model.fit(np.stack(samples), targets)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    return model


@lru_cache(maxsize=1)
def _load_model() -> LogisticRegression:
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return _train_and_save_model(MODEL_PATH)


def _predict_label(image: Image.Image) -> Tuple[str, float]:
    model = _load_model()
    features = _extract_features(image).reshape(1, -1)
    proba = model.predict_proba(features)[0]
    best_idx = int(np.argmax(proba))
    return CLASSES[best_idx], float(proba[best_idx])


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    image = _decode_image(payload.image_base64)
    disease, confidence = _predict_label(image)
    return PredictResponse(disease=disease, confidence=confidence)


@app.get("/health")
async def health():
    return {"status": "ok"}
