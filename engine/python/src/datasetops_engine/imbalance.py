def class_distribution(metrics: list[dict]) -> dict:
    distribution: dict[str, dict] = {}
    for item in metrics:
        label = item["label"]
        distribution.setdefault(label, {"count": 0, "splits": {}})
        distribution[label]["count"] += 1
        distribution[label]["splits"][item["split"]] = distribution[label]["splits"].get(item["split"], 0) + 1
    return dict(sorted(distribution.items()))


def imbalance_summary(classes: dict) -> dict:
    if not classes:
        return {
            "minorityClass": None,
            "majorityClass": None,
            "minorityClassShare": 0,
            "majorityToMinorityRatio": 0,
            "isImbalanced": False,
        }

    total = sum(item["count"] for item in classes.values())
    minority_label, minority = min(classes.items(), key=lambda pair: pair[1]["count"])
    majority_label, majority = max(classes.items(), key=lambda pair: pair[1]["count"])
    minority_share = minority["count"] / total if total else 0
    ratio = majority["count"] / minority["count"] if minority["count"] else 0

    return {
        "minorityClass": minority_label,
        "majorityClass": majority_label,
        "minorityClassShare": round(minority_share, 4),
        "majorityToMinorityRatio": round(ratio, 3),
        "isImbalanced": len(classes) > 1 and (minority_share < 0.2 or ratio >= 3),
    }
