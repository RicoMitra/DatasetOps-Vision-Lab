from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from .confusion import parse_confusion_csv
from .constants import IMAGE_EXTENSIONS, KNOWN_SPLITS, LARGE_DATASET_IMAGE_COUNT, SPLIT_ALIASES
from .hashing import duplicate_groups, file_sha256
from .image_quality import (
    is_blurred,
    is_brightness_outlier,
    is_contrast_outlier,
    is_low_resolution,
    read_image_metrics,
)
from .imbalance import class_distribution, imbalance_summary
from .leakage import leakage_groups
from .recommendation import build_recommendations
from .scoring import score_report


def scan_dataset(dataset_path: str | Path, confusion_path: str | Path | None = None) -> dict:
    root = Path(dataset_path).resolve()
    files = discover_images(root)
    metrics = [_inspect_file(root, item) for item in files]

    split_counts = Counter(item["split"] for item in metrics)
    classes = class_distribution(metrics)
    imbalance = imbalance_summary(classes)
    duplicates = duplicate_groups(metrics)
    leaked = leakage_groups(metrics)
    confusion = parse_confusion_csv(Path(confusion_path)) if confusion_path else None

    total_images = len(metrics)
    corrupt_images = sum(1 for item in metrics if item["corrupt"])
    low_resolution_images = sum(1 for item in metrics if is_low_resolution(item["width"], item["height"]))
    blurred_images = sum(1 for item in metrics if is_blurred(item["blurScore"]))
    brightness_outliers = sum(1 for item in metrics if is_brightness_outlier(item["brightness"]))
    contrast_outliers = sum(1 for item in metrics if is_contrast_outlier(item["contrast"]))

    warnings = []
    if total_images > LARGE_DATASET_IMAGE_COUNT:
        warnings.append(
            f"Dataset has {total_images} images; run Browser Fast Scan or a sampled audit first before a full scan."
        )

    score = score_report(
        total_images=total_images,
        low_resolution_images=low_resolution_images,
        blurred_images=blurred_images,
        brightness_outliers=brightness_outliers,
        contrast_outliers=contrast_outliers,
        duplicate_groups_count=len(duplicates),
        leakage_groups_count=len(leaked),
        imbalance=imbalance,
        confusion=confusion,
    )

    report = {
        "version": "datasetops-report-v1",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "path": str(root),
            "totalImages": total_images,
            "validImages": total_images - corrupt_images,
            "corruptImages": corrupt_images,
            "splits": dict(sorted(split_counts.items())),
            "warnings": warnings,
        },
        "classes": classes,
        "imbalance": imbalance,
        "quality": {
            "lowResolutionImages": low_resolution_images,
            "blurredImages": blurred_images,
            "brightnessOutliers": brightness_outliers,
            "contrastOutliers": contrast_outliers,
            "averages": _quality_averages(metrics),
        },
        "duplicates": {
            "exactDuplicateGroups": len(duplicates),
            "groups": duplicates,
        },
        "leakage": {
            "leakedGroups": len(leaked),
            "groups": leaked,
        },
        "confusion": confusion,
        "score": score,
        "files": metrics,
        "recommendations": [],
        "limitations": [
            "No semantic object understanding.",
            "No near-duplicate detection in v1.",
            "No guarantee test performance improves; this tool audits readiness risk only.",
            "Python engine does not train or classify images in v1.",
        ],
    }
    report["recommendations"] = build_recommendations(report)
    return report


def discover_images(root: Path) -> list[Path]:
    if not root.exists():
        raise FileNotFoundError(f"Dataset path does not exist: {root}")
    if not root.is_dir():
        raise NotADirectoryError(f"Dataset path is not a directory: {root}")
    return sorted(path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)


def infer_split_label(root: Path, path: Path) -> tuple[str, str]:
    rel_parts = path.relative_to(root).parts
    if len(rel_parts) < 2:
        return "unsplit", "unlabeled"
    first = rel_parts[0].lower()
    if first in KNOWN_SPLITS and len(rel_parts) >= 3:
        split = SPLIT_ALIASES.get(first, first)
        return split, rel_parts[1]
    return "unsplit", rel_parts[0]


def _inspect_file(root: Path, path: Path) -> dict:
    split, label = infer_split_label(root, path)
    relative_path = path.relative_to(root).as_posix()
    metrics = read_image_metrics(path)
    hash_value = None if metrics["corrupt"] else file_sha256(path)
    return {
        "path": relative_path,
        "split": split,
        "label": label,
        "sizeBytes": path.stat().st_size,
        "width": metrics["width"],
        "height": metrics["height"],
        "blurScore": metrics["blurScore"],
        "brightness": metrics["brightness"],
        "contrast": metrics["contrast"],
        "sha256": hash_value,
        "corrupt": metrics["corrupt"],
        "error": metrics["error"],
    }


def _quality_averages(metrics: list[dict]) -> dict:
    valid = [item for item in metrics if not item["corrupt"]]
    if not valid:
        return {"width": 0, "height": 0, "blurScore": 0, "brightness": 0, "contrast": 0}

    def avg(key: str) -> float:
        values = [item[key] for item in valid if item[key] is not None]
        return round(sum(values) / len(values), 3) if values else 0

    return {
        "width": avg("width"),
        "height": avg("height"),
        "blurScore": avg("blurScore"),
        "brightness": avg("brightness"),
        "contrast": avg("contrast"),
    }
