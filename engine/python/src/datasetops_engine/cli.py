import argparse
from pathlib import Path

from .report_exporter import write_outputs
from .scanner import scan_dataset


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="datasetops_engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan = subparsers.add_parser("scan", help="Audit a local image-classification dataset.")
    scan.add_argument("--path", required=True, help="Dataset folder path.")
    scan.add_argument("--out", required=True, help="Output latest-report.json path.")
    scan.add_argument("--confusion", help="Optional confusion matrix CSV.")

    args = parser.parse_args(argv)
    if args.command == "scan":
        report = scan_dataset(Path(args.path), Path(args.confusion) if args.confusion else None)
        write_outputs(report, Path(args.out))
        for warning in report["dataset"].get("warnings", []):
            print(f"warning: {warning}")
        print(f"wrote {Path(args.out).name}")
        return 0
    return 1
