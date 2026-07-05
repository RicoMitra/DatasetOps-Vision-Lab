# DatasetOps Vision Lab

Local-first image dataset audit dashboard with a Python computer vision engine.

DatasetOps Vision Lab audits image-classification datasets before modeling. It reads local folders, calculates transparent readiness metrics, generates `latest-report.json`, and visualizes the result in a premium Next.js dashboard.

## Features

- Python Audit Engine for local/offline image dataset scans
- Folder parsing for `train/val/test/<label>` and unsplit `<label>` datasets
- Class distribution and imbalance detection
- Resolution, blur, brightness, contrast, and corrupt image checks
- SHA-256 exact duplicate and train/val/test leakage detection
- Optional confusion matrix CSV parser
- Deterministic weighted risk score and quality score
- Evidence-based recommendations: `problem -> evidence -> action`
- Next.js dashboard for importing `latest-report.json`
- Browser Fast Scan for quick folder/class checks

## Limitations

- No semantic object understanding.
- No near-duplicate detection in v1.
- No training or classification in v1.
- No guarantee test performance improves; this tool audits readiness risk only.

## Structure

```text
apps/web/        Next.js dashboard
engine/python/   Python audit engine
reports/         Local report outputs, gitignored
```

## Setup

```bash
pnpm install
python -m pip install pytest jsonschema opencv-python pillow numpy
```

For local engine commands from this repo, set Python path if the package is not installed:

```powershell
$env:PYTHONPATH="engine/python/src"
```

## Run Python Audit

```bash
pnpm engine:scan -- --path ./dataset --out ./reports/latest-report.json
```

Outputs:

- `latest-report.json`
- `dataset-audit.csv`
- `bad-images.csv`
- `duplicates.csv`
- `leakage.csv`
- `recommendations.md`

## Run Dashboard

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), then import `reports/latest-report.json`.

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm engine:test
pnpm build
pnpm test:e2e
```

## Deployment

Deploy `apps/web` as a standalone Vercel project named `datasetops-vision-lab`. No environment variables are required.
