from __future__ import annotations

import base64
import binascii
import io
from typing import Tuple

import numpy as np
from fastapi import HTTPException
from PIL import Image, ImageDraw, UnidentifiedImageError

from .constants import (
    BASE_LEAF_COLOR,
    COMPOSITION_BORDER_PLANT_FRACTION,
    COMPOSITION_MAX_EDGE_DENSITY,
    COMPOSITION_MIN_PLANT_FRACTION,
    DARK_PIXEL_THRESHOLD,
    GREEN_TO_BLUE_RATIO_THRESHOLD,
    MIN_GREEN_FRACTION,
    MIN_WARM_FRACTION,
    NOISE_STD,
    PLANT_PIXEL_THRESHOLD,
    RED_TO_GREEN_RATIO_THRESHOLD,
    SYNTHETIC_IMAGE_SIZE,
)


def _plant_masks(arr: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    chroma = arr.max(axis=2) - arr.min(axis=2)

    green_mask = (g > r + 10) & (g > b + 8) & (g > 55) & (chroma > 20)
    warm_leaf_mask = (
        (r > 70)
        & (g > 60)
        & (b < 120)
        & (r < 190)
        & (g < 180)
        & (np.abs(r - g) < 55)
        & (chroma > 18)
        & ~((r > 200) & (g > 200) & (b > 200))
    )
    plant_mask = green_mask | warm_leaf_mask
    return green_mask, warm_leaf_mask, plant_mask


def decode_image(image_base64: str) -> Image.Image:
    try:
        image_bytes = base64.b64decode(image_base64, validate=True)
    except binascii.Error as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from exc

    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Could not read image") from exc


def is_plant_image(image: Image.Image) -> Tuple[bool, float]:
    """Heuristic plant detector tuned to reject common non-crop photos.

    Returns:
        (is_plant, plant_pixel_fraction)
    """
    small = image.resize((96, 96))
    arr = np.asarray(small).astype(np.float32)
    green_mask, warm_leaf_mask, plant_mask = _plant_masks(arr)
    plant_fraction = float(plant_mask.mean())
    green_fraction = float(green_mask.mean())
    warm_fraction = float(warm_leaf_mask.mean())

    is_plant = (
        plant_fraction >= PLANT_PIXEL_THRESHOLD
        and (
            green_fraction >= MIN_GREEN_FRACTION
            or (warm_fraction >= MIN_WARM_FRACTION and green_fraction >= 0.03)
        )
    )

    return is_plant, plant_fraction


def assess_leaf_composition(image: Image.Image) -> Tuple[bool, str]:
    """Basic framing quality gate before diagnosis."""
    small = image.resize((128, 128))
    arr = np.asarray(small).astype(np.float32)
    _, _, plant_mask = _plant_masks(arr)
    plant_fraction = float(plant_mask.mean())

    if plant_fraction < COMPOSITION_MIN_PLANT_FRACTION:
        return False, "Please upload a closer photo of a single crop leaf."

    return True, ""


def leaf_scene_metrics(image: Image.Image) -> Tuple[float, float, float, int]:
    """Returns plant_fraction, green_std, edge_density, border_touch_count."""
    small = image.resize((128, 128))
    arr = np.asarray(small).astype(np.float32)
    _, _, plant_mask = _plant_masks(arr)
    plant_fraction = float(plant_mask.mean())

    border = 6
    border_fractions = [
        float(plant_mask[:border, :].mean()),
        float(plant_mask[-border:, :].mean()),
        float(plant_mask[:, :border].mean()),
        float(plant_mask[:, -border:].mean()),
    ]
    border_touch_count = int(sum(v > COMPOSITION_BORDER_PLANT_FRACTION for v in border_fractions))

    green_std = float((arr[:, :, 1] / 255.0).std())

    gray = arr.mean(axis=2) / 255.0
    gx = np.abs(np.diff(gray, axis=1))
    gy = np.abs(np.diff(gray, axis=0))
    grad = np.zeros_like(gray)
    grad[:, 1:] += gx
    grad[1:, :] += gy
    edge_density = float((grad > 0.12).mean())

    return plant_fraction, green_std, edge_density, border_touch_count


def compute_severity(image: Image.Image) -> Tuple[str, float]:
    arr = np.asarray(image).astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    gray = arr.mean(axis=2)
    chroma = arr.max(axis=2) - arr.min(axis=2)

    green_mask, warm_leaf_mask, _ = _plant_masks(arr)
    leaf_mask = green_mask | warm_leaf_mask
    leaf_area = float(leaf_mask.sum())
    if leaf_area <= 0:
        return "low", 0.0

    brown_mask = (r > g + 18) & (r > 70) & (b < 150) & (chroma > 22)
    yellow_mask = (r > 145) & (g > 120) & (b < 95) & ((r - b) > 50)
    dark_lesion_mask = (gray < 58) & (chroma > 20) & (r > 45) & (g > 35)
    lesion_mask = (brown_mask | yellow_mask | dark_lesion_mask) & leaf_mask

    affected_pct = min(float(lesion_mask.sum()) / leaf_area * 100.0, 100.0)

    if affected_pct < 8.0:
        severity = "low"
    elif affected_pct < 24.0:
        severity = "medium"
    else:
        severity = "high"

    return severity, round(affected_pct, 1)


def extract_features(image: Image.Image) -> np.ndarray:
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


def draw_spots(
    base: np.ndarray, count: int, color: Tuple[int, int, int], radius: int, rng: np.random.Generator
) -> np.ndarray:
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


def synthetic_leaf(label: str, rng: np.random.Generator) -> Image.Image:
    noise = rng.normal(0, NOISE_STD, size=(SYNTHETIC_IMAGE_SIZE, SYNTHETIC_IMAGE_SIZE, 3))
    leaf = np.clip(BASE_LEAF_COLOR + noise, 0, 255).astype(np.uint8)

    if label == "healthy":
        pass
    elif label in ("tomato_early_blight", "potato_early_blight"):
        leaf = draw_spots(leaf, 18, (160, 120, 60), 6, rng)
    elif label in ("tomato_late_blight", "potato_late_blight"):
        leaf = np.clip(leaf * 0.8, 0, 255).astype(np.uint8)
        leaf = draw_spots(leaf, 12, (70, 60, 70), 10, rng)
    elif label == "tomato_septoria_leaf_spot":
        leaf = draw_spots(leaf, 30, (200, 200, 170), 3, rng)
    elif label == "tomato_leaf_mold":
        leaf = draw_spots(leaf, 10, (180, 170, 120), 8, rng)
    elif label == "corn_northern_leaf_blight":
        leaf = draw_spots(leaf, 8, (150, 130, 80), 12, rng)
    elif label == "corn_common_rust":
        leaf = draw_spots(leaf, 40, (180, 100, 50), 3, rng)
    return Image.fromarray(leaf)
