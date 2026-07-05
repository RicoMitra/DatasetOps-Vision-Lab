import csv
import json
from pathlib import Path


def write_outputs(report: dict, output_json: Path) -> None:
    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(report, indent=2), encoding="utf-8")

    rows = report["files"]
    _write_csv(
        output_json.parent / "dataset-audit.csv",
        rows,
        ["path", "split", "label", "width", "height", "blurScore", "brightness", "contrast", "sha256", "corrupt"],
    )
    _write_csv(
        output_json.parent / "bad-images.csv",
        [row for row in rows if row.get("corrupt")],
        ["path", "split", "label", "error"],
    )
    _write_group_csv(output_json.parent / "duplicates.csv", report["duplicates"]["groups"])
    _write_group_csv(output_json.parent / "leakage.csv", report["leakage"]["groups"])

    recommendations = ["# DatasetOps Recommendations", ""]
    for rec in report["recommendations"]:
        recommendations.extend(
            [
                f"## {rec['severity'].title()} - {rec['problem']}",
                f"- Evidence: {rec['evidence']}",
                f"- Action: {rec['action']}",
                "",
            ]
        )
    (output_json.parent / "recommendations.md").write_text("\n".join(recommendations), encoding="utf-8")


def _write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def _write_group_csv(path: Path, groups: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=["hash", "count", "splits", "labels", "files"])
        writer.writeheader()
        for group in groups:
            writer.writerow(
                {
                    "hash": group["hash"],
                    "count": group["count"],
                    "splits": ";".join(group.get("splits", [])),
                    "labels": ";".join(group.get("labels", [])),
                    "files": ";".join(group.get("files", [])),
                }
            )
