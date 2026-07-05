import { describe, expect, test } from "vitest";

import { buildSummary, parseReportJson, saveSummary } from "./report";

const validReport = {
  version: "datasetops-report-v1",
  createdAt: "2026-07-05T00:00:00.000Z",
  dataset: {
    path: "C:/data/waste",
    totalImages: 7,
    validImages: 6,
    corruptImages: 1,
    splits: { train: 4, val: 3 },
    warnings: ["Dataset has 5001 images; run Browser Fast Scan first."],
  },
  classes: {
    organic: { count: 5, splits: { train: 3, val: 2 } },
    recyclable: { count: 2, splits: { train: 1, val: 1 } },
  },
  imbalance: {
    minorityClass: "recyclable",
    majorityClass: "organic",
    minorityClassShare: 0.2857,
    majorityToMinorityRatio: 2.5,
    isImbalanced: false,
  },
  quality: {
    lowResolutionImages: 2,
    blurredImages: 1,
    brightnessOutliers: 1,
    contrastOutliers: 1,
    averages: { width: 312, height: 298, blurScore: 42.3, brightness: 118.2, contrast: 24.1 },
  },
  duplicates: { exactDuplicateGroups: 1, groups: [] },
  leakage: { leakedGroups: 1, groups: [] },
  confusion: null,
  score: {
    riskScore: 47.2,
    qualityScore: 52.8,
    factors: { leakage: 30, imbalance: 0, lowResolution: 4.3, duplicates: 1.4, blur: 1.4, brightnessContrast: 1.4, confusion: 0 },
    weights: { leakage: 30, imbalance: 20, lowResolution: 15, duplicates: 10, blur: 10, brightnessContrast: 10, confusion: 5 },
  },
  recommendations: [
    {
      severity: "high",
      problem: "Exact duplicate images appear across train/validation/test splits.",
      evidence: "1 hash group crosses split boundaries.",
      action: "Remove leaked duplicates before trusting validation or test scores.",
    },
  ],
  limitations: [
    "No semantic object understanding.",
    "No near-duplicate detection in v1.",
    "No guarantee test performance improves; this tool audits readiness risk only.",
  ],
};

describe("report parsing", () => {
  test("accepts valid latest-report.json and builds persisted summary", () => {
    const report = parseReportJson(JSON.stringify(validReport));
    const summary = buildSummary(report);

    expect(summary.datasetPath).toBe("C:/data/waste");
    expect(summary.qualityScore).toBe(52.8);
    expect(summary.totalImages).toBe(7);
    expect(summary.topRisk).toBe("leakage");
  });

  test("rejects invalid report shape", () => {
    expect(() => parseReportJson(JSON.stringify({ version: "wrong" }))).toThrow("Invalid DatasetOps report");
  });

  test("persists only summary, not files or image bytes", () => {
    const report = parseReportJson(JSON.stringify({ ...validReport, files: [{ path: "train/a.jpg", sha256: "abc" }] }));
    saveSummary(report);

    const stored = window.localStorage.getItem("datasetops:summary:v1");
    expect(stored).toContain("\"datasetPath\"");
    expect(stored).not.toContain("train/a.jpg");
    expect(stored).not.toContain("abc");
  });
});
