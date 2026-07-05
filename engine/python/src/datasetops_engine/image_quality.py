from pathlib import Path

import cv2
import numpy as np

from .constants import (
    BLUR_VARIANCE_THRESHOLD,
    BRIGHT_BRIGHTNESS_THRESHOLD,
    DARK_BRIGHTNESS_THRESHOLD,
    HIGH_CONTRAST_THRESHOLD,
    LOW_CONTRAST_THRESHOLD,
    LOW_RESOLUTION_PX,
)


def read_image_metrics(path: Path) -> dict:
    try:
        encoded = np.fromfile(path, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    except OSError:
        image = None
    if image is None:
        return {
            "width": None,
            "height": None,
            "blurScore": None,
            "brightness": None,
            "contrast": None,
            "corrupt": True,
            "error": "OpenCV could not decode this image.",
        }

    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    return {
        "width": int(width),
        "height": int(height),
        "blurScore": round(blur_score, 3),
        "brightness": round(brightness, 3),
        "contrast": round(contrast, 3),
        "corrupt": False,
        "error": None,
    }


def is_low_resolution(width: int | None, height: int | None) -> bool:
    return width is not None and height is not None and min(width, height) < LOW_RESOLUTION_PX


def is_blurred(blur_score: float | None) -> bool:
    return blur_score is not None and blur_score < BLUR_VARIANCE_THRESHOLD


def is_brightness_outlier(brightness: float | None) -> bool:
    return brightness is not None and (
        brightness < DARK_BRIGHTNESS_THRESHOLD or brightness > BRIGHT_BRIGHTNESS_THRESHOLD
    )


def is_contrast_outlier(contrast: float | None) -> bool:
    return contrast is not None and (
        contrast < LOW_CONTRAST_THRESHOLD or contrast > HIGH_CONTRAST_THRESHOLD
    )
