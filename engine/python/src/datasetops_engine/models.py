from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DatasetImage:
    path: Path
    relative_path: str
    split: str
    label: str
    size_bytes: int


@dataclass(frozen=True)
class ImageMetrics:
    relative_path: str
    label: str
    split: str
    width: int | None
    height: int | None
    blur_score: float | None
    brightness: float | None
    contrast: float | None
    sha256: str | None
    corrupt: bool
    error: str | None = None
