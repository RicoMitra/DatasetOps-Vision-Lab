# Decision Log

## D-001: Standalone DatasetOps Repo

- **Status:** Accepted
- **Decision:** Build `datasetops-vision-lab` as a standalone repository with `apps/web` and `engine/python`.
- **Rationale:** The project must not be mixed with FlowForger, portfolio dashboard, or any other project.
- **Consequence:** GitHub and Vercel deployment are separate.

## D-002: Python Engine First

- **Status:** Accepted
- **Decision:** Make the Python Audit Engine the canonical audit path and report generator.
- **Rationale:** OpenCV/Python is better suited for offline computer vision metrics than browser-only scanning.
- **Consequence:** The dashboard imports `latest-report.json` rather than requiring browser scans first.

## D-003: Deterministic Recommendations

- **Status:** Accepted
- **Decision:** Recommendations use deterministic rule-based `problem -> evidence -> action` entries.
- **Rationale:** Users can trace every recommendation to visible dataset evidence.
- **Consequence:** No random AI advice or dataset-name-specific suggestions.

## D-004: Transparent V1 Limits

- **Status:** Accepted
- **Decision:** V1 does not perform semantic understanding, near-duplicate detection, training, or classification.
- **Rationale:** The product audits dataset readiness risk, not model correctness.
- **Consequence:** Limitations are shown in docs, reports, and UI.
