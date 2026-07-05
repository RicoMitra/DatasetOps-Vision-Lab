IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
KNOWN_SPLITS = {"train", "val", "valid", "validation", "test"}
SPLIT_ALIASES = {"valid": "val", "validation": "val"}

LOW_RESOLUTION_PX = 256
BLUR_VARIANCE_THRESHOLD = 30.0
DARK_BRIGHTNESS_THRESHOLD = 30.0
BRIGHT_BRIGHTNESS_THRESHOLD = 225.0
LOW_CONTRAST_THRESHOLD = 12.0
HIGH_CONTRAST_THRESHOLD = 90.0
LARGE_DATASET_IMAGE_COUNT = 5000

RISK_WEIGHTS = {
    "leakage": 30,
    "imbalance": 20,
    "lowResolution": 15,
    "duplicates": 10,
    "blur": 10,
    "brightnessContrast": 10,
    "confusion": 5,
}
