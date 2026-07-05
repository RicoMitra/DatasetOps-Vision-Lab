REPORT_SCHEMA = {
    "type": "object",
    "required": [
        "version",
        "dataset",
        "classes",
        "imbalance",
        "quality",
        "duplicates",
        "leakage",
        "score",
        "recommendations",
        "limitations",
    ],
    "properties": {
        "version": {"type": "string"},
        "dataset": {
            "type": "object",
            "required": ["path", "totalImages", "validImages", "corruptImages", "splits"],
        },
        "classes": {"type": "object"},
        "imbalance": {"type": "object"},
        "quality": {"type": "object"},
        "duplicates": {"type": "object"},
        "leakage": {"type": "object"},
        "confusion": {"type": ["object", "null"]},
        "score": {
            "type": "object",
            "required": ["riskScore", "qualityScore", "factors", "weights"],
        },
        "recommendations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["severity", "problem", "evidence", "action"],
            },
        },
        "limitations": {"type": "array"},
    },
}
