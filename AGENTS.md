# Project Governance

## Owner

This project is owned by **Rico Majesty Daniel Mitra** ([@RicoMitra](https://github.com/RicoMitra)).

## Purpose

DatasetOps Vision Lab is a local-first web dashboard and Python audit engine for inspecting image-classification datasets before modeling. It helps users understand readiness risk from folder structure, class counts, image quality, exact duplicates, split leakage, optional confusion matrix errors, and deterministic recommendations.

The product is not an AI labeling system, training pipeline, semantic object inspector, or model-performance guarantee.

## Required Stack

- Next.js with TypeScript for the local dashboard in `apps/web`
- Tailwind CSS and local shadcn-compatible primitives
- Recharts for dashboard visualizations
- Python 3.11+ audit engine in `engine/python`
- OpenCV, Pillow, NumPy, and pytest for computer vision audit work
- pnpm as the JavaScript package manager
- Vercel for the standalone web deployment

## Data And Privacy

- No accounts, no cloud database, no paid API.
- Browser Fast Scan and report import run locally in the browser.
- Python Audit Engine reads only local folders provided by the user.
- Store only summaries/settings in `localStorage`; never persist image bytes in the web app.
- Do not send dataset images, labels, hashes, or reports to third parties.

## Decision Policy

Use deterministic, evidence-based rules. Every recommendation must contain:

```text
problem -> evidence -> action
```

Do not add random AI advice, dataset-name-specific assumptions, training, classification, cloud sync, authentication, or external APIs without owner approval.

## Scan Priorities

1. Python Audit Engine: canonical `latest-report.json`.
2. Next.js dashboard: import/read report.
3. Browser Fast Scan: quick structure/class scan.
4. Browser Deep Scan: optional later.

## Limitations

- No semantic object understanding.
- No near-duplicate detection in v1.
- No guarantee test performance improves; this tool audits readiness risk only.
- Python engine does not train or classify images in v1.

## Completion Rules

Before marking work complete, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm engine:test
pnpm build
pnpm test:e2e
```

Perform browser QA on desktop and mobile. Do not update Obsidian for this project unless explicitly requested later.
