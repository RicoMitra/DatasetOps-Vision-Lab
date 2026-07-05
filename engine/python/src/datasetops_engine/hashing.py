from collections import defaultdict
from hashlib import sha256
from pathlib import Path


def file_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def duplicate_groups(metrics: list[dict]) -> list[dict]:
    by_hash: dict[str, list[dict]] = defaultdict(list)
    for item in metrics:
        if item.get("sha256"):
            by_hash[item["sha256"]].append(item)

    groups = []
    for hash_value, items in by_hash.items():
        if len(items) > 1:
            groups.append(
                {
                    "hash": hash_value,
                    "count": len(items),
                    "files": [item["path"] for item in items],
                    "labels": sorted({item["label"] for item in items}),
                    "splits": sorted({item["split"] for item in items}),
                }
            )
    return sorted(groups, key=lambda group: group["count"], reverse=True)
