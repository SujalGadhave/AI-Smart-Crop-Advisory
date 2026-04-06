from __future__ import annotations

import logging
import warnings
from functools import lru_cache
from pathlib import Path
from typing import Optional, Tuple

import joblib
import numpy as np
from sklearn.exceptions import InconsistentVersionWarning
from sklearn.linear_model import LogisticRegression

from .constants import (
    CLASSES,
    CROP_TO_DISEASES,
    LOW_MARGIN_CONFIDENCE,
    MIN_ALLOWED_CROP_PROBABILITY_MASS,
    MIN_ALLOWED_CONFIDENCE,
    MIN_MARGIN_BETWEEN_TOP2,
    MODEL_MAX_ITERATIONS,
    MODEL_RANDOM_SEED,
    SAMPLES_PER_CLASS,
)
from .image_processing import extract_features, synthetic_leaf

log = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).resolve().parent.parent / "disease_model.joblib"


class PredictionError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _train_and_save_model(path: Path) -> LogisticRegression:
    rng = np.random.default_rng(MODEL_RANDOM_SEED)
    samples = []
    targets = []

    for cls in CLASSES:
        for _ in range(SAMPLES_PER_CLASS):
            img = synthetic_leaf(cls, rng)
            samples.append(extract_features(img))
            targets.append(cls)

    model = LogisticRegression(max_iter=MODEL_MAX_ITERATIONS, random_state=MODEL_RANDOM_SEED)
    model.fit(np.stack(samples), targets)

    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    return model


@lru_cache(maxsize=1)
def load_model() -> LogisticRegression:
    if MODEL_PATH.exists():
        try:
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always", InconsistentVersionWarning)
                model: LogisticRegression = joblib.load(MODEL_PATH)
            if any(issubclass(w.category, InconsistentVersionWarning) for w in caught):
                log.info("Persisted model sklearn version mismatch detected, retraining.")
                return _train_and_save_model(MODEL_PATH)
            if set(model.classes_) == set(CLASSES):
                return model
        except Exception as exc:  # noqa: BLE001
            log.warning("Failed to load model (%s), retraining.", exc)
    return _train_and_save_model(MODEL_PATH)


def predict_for_crop(image, crop_type: str) -> Tuple[str, float]:
    normalized_crop = (crop_type or "").strip().lower()
    if normalized_crop not in CROP_TO_DISEASES:
        raise PredictionError(
            "UNSUPPORTED_CROP",
            "Unsupported crop type. Supported crops are tomato, potato, and corn.",
        )

    model = load_model()
    features = extract_features(image).reshape(1, -1)
    proba = model.predict_proba(features)[0]

    allowed = CROP_TO_DISEASES[normalized_crop]
    allowed_indices = [idx for idx, label in enumerate(model.classes_) if str(label) in allowed]
    allowed_probs = proba[allowed_indices]

    total = float(allowed_probs.sum())
    if total <= 0:
        raise PredictionError(
            "LOW_CONFIDENCE",
            "The model is not confident enough for this crop. Please upload a clearer crop leaf image.",
        )
    if total < MIN_ALLOWED_CROP_PROBABILITY_MASS:
        raise PredictionError(
            "LOW_CONFIDENCE",
            "The model confidence for the selected crop is too low. Please upload a clearer leaf image or verify the crop type.",
        )

    normalized_allowed = allowed_probs / total
    best_idx_in_allowed = int(np.argmax(normalized_allowed))
    best_conf = float(normalized_allowed[best_idx_in_allowed])
    best_label = str(model.classes_[allowed_indices[best_idx_in_allowed]])

    sorted_allowed = np.sort(normalized_allowed)
    top_margin = float(sorted_allowed[-1] - sorted_allowed[-2]) if len(sorted_allowed) > 1 else 1.0

    if best_conf < MIN_ALLOWED_CONFIDENCE:
        raise PredictionError(
            "LOW_CONFIDENCE",
            "Low model confidence. Please upload a close-up, well-lit crop leaf image.",
        )

    if best_conf < LOW_MARGIN_CONFIDENCE and top_margin < MIN_MARGIN_BETWEEN_TOP2:
        raise PredictionError(
            "AMBIGUOUS_RESULT",
            "The image is ambiguous for disease diagnosis. Please upload a sharper leaf image from top view.",
        )

    return best_label, best_conf


def safe_load_existing_model() -> Optional[LogisticRegression]:
    try:
        return load_model()
    except Exception:  # noqa: BLE001
        return None
