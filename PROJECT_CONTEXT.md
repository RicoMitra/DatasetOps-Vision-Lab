# Project Context

## Product Summary

DatasetOps Vision Lab audits local image-classification datasets before training or test evaluation. It combines a Python computer vision engine with a local Next.js dashboard for transparent readiness scoring and evidence-based recommendations.

## Primary User

The primary user is a data science learner or builder preparing image datasets for modeling who needs to catch obvious readiness risks before trusting training or validation results.

## Core Workflow

1. Run the Python engine:

   ```bash
   pnpm engine:scan -- --path ./dataset --out ./reports/latest-report.json
   ```

2. Import `latest-report.json` into the dashboard.
3. Review quality score, class distribution, leakage, duplicates, image quality, corrupt files, and recommendations.
4. Optionally use Browser Fast Scan for quick local folder structure checks.

## Architecture

- `engine/python`: canonical audit engine and report exporters.
- `apps/web`: report viewer and browser Fast Scan dashboard.
- `reports`: local output folder, ignored by git except `.gitkeep`.

## Scoring

`riskScore = weighted sum`, `qualityScore = 100 - riskScore`.

Weights:

- Leakage: 30
- Imbalance: 20
- Low resolution: 15
- Duplicates: 10
- Blur: 10
- Brightness/contrast: 10
- Confusion concentration: 5

## Non-Goals

- Training models
- Classifying image content
- Semantic object understanding
- Near-duplicate/perceptual similarity detection
- Uploading datasets
- Cloud storage or accounts
- Guaranteeing model or test performance improvement
