import csv
import json
from pathlib import Path

import pytest
from jsonschema import validate
from PIL import Image, ImageFilter

from datasetops_engine.cli import main
from datasetops_engine.confusion import parse_confusion_csv
from datasetops_engine.report_schema import REPORT_SCHEMA
from datasetops_engine.scanner import scan_dataset


def write_image(path: Path, color=(120, 120, 120), size=(320, 320), blur=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", size, color=color)
    if blur:
        image = image.filter(ImageFilter.GaussianBlur(radius=8))
    image.save(path)


def write_corrupt(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"not-an-image")


def test_scans_train_val_test_dataset_and_writes_json_schema(tmp_path):
    dataset = tmp_path / "dataset"
    write_image(dataset / "train" / "organic" / "a.jpg", (40, 80, 40))
    write_image(dataset / "train" / "organic" / "b.jpg", (42, 84, 42))
    write_image(dataset / "train" / "recyclable" / "c.jpg", (180, 180, 200), size=(220, 220))
    write_image(dataset / "val" / "organic" / "a-copy.jpg", (40, 80, 40))
    write_corrupt(dataset / "test" / "recyclable" / "broken.jpg")

    report = scan_dataset(dataset)

    assert report["dataset"]["totalImages"] == 5
    assert report["dataset"]["validImages"] == 4
    assert report["dataset"]["corruptImages"] == 1
    assert report["dataset"]["splits"]["train"] == 3
    assert report["dataset"]["splits"]["val"] == 1
    assert report["classes"]["organic"]["count"] == 3
    assert report["classes"]["recyclable"]["count"] == 2
    assert report["duplicates"]["exactDuplicateGroups"] >= 1
    assert report["leakage"]["leakedGroups"] >= 1
    assert report["quality"]["lowResolutionImages"] == 1
    assert report["score"]["riskScore"] > 0
    assert report["score"]["qualityScore"] == 100 - report["score"]["riskScore"]
    validate(instance=report, schema=REPORT_SCHEMA)


def test_scans_unsplit_folder_dataset(tmp_path):
    dataset = tmp_path / "dataset"
    write_image(dataset / "cats" / "cat-1.png")
    write_image(dataset / "dogs" / "dog-1.png")

    report = scan_dataset(dataset)

    assert report["dataset"]["splits"]["unsplit"] == 2
    assert set(report["classes"]) == {"cats", "dogs"}


def test_blur_brightness_contrast_and_recommendation_evidence(tmp_path):
    dataset = tmp_path / "dataset"
    write_image(dataset / "train" / "label-a" / "sharp.jpg", color=(10, 240, 10), size=(512, 512))
    write_image(dataset / "train" / "label-a" / "blurred.jpg", color=(100, 100, 100), size=(512, 512), blur=True)
    write_image(dataset / "train" / "label-b" / "dark.jpg", color=(5, 5, 5), size=(128, 128))

    report = scan_dataset(dataset)

    assert report["quality"]["blurredImages"] >= 1
    assert report["quality"]["brightnessOutliers"] >= 1
    assert report["quality"]["contrastOutliers"] >= 1
    assert any(
        rec["problem"] and rec["evidence"] and rec["action"]
        for rec in report["recommendations"]
    )


def test_confusion_matrix_parser_finds_label_pair(tmp_path):
    matrix = tmp_path / "confusion.csv"
    with matrix.open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["actual", "predicted"])
        writer.writerows(
            [
                ["Organic", "Recyclable"],
                ["Organic", "Recyclable"],
                ["Organic", "Organic"],
                ["Recyclable", "Recyclable"],
            ]
        )

    result = parse_confusion_csv(matrix)

    assert result["total"] == 4
    assert result["topPairs"][0]["actual"] == "Organic"
    assert result["topPairs"][0]["predicted"] == "Recyclable"
    assert result["topPairs"][0]["count"] == 2


def test_cli_writes_all_report_files(tmp_path):
    dataset = tmp_path / "dataset"
    output = tmp_path / "reports" / "latest-report.json"
    write_image(dataset / "train" / "minority" / "a.jpg")
    for index in range(4):
        write_image(dataset / "train" / "majority" / f"{index}.jpg", color=(20 + index, 20, 20))

    exit_code = main(["scan", "--path", str(dataset), "--out", str(output)])

    assert exit_code == 0
    assert output.exists()
    report = json.loads(output.read_text())
    validate(instance=report, schema=REPORT_SCHEMA)
    for filename in [
        "dataset-audit.csv",
        "bad-images.csv",
        "duplicates.csv",
        "leakage.csv",
        "recommendations.md",
    ]:
        assert (output.parent / filename).exists()
    assert report["imbalance"]["minorityClassShare"] < 0.3
