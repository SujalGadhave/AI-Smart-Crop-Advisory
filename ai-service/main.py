from __future__ import annotations

import logging

from fastapi import FastAPI

from app.constants import (
    DISEASE_SYMPTOMS,
    LOW_CONF_DISEASE_MAX_AFFECTED_AREA,
    MIN_DISEASE_CONFIDENCE,
    SCENE_CLUTTER_CONFIDENCE_LIMIT,
    SCENE_CLUTTER_MAX_AFFECTED_AREA,
    SCENE_CLUTTER_MIN_BORDER_TOUCHES,
    SCENE_CLUTTER_MIN_GREEN_STD,
    SCENE_CLUTTER_MIN_PLANT_FRACTION,
)
from app.image_processing import (
    assess_leaf_composition,
    compute_severity,
    decode_image,
    is_plant_image,
    leaf_scene_metrics,
)
from app.model import PredictionError, predict_for_crop, safe_load_existing_model
from app.schemas import PredictRequest, PredictResponse

app = FastAPI(title="KrishiMitra AI Service")
log = logging.getLogger(__name__)


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest) -> PredictResponse:
    image = decode_image(payload.image_base64)

    is_plant, plant_fraction = is_plant_image(image)
    if not is_plant:
        return PredictResponse(
            error=True,
            error_code="NOT_A_PLANT_IMAGE",
            message=(
                "Image does not appear to be a crop leaf. "
                f"Plant content is too low ({plant_fraction:.2f}). Please upload a clear crop leaf image."
            ),
            crop_type=payload.crop_type,
        )

    has_valid_composition, composition_message = assess_leaf_composition(image)
    if not has_valid_composition:
        return PredictResponse(
            error=True,
            error_code="IMAGE_COMPOSITION",
            message=composition_message,
            crop_type=payload.crop_type,
        )

    try:
        disease, confidence = predict_for_crop(image, payload.crop_type)
    except PredictionError as exc:
        return PredictResponse(
            error=True,
            error_code=exc.code,
            message=exc.message,
            crop_type=payload.crop_type,
        )

    is_healthy = disease == "healthy"
    if is_healthy:
        severity, affected_area_percent = "low", 0.0
    else:
        severity, affected_area_percent = compute_severity(image)
        if confidence < MIN_DISEASE_CONFIDENCE and affected_area_percent < LOW_CONF_DISEASE_MAX_AFFECTED_AREA:
            return PredictResponse(
                error=True,
                error_code="LOW_DISEASE_CONFIDENCE",
                message=(
                    "The model is not confident enough to confirm disease from this image. "
                    "Please upload one clear close-up of a visibly affected leaf."
                ),
                crop_type=payload.crop_type,
            )

        plant_fraction_scene, green_std, _edge_density, border_touch_count = leaf_scene_metrics(image)
        if (
            confidence < SCENE_CLUTTER_CONFIDENCE_LIMIT
            and affected_area_percent < SCENE_CLUTTER_MAX_AFFECTED_AREA
            and plant_fraction_scene > SCENE_CLUTTER_MIN_PLANT_FRACTION
            and green_std > SCENE_CLUTTER_MIN_GREEN_STD
            and border_touch_count >= SCENE_CLUTTER_MIN_BORDER_TOUCHES
        ):
            return PredictResponse(
                error=True,
                error_code="IMAGE_COMPOSITION",
                message=(
                    "Image appears to contain multiple leaves in one frame. "
                    "Please upload one clear close-up of a single leaf for reliable diagnosis."
                ),
                crop_type=payload.crop_type,
            )

    symptoms = DISEASE_SYMPTOMS.get(disease, [])

    return PredictResponse(
        crop_type=payload.crop_type,
        is_healthy=is_healthy,
        disease=disease,
        confidence=round(confidence, 4),
        severity=severity,
        affected_area_percent=affected_area_percent,
        symptoms=symptoms,
    )


@app.get("/health")
async def health() -> dict:
    model = safe_load_existing_model()
    return {"status": "ok", "model_loaded": model is not None}
