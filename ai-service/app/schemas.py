from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


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
