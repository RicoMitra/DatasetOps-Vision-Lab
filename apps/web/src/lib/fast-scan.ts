import type { Recommendation } from "./report";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "bmp", "webp", "tif", "tiff"]);
const SPLITS = new Set(["train", "val", "valid", "validation", "test"]);
const LARGE_DATASET_COUNT = 5000;

export type FastScanResult = {
  totalImages: number;
  totalBytes: number;
  splits: Record<string, number>;
  classes: Record<string, { count: number; splits: Record<string, number> }>;
  warnings: string[];
  riskScore: number;
  qualityScore: number;
  recommendations: Recommendation[];
};

export function runBrowserFastScan(files: File[]): FastScanResult {
  const imageFiles = files.filter(isImageFile);
  const classes: FastScanResult["classes"] = {};
  const splits: Record<string, number> = {};
  let totalBytes = 0;

  for (const file of imageFiles) {
    const parsed = parseDatasetPath(getRelativePath(file));
    totalBytes += file.size;
    splits[parsed.split] = (splits[parsed.split] ?? 0) + 1;
    classes[parsed.label] ??= { count: 0, splits: {} };
    classes[parsed.label].count += 1;
    classes[parsed.label].splits[parsed.split] = (classes[parsed.label].splits[parsed.split] ?? 0) + 1;
  }

  const warnings =
    imageFiles.length > LARGE_DATASET_COUNT
      ? [
          `Dataset has ${imageFiles.length.toLocaleString("en-US")} images; use Fast Scan first before Deep Scan or Python full audit.`,
        ]
      : [];
  const imbalance = getImbalance(classes);
  const riskScore = Math.min(100, Math.round((imbalance.isImbalanced ? 20 : 0) + (warnings.length ? 5 : 0)));

  return {
    totalImages: imageFiles.length,
    totalBytes,
    splits,
    classes,
    warnings,
    riskScore,
    qualityScore: 100 - riskScore,
    recommendations: buildFastRecommendations(imageFiles.length, warnings, imbalance),
  };
}

function isImageFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(extension);
}

function getRelativePath(file: File) {
  const withRelativePath = file as File & { webkitRelativePath?: string };
  return withRelativePath.webkitRelativePath || file.name;
}

function parseDatasetPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const splitIndex = parts.findIndex((part) => SPLITS.has(part.toLowerCase()));
  if (splitIndex >= 0 && parts[splitIndex + 1]) {
    const rawSplit = parts[splitIndex].toLowerCase();
    return {
      split: rawSplit === "valid" || rawSplit === "validation" ? "val" : rawSplit,
      label: parts[splitIndex + 1],
    };
  }

  if (parts.length >= 3) return { split: "unsplit", label: parts[1] };
  if (parts.length >= 2) return { split: "unsplit", label: parts[0] };
  return { split: "unsplit", label: "unlabeled" };
}

function getImbalance(classes: FastScanResult["classes"]) {
  const entries = Object.entries(classes);
  const total = entries.reduce((sum, [, item]) => sum + item.count, 0);
  if (entries.length < 2 || total === 0) {
    return { isImbalanced: false, minorityClass: null as string | null, minorityShare: 0, ratio: 0 };
  }
  const [minorityClass, minority] = entries.reduce((smallest, current) =>
    current[1].count < smallest[1].count ? current : smallest,
  );
  const [, majority] = entries.reduce((largest, current) => (current[1].count > largest[1].count ? current : largest));
  const minorityShare = minority.count / total;
  const ratio = majority.count / minority.count;
  return {
    isImbalanced: minorityShare < 0.2 || ratio >= 3,
    minorityClass,
    minorityShare,
    ratio,
  };
}

function buildFastRecommendations(
  totalImages: number,
  warnings: string[],
  imbalance: ReturnType<typeof getImbalance>,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (warnings.length) {
    recommendations.push({
      severity: "medium",
      problem: "Large dataset may take time in full audits.",
      evidence: warnings[0],
      action: "Start with Browser Fast Scan, then run Python Audit Engine when ready.",
    });
  }
  if (imbalance.isImbalanced) {
    recommendations.push({
      severity: "medium",
      problem: "Class distribution looks imbalanced.",
      evidence: `${imbalance.minorityClass} is ${(imbalance.minorityShare * 100).toFixed(1)}% of ${totalImages} images.`,
      action: "Check class weights, sampling, or collect more minority-class examples.",
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      severity: "low",
      problem: "Fast Scan found no class-count risk above default thresholds.",
      evidence: `${totalImages} image file(s) were parsed from folder names.`,
      action: "Import a Python audit report for duplicate, leakage, corrupt image, and blur evidence.",
    });
  }
  return recommendations;
}
