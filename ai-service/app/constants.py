from __future__ import annotations

import numpy as np

MODEL_RANDOM_SEED = 7
SAMPLES_PER_CLASS = 80
MODEL_MAX_ITERATIONS = 600
SYNTHETIC_IMAGE_SIZE = 128
BASE_LEAF_COLOR = np.array([40, 140, 50], dtype=np.float32)
NOISE_STD = 18.0
RED_TO_GREEN_RATIO_THRESHOLD = 1.05
GREEN_TO_BLUE_RATIO_THRESHOLD = 0.9
DARK_PIXEL_THRESHOLD = 0.35

# Non-plant rejection thresholds.
PLANT_PIXEL_THRESHOLD = 0.18
MIN_GREEN_FRACTION = 0.07
MIN_WARM_FRACTION = 0.20

# Confidence guardrails.
MIN_ALLOWED_CONFIDENCE = 0.35
LOW_MARGIN_CONFIDENCE = 0.60
MIN_MARGIN_BETWEEN_TOP2 = 0.08
MIN_ALLOWED_CROP_PROBABILITY_MASS = 0.10
MIN_DISEASE_CONFIDENCE = 0.50
LOW_CONF_DISEASE_MAX_AFFECTED_AREA = 8.0

# Image composition guardrails.
COMPOSITION_MIN_PLANT_FRACTION = 0.22
COMPOSITION_BORDER_PLANT_FRACTION = 0.56
COMPOSITION_MAX_EDGE_DENSITY = 0.34
SCENE_CLUTTER_CONFIDENCE_LIMIT = 0.65
SCENE_CLUTTER_MAX_AFFECTED_AREA = 12.0
SCENE_CLUTTER_MIN_PLANT_FRACTION = 0.90
SCENE_CLUTTER_MIN_GREEN_STD = 0.12
SCENE_CLUTTER_MIN_BORDER_TOUCHES = 3

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

CROP_TO_DISEASES = {
    "tomato": {
        "healthy",
        "tomato_early_blight",
        "tomato_late_blight",
        "tomato_septoria_leaf_spot",
        "tomato_leaf_mold",
    },
    "potato": {
        "healthy",
        "potato_early_blight",
        "potato_late_blight",
    },
    "corn": {
        "healthy",
        "corn_northern_leaf_blight",
        "corn_common_rust",
    },
}

DISEASE_SYMPTOMS = {
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
