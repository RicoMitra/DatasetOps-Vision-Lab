from .constants import RISK_WEIGHTS


def score_report(
    total_images: int,
    low_resolution_images: int,
    blurred_images: int,
    brightness_outliers: int,
    contrast_outliers: int,
    duplicate_groups_count: int,
    leakage_groups_count: int,
    imbalance: dict,
    confusion: dict | None,
) -> dict:
    if total_images <= 0:
        factors = {key: 0 for key in RISK_WEIGHTS}
    else:
        factors = {
            "leakage": RISK_WEIGHTS["leakage"] if leakage_groups_count else 0,
            "imbalance": RISK_WEIGHTS["imbalance"] if imbalance.get("isImbalanced") else 0,
            "lowResolution": round(RISK_WEIGHTS["lowResolution"] * min(1, low_resolution_images / total_images), 2),
            "duplicates": round(RISK_WEIGHTS["duplicates"] * min(1, duplicate_groups_count / max(total_images, 1)), 2),
            "blur": round(RISK_WEIGHTS["blur"] * min(1, blurred_images / total_images), 2),
            "brightnessContrast": round(
                RISK_WEIGHTS["brightnessContrast"]
                * min(1, (brightness_outliers + contrast_outliers) / max(total_images * 2, 1)),
                2,
            ),
            "confusion": RISK_WEIGHTS["confusion"] if confusion and confusion.get("topPairs") else 0,
        }

    risk_score = min(100, round(sum(factors.values()), 2))
    return {
        "riskScore": risk_score,
        "qualityScore": round(100 - risk_score, 2),
        "factors": factors,
        "weights": RISK_WEIGHTS,
    }
