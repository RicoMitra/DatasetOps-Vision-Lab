"use client";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Copy,
  Database,
  FileJson,
  FolderSearch,
  Gauge,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { runBrowserFastScan, type FastScanResult } from "@/lib/fast-scan";
import { loadSummary, parseReportJson, saveSummary, type DatasetOpsReport, type Recommendation } from "@/lib/report";

const limitations = [
  "No semantic object understanding.",
  "No near-duplicate detection in v1.",
  "No guarantee test performance improves; this tool audits readiness risk only.",
];

const engineCommand = "pnpm engine:scan -- --path ./dataset --out ./reports/latest-report.json";

type RiskBreakdownItem = {
  name: string;
  contribution: number | null;
  status: "Checked" | "Not checked" | "Not checked in Fast Scan" | "Sampled";
  reason: string;
};

export function DatasetOpsDashboard() {
  const [report, setReport] = useState<DatasetOpsReport | null>(null);
  const [fastScan, setFastScan] = useState<FastScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSummary] = useState(() => loadSummary());

  async function importReport(file: File | undefined) {
    setError(null);
    if (!file) return;
    try {
      const next = parseReportJson(await file.text());
      saveSummary(next);
      setReport(next);
      setFastScan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid DatasetOps report.");
    }
  }

  function runFast(files: FileList | null) {
    setError(null);
    if (!files?.length) return;
    setFastScan(runBrowserFastScan(Array.from(files)));
    setReport(null);
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(engineCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const score = report?.score.qualityScore ?? fastScan?.qualityScore ?? savedSummary?.qualityScore ?? 0;
  const risk = report?.score.riskScore ?? fastScan?.riskScore ?? savedSummary?.riskScore ?? 0;
  const datasetPath = report?.dataset.path ?? savedSummary?.datasetPath ?? "No report imported";
  const totalImages = report?.dataset.totalImages ?? fastScan?.totalImages ?? savedSummary?.totalImages ?? 0;
  const recommendations = report?.recommendations ?? fastScan?.recommendations ?? [];
  const classData = report
    ? Object.entries(report.classes).map(([name, item]) => ({ name, count: item.count }))
    : fastScan
      ? Object.entries(fastScan.classes).map(([name, item]) => ({ name, count: item.count }))
      : [];
  const riskBreakdown = buildRiskBreakdown(report, fastScan);
  const auditMode = report ? "Python audit report" : fastScan ? "Browser Fast Scan" : "Waiting for report";
  const reportStatus = report
    ? `Python report loaded with ${report.dataset.validImages.toLocaleString("en-US")} valid images.`
    : "No Python report imported yet. Deep evidence cards are intentionally marked as unchecked.";

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_12%_8%,oklch(0.64_0.09_75/.18),transparent_30%),radial-gradient(circle_at_86%_10%,oklch(0.63_0.1_230/.16),transparent_24%),linear-gradient(135deg,oklch(0.13_0.01_70),oklch(0.08_0.01_250)_55%,oklch(0.11_0.015_35))] px-4 py-4 text-[oklch(0.95_0.01_75)] md:px-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1480px] gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-[oklch(0.72_0.08_80/.18)] bg-[oklch(0.18_0.015_70/.74)] p-5 shadow-[0_30px_90px_-45px_oklch(0.02_0.02_70/.9)] backdrop-blur-xl lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-[1.1rem] bg-[oklch(0.72_0.11_78)] text-[oklch(0.13_0.02_70)]">
              <Database size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">DatasetOps Vision Lab</h1>
              <p className="text-xs uppercase tracking-[0.18em] text-[oklch(0.78_0.03_78)]">local evidence audit</p>
            </div>
          </div>

          <section className="mt-8 space-y-3">
            <h2 className="text-sm font-medium text-[oklch(0.84_0.04_78)]">Dataset info</h2>
            <p className="break-words rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-[oklch(0.78_0.02_78)]">
              {datasetPath}
            </p>
            <div className="grid gap-2 text-sm">
              <Metric label="Mode" value={auditMode} compact />
              <Metric label="Images" value={totalImages.toLocaleString()} />
              <Metric label="Risk score" value={risk.toString()} />
            </div>
          </section>

          <section className="mt-8 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-[oklch(0.84_0.04_78)]">
              <ShieldCheck size={16} aria-hidden="true" />
              Privacy
            </h2>
            <p className="text-sm leading-6 text-[oklch(0.74_0.02_78)]">
              Reports and Fast Scan summaries stay in this browser. Image bytes are not sent to a cloud service.
            </p>
          </section>

          <section className="mt-8 space-y-2">
            <h2 className="text-sm font-medium text-[oklch(0.84_0.04_78)]">Limitations</h2>
            {limitations.map((item) => (
              <p key={item} className="rounded-2xl bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[oklch(0.76_0.02_78)]">
                {item}
              </p>
            ))}
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          <header className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_80px_-55px_oklch(0.72_0.11_78/.55)] backdrop-blur-xl">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[oklch(0.74_0.09_225)]">Python engine report viewer</p>
                <h2 className="mt-2 max-w-[760px] text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
                  Audit image datasets before they enter modeling.
                </h2>
                <p className="mt-3 max-w-[65ch] text-base leading-7 text-[oklch(0.77_0.02_78)]">
                  Import `latest-report.json` from the Python engine, or run a browser-only Fast Scan for structure and class balance.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-[oklch(0.72_0.11_78/.18)] bg-[oklch(0.16_0.012_70/.76)] p-4">
                <div className="flex items-center justify-between text-sm text-[oklch(0.78_0.03_78)]">
                  Quality score
                  <Gauge size={20} aria-hidden="true" />
                </div>
                <div className="mt-5 text-6xl font-semibold tracking-tight text-[oklch(0.76_0.12_78)]">{score}</div>
              </div>
            </div>
          </header>

          {error ? (
            <div role="alert" className="flex items-start gap-3 rounded-[1.5rem] border border-[oklch(0.63_0.17_25/.35)] bg-[oklch(0.22_0.04_25/.5)] p-4 text-sm text-[oklch(0.88_0.07_35)]">
              <AlertTriangle size={18} aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <div className="grid gap-4">
                <section className="rounded-[1.5rem] border border-[oklch(0.72_0.11_78/.2)] bg-[oklch(0.13_0.012_70/.72)] p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[oklch(0.72_0.11_78/.16)] text-[oklch(0.78_0.12_78)]">
                      <TerminalSquare size={22} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold">Run Python Audit Engine first</h2>
                      <p className="mt-1 text-sm leading-6 text-[oklch(0.74_0.02_78)]">
                        The browser cannot execute Python. Run this command in your local terminal, then import the generated
                        `latest-report.json` here.
                      </p>
                      <div className="mt-4 flex flex-col gap-3 rounded-[1.1rem] border border-white/10 bg-[oklch(0.08_0.01_70/.7)] p-3 md:flex-row md:items-center">
                        <code className="min-w-0 flex-1 break-words font-mono text-sm text-[oklch(0.86_0.04_78)]">
                          {engineCommand}
                        </code>
                        <button
                          type="button"
                          onClick={copyCommand}
                          className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[oklch(0.72_0.11_78)] px-4 text-sm font-medium text-[oklch(0.13_0.02_70)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]"
                        >
                          {copied ? <CheckCircle2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-[oklch(0.72_0.02_78)]">{reportStatus}</p>
                    </div>
                  </div>
                </section>
                <UploadPanel
                  icon={<FileJson size={22} aria-hidden="true" />}
                  title="Import latest-report.json"
                  copy="Load the JSON report after the Python engine finishes. This unlocks leakage, duplicate, corrupt image, blur, brightness, and contrast evidence."
                  accept="application/json,.json"
                  label="Import latest-report.json"
                  onChange={(files) => importReport(files?.[0])}
                />
                <UploadPanel
                  icon={<FolderSearch size={22} aria-hidden="true" />}
                  title="Browser Fast Scan"
                  copy="Quickly parse local folders for labels, splits, dataset size, and class-balance risk. It does not check duplicate, leakage, corrupt, or blur evidence."
                  accept="image/*"
                  label="Choose dataset folder for Browser Fast Scan"
                  directory
                  onChange={runFast}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <BarChart3 size={20} aria-hidden="true" />
                Risk Breakdown
              </h2>
              <div className="grid gap-3">
                {riskBreakdown.map((item) => (
                  <RiskBreakdownRow key={item.name} item={item} />
                ))}
              </div>
              <p className="mt-4 rounded-[1.25rem] bg-white/[0.035] p-3 text-xs leading-5 text-[oklch(0.74_0.02_78)]">
                Leakage requires train/val/test folders. A train-only scan has no validation or test split to compare against.
              </p>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-lg font-semibold">Class distribution</h2>
              {classData.length ? (
                <div className="mt-4 h-[220px]" aria-label="Class distribution chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classData}>
                      <CartesianGrid stroke="oklch(0.38 0.02 78 / 0.45)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "oklch(0.78 0.02 78)", fontSize: 12 }} />
                      <YAxis tick={{ fill: "oklch(0.78 0.02 78)", fontSize: 12 }} />
                      <Bar dataKey="count" fill="oklch(0.72 0.11 78)" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-lg font-semibold">Evidence cards</h2>
              <div className="mt-4 grid gap-3">
                <RiskCard
                  label="Leakage"
                  value={report ? `${report.leakage.leakedGroups} group(s)` : "Not checked in Fast Scan"}
                  detail="Needs train/val/test hash comparison."
                />
                <RiskCard
                  label="Duplicate groups"
                  value={report ? `${report.duplicates.exactDuplicateGroups} group(s)` : "Not checked in Fast Scan"}
                  detail="Exact SHA-256 duplicate detection runs in Python audit."
                />
                <RiskCard
                  label="Blurred images"
                  value={report ? `${report.quality.blurredImages} image(s)` : "Not checked in Fast Scan"}
                  detail="Laplacian blur score is part of the Python report."
                />
                <RiskCard
                  label="Corrupt images"
                  value={report ? `${report.dataset.corruptImages} image(s)` : "Not checked in Fast Scan"}
                  detail="Decoded locally by the Python image engine."
                />
              </div>
            </section>
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
            <h2 className="text-lg font-semibold">Recommendations</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {(recommendations.length ? recommendations : fallbackRecommendations).map((rec) => (
                <RecommendationCard key={`${rec.problem}-${rec.evidence}`} recommendation={rec} />
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs text-[oklch(0.68_0.02_78)]">{label}</div>
      <div className={`${compact ? "text-sm" : "text-xl"} mt-1 font-mono text-[oklch(0.94_0.01_78)]`}>{value}</div>
    </div>
  );
}

function UploadPanel({
  icon,
  title,
  copy,
  accept,
  label,
  directory,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  accept: string;
  label: string;
  directory?: boolean;
  onChange: (files: FileList | null) => void;
}) {
  const directoryProps = directory ? { webkitdirectory: "", directory: "" } : {};
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[oklch(0.14_0.01_70/.65)] p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-[oklch(0.62_0.1_225/.18)] text-[oklch(0.78_0.1_225)]">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[oklch(0.74_0.02_78)]">{copy}</p>
        </div>
      </div>
      <label className="mt-5 flex min-h-12 cursor-pointer items-center justify-center rounded-full bg-[oklch(0.72_0.11_78)] px-5 text-sm font-medium text-[oklch(0.13_0.02_70)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98]">
        {label}
        <input
          aria-label={label}
          className="sr-only"
          type="file"
          accept={accept}
          multiple={directory}
          onChange={(event) => onChange(event.currentTarget.files)}
          {...directoryProps}
        />
      </label>
    </div>
  );
}

function RiskBreakdownRow({ item }: { item: RiskBreakdownItem }) {
  const width = item.contribution == null ? 0 : Math.min(100, Math.max(4, item.contribution * 3.3));

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[oklch(0.92_0.01_78)]">{item.name}</h3>
          <p className="mt-1 text-xs leading-5 text-[oklch(0.7_0.02_78)]">{item.reason}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-[oklch(0.78_0.1_225)]">
            {item.contribution == null ? item.status : `${item.contribution} risk`}
          </div>
          <div className="mt-1 text-xs text-[oklch(0.68_0.02_78)]">{item.status}</div>
        </div>
      </div>
      {item.contribution == null ? (
        <div className="mt-3 h-2 rounded-full bg-white/[0.06]" aria-hidden="true" />
      ) : (
        <div className="mt-3 h-2 rounded-full bg-white/[0.06]" aria-label={`${item.name} contributes ${item.contribution} risk`}>
          <div className="h-full rounded-full bg-[oklch(0.72_0.11_78)]" style={{ width: `${width}%` }} />
        </div>
      )}
    </div>
  );
}

function RiskCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-[oklch(0.76_0.02_78)]">{label}</span>
        <span className="text-right font-mono text-sm text-[oklch(0.78_0.1_225)]">{value}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[oklch(0.68_0.02_78)]">{detail}</p>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[oklch(0.15_0.01_70/.7)] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[oklch(0.72_0.11_78)]">{recommendation.severity}</div>
      <h3 className="mt-2 text-base font-semibold">{recommendation.problem}</h3>
      <p className="mt-3 text-sm leading-6 text-[oklch(0.76_0.02_78)]">
        <span className="text-[oklch(0.86_0.04_78)]">Evidence:</span> {recommendation.evidence}
      </p>
      <p className="mt-2 text-sm leading-6 text-[oklch(0.76_0.02_78)]">
        <span className="text-[oklch(0.86_0.04_78)]">Action:</span> {recommendation.action}
      </p>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.025] p-8 text-sm leading-6 text-[oklch(0.74_0.02_78)]">
      Import a Python audit report or choose a local folder for Browser Fast Scan. The dashboard will render class counts,
      risk evidence, and deterministic recommendations here.
    </div>
  );
}

const fallbackRecommendations: Recommendation[] = [
  {
    severity: "low",
    problem: "No scan evidence loaded yet.",
    evidence: "The dashboard has not received latest-report.json or Browser Fast Scan results.",
    action: "Run the Python engine or choose a local image folder to start the audit.",
  },
];

function buildRiskBreakdown(report: DatasetOpsReport | null, fastScan: FastScanResult | null): RiskBreakdownItem[] {
  if (report) {
    return [
      {
        name: "Leakage",
        contribution: report.score.factors.leakage,
        status: "Checked",
        reason: report.leakage.leakedGroups
          ? `${report.leakage.leakedGroups} cross-split hash group(s) found.`
          : "No exact duplicate hash group crossed split boundaries.",
      },
      {
        name: "Duplicate",
        contribution: report.score.factors.duplicates,
        status: "Checked",
        reason: report.duplicates.exactDuplicateGroups
          ? `${report.duplicates.exactDuplicateGroups} exact duplicate group(s) found.`
          : "No exact duplicate hash groups found.",
      },
      {
        name: "Imbalance",
        contribution: report.score.factors.imbalance,
        status: "Checked",
        reason: report.imbalance.minorityClass
          ? `${report.imbalance.minorityClass} is ${(report.imbalance.minorityClassShare * 100).toFixed(1)}% of dataset.`
          : "No class imbalance could be computed.",
      },
      {
        name: "Resolution",
        contribution: report.score.factors.lowResolution,
        status: "Checked",
        reason: `${report.quality.lowResolutionImages} image(s) are under the 256px threshold.`,
      },
      {
        name: "Blur",
        contribution: report.score.factors.blur,
        status: "Checked",
        reason: `${report.quality.blurredImages} image(s) are below the blur threshold.`,
      },
      {
        name: "Brightness / Contrast",
        contribution: report.score.factors.brightnessContrast,
        status: "Checked",
        reason: `${report.quality.brightnessOutliers + report.quality.contrastOutliers} image-quality outlier(s) found.`,
      },
      {
        name: "Confusion",
        contribution: report.score.factors.confusion,
        status: "Checked",
        reason: report.confusion?.topPairs?.length
          ? "Confusion CSV contains repeated actual/predicted error pairs."
          : "No confusion concentration found or no confusion CSV was provided.",
      },
    ];
  }

  const classEntries = fastScan ? Object.entries(fastScan.classes) : [];
  const total = fastScan?.totalImages ?? 0;
  const minority = classEntries.length
    ? classEntries.reduce((smallest, current) => (current[1].count < smallest[1].count ? current : smallest))
    : null;

  return [
    {
      name: "Leakage",
      contribution: null,
      status: "Not checked",
      reason: "requires train/val/test structure and exact hash comparison.",
    },
    {
      name: "Duplicate",
      contribution: null,
      status: "Not checked in Fast Scan",
      reason: "SHA-256 duplicate detection runs in the Python audit report.",
    },
    {
      name: "Imbalance",
      contribution: fastScan ? fastScan.riskScore : null,
      status: fastScan ? "Checked" : "Not checked",
      reason:
        fastScan && minority
          ? `${minority[0]} is ${((minority[1].count / Math.max(total, 1)) * 100).toFixed(1)}% of dataset.`
          : "Choose a folder to parse class distribution.",
    },
    {
      name: "Resolution",
      contribution: null,
      status: "Not checked in Fast Scan",
      reason: "Import a Python report for full image dimensions and low-resolution rate.",
    },
    {
      name: "Blur",
      contribution: null,
      status: "Not checked in Fast Scan",
      reason: "Laplacian blur score needs the Python audit engine.",
    },
    {
      name: "Brightness / Contrast",
      contribution: null,
      status: "Not checked in Fast Scan",
      reason: "Brightness and contrast statistics need the Python audit engine.",
    },
  ];
}
