from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict

app = FastAPI(title="KrishiMitra AI Service")


class PredictRequest(BaseModel):
    crop_type: str
    image_base64: str


class PredictResponse(BaseModel):
    disease: str
    confidence: float


# Simple demo classifier
DEMO_RESULTS: Dict[str, Dict[str, float]] = {
    "tomato": {"late_blight": 0.83},
    "potato": {"early_blight": 0.78},
    "corn": {"healthy": 0.91},
}


@app.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    disease_map = DEMO_RESULTS.get(payload.crop_type.lower(), {"unknown": 0.4})
    disease, confidence = next(iter(disease_map.items()))
    return PredictResponse(disease=disease, confidence=confidence)


@app.get("/health")
async def health():
    return {"status": "ok"}
