from collections import defaultdict


def leakage_groups(metrics: list[dict]) -> list[dict]:
    by_hash: dict[str, list[dict]] = defaultdict(list)
    for item in metrics:
        if item.get("sha256"):
            by_hash[item["sha256"]].append(item)

    groups = []
    for hash_value, items in by_hash.items():
        splits = sorted({item["split"] for item in items if item["split"] != "unsplit"})
        if len(splits) > 1:
            groups.append(
                {
                    "hash": hash_value,
                    "count": len(items),
                    "splits": splits,
                    "files": [item["path"] for item in items],
                    "labels": sorted({item["label"] for item in items}),
                }
            )
    return sorted(groups, key=lambda group: group["count"], reverse=True)
