import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "python"
SRC = ENGINE / "src"


def run(command: list[str], cwd: Path = ROOT) -> int:
    env = os.environ.copy()
    existing = env.get("PYTHONPATH")
    env["PYTHONPATH"] = str(SRC) if not existing else f"{SRC}{os.pathsep}{existing}"
    return subprocess.call(command, cwd=cwd, env=env)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python scripts/engine.py [scan|test|demo] ...")
        return 2

    command, args = sys.argv[1], sys.argv[2:]
    if command == "scan":
        return run([sys.executable, "-m", "datasetops_engine", "scan", *args])
    if command == "test":
        return run([sys.executable, "-m", "pytest"], cwd=ENGINE)
    if command == "demo":
        return run(
            [
                sys.executable,
                "-m",
                "datasetops_engine",
                "scan",
                "--path",
                str(ROOT / "samples" / "tiny-dataset"),
                "--out",
                str(ROOT / "reports" / "latest-report.json"),
            ]
        )

    print(f"unknown engine command: {command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
