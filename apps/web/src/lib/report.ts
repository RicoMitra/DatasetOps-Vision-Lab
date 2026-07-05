export type RiskFactorKey =
  | "leakage"
  | "imbalance"
  | "lowResolution"
  | "duplicates"
  | "blur"
  | "brightnessContrast"
  | "confusion";

export type Recommendation = {
  severity: "low" | "medium" | "high" | string;
  problem: string;
  evidence: string;
  action: string;
};

export type DatasetOpsReport = {
  version: "datasetops-report-v1";
  createdAt?: string;
  dataset: {
    path: string;
    totalImages: number;
    validImages: number;
    corruptImages: number;
    splits: Record<string, number>;
    warnings?: string[];
  };
  classes: Record<string, { count: number; splits: Record<string, number> }>;
  imbalance: {
    minorityClass: string | null;
    majorityClass: string | null;
    minorityClassShare: number;
    majorityToMinorityRatio: number;
    isImbalanced: boolean;
  };
  quality: {
    lowResolutionImages: number;
    blurredImages: number;
    brightnessOutliers: number;
    contrastOutliers: number;
    averages: Record<string, number>;
  };
  duplicates: { exactDuplicateGroups: number; groups: unknown[] };
  leakage: { leakedGroups: number; groups: unknown[] };
  confusion: null | { total: number; errors: number; errorRate?: number; topPairs: Array<Record<string, unknown>> };
  score: {
    riskScore: number;
    qualityScore: number;
    factors: Record<RiskFactorKey, number>;
    weights: Record<RiskFactorKey, number>;
  };
  recommendations: Recommendation[];
  limitations: string[];
};

export type ReportSummary = {
  datasetPath: string;
  totalImages: number;
  qualityScore: number;
  riskScore: number;
  topRisk: string;
  importedAt: string;
};

const STORAGE_KEY = "datasetops:summary:v1";

export function parseReportJson(raw: string): DatasetOpsReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid DatasetOps report: JSON could not be parsed.");
  }

  if (!isReport(parsed)) {
    throw new Error("Invalid DatasetOps report: expected datasetops-report-v1 schema.");
  }
  return parsed;
}

export function buildSummary(report: DatasetOpsReport): ReportSummary {
  const factors = Object.entries(report.score.factors);
  const [topRisk] = factors.sort((a, b) => b[1] - a[1])[0] ?? ["none", 0];
  return {
    datasetPath: report.dataset.path,
    totalImages: report.dataset.totalImages,
    qualityScore: report.score.qualityScore,
    riskScore: report.score.riskScore,
    topRisk,
    importedAt: new Date().toISOString(),
  };
}

export function saveSummary(report: DatasetOpsReport) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSummary(report)));
}

export function loadSummary(): ReportSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ReportSummary) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReport(value: unknown): value is DatasetOpsReport {
  if (!isRecord(value)) return false;
  if (value.version !== "datasetops-report-v1") return false;
  if (!isRecord(value.dataset) || !isRecord(value.score)) return false;
  if (!isRecord(value.classes) || !isRecord(value.quality)) return false;
  if (!Array.isArray(value.recommendations) || !Array.isArray(value.limitations)) return false;
  return (
    typeof value.dataset.path === "string" &&
    typeof value.dataset.totalImages === "number" &&
    typeof value.dataset.validImages === "number" &&
    typeof value.dataset.corruptImages === "number" &&
    isRecord(value.dataset.splits) &&
    typeof value.score.riskScore === "number" &&
    typeof value.score.qualityScore === "number" &&
    isRecord(value.score.factors) &&
    value.recommendations.every(
      (item) =>
        isRecord(item) &&
        typeof item.problem === "string" &&
        typeof item.evidence === "string" &&
        typeof item.action === "string",
    )
  );
}
