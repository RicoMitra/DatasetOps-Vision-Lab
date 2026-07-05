import csv
from collections import Counter
from pathlib import Path


def parse_confusion_csv(path: Path | None) -> dict | None:
    if path is None:
        return None

    with path.open(newline="", encoding="utf-8") as file:
        rows = list(csv.reader(file))

    if not rows:
        return {"total": 0, "errors": 0, "topPairs": [], "labels": []}

    header = [cell.strip() for cell in rows[0]]
    pairs: Counter[tuple[str, str]] = Counter()
    total = 0
    labels = set()

    if len(header) >= 2 and header[0].lower() == "actual" and header[1].lower() == "predicted":
        for row in rows[1:]:
            if len(row) < 2:
                continue
            actual, predicted = row[0].strip(), row[1].strip()
            if not actual or not predicted:
                continue
            total += 1
            labels.update([actual, predicted])
            if actual != predicted:
                pairs[(actual, predicted)] += 1
    else:
        predicted_labels = header[1:]
        labels.update(predicted_labels)
        for row in rows[1:]:
            if not row:
                continue
            actual = row[0].strip()
            labels.add(actual)
            for predicted, raw_count in zip(predicted_labels, row[1:]):
                try:
                    count = int(raw_count)
                except ValueError:
                    count = 0
                total += count
                if actual != predicted and count:
                    pairs[(actual, predicted)] += count

    top_pairs = [
        {"actual": actual, "predicted": predicted, "count": count}
        for (actual, predicted), count in pairs.most_common(5)
    ]
    return {
        "total": total,
        "errors": sum(pairs.values()),
        "errorRate": round(sum(pairs.values()) / total, 4) if total else 0,
        "topPairs": top_pairs,
        "labels": sorted(labels),
    }
