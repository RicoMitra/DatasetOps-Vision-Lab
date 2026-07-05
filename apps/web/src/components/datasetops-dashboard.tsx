"use client";

import { AlertTriangle, BarChart3, Database, FileJson, FolderSearch, Gauge, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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

export function DatasetOpsDashboard() {
  const [report, setReport] = useState<DatasetOpsReport | null>(null);
  const [fastScan, setFastScan] = useState<FastScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  const riskData = report
    ? Object.entries(report.score.factors).map(([metric, value]) => ({ metric, value }))
    : [
        { metric: "risk", value: risk },
        { metric: "quality", value: score },
      ];

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_12%_8%,oklch(0.64_0.09_75/.18),transparent_30%),radial-gradient(circle_at_86%_10%,oklch(0.63_0.1_230/.16),transparent_24%),linear-gradient(135deg,oklch(0.13_0.01_70),oklch(0.08_0.01_250)_55%,oklch(0.11_0.015_35))] px-4 py-4 text-[oklch(0.95_0.01_75)] md:px-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1480px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-[oklch(0.72_0.08_80/.18)] bg-[oklch(0.18_0.015_70/.74)] p-5 shadow-[0_30px_90px_-45px_oklch(0.02_0.02_70/.9)] backdrop-blur-xl lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)]">
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
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="Images" value={totalImages.toLocaleString()} />
              <Metric label="Risk" value={risk.toString()} />
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <UploadPanel
                  icon={<FileJson size={22} aria-hidden="true" />}
                  title="Import Python audit report"
                  copy="Load latest-report.json from python -m datasetops_engine scan."
                  accept="application/json,.json"
                  label="Import latest-report.json"
                  onChange={(files) => importReport(files?.[0])}
                />
                <UploadPanel
                  icon={<FolderSearch size={22} aria-hidden="true" />}
                  title="Browser Fast Scan"
                  copy="Parse local folders for labels, splits, dataset size, and quick class-balance risk."
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
                Risk radar
              </h2>
              <div className="h-[260px]" aria-label="Risk factor chart">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={riskData}>
                    <PolarGrid stroke="oklch(0.45 0.02 78 / 0.55)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.78 0.02 78)", fontSize: 11 }} />
                    <Radar dataKey="value" fill="oklch(0.62 0.1 225)" fillOpacity={0.35} stroke="oklch(0.72 0.11 225)" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h2 className="text-lg font-semibold">Class distribution</h2>
              {classData.length ? (
                <div className="mt-4 h-[300px]" aria-label="Class distribution chart">
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
                <RiskCard label="Leakage" value={report?.leakage.leakedGroups ?? 0} />
                <RiskCard label="Duplicate groups" value={report?.duplicates.exactDuplicateGroups ?? 0} />
                <RiskCard label="Blurred images" value={report?.quality.blurredImages ?? 0} />
                <RiskCard label="Corrupt images" value={report?.dataset.corruptImages ?? 0} />
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs text-[oklch(0.68_0.02_78)]">{label}</div>
      <div className="mt-1 font-mono text-xl text-[oklch(0.94_0.01_78)]">{value}</div>
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

function RiskCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
      <span className="text-sm text-[oklch(0.76_0.02_78)]">{label}</span>
      <span className="font-mono text-2xl text-[oklch(0.78_0.1_225)]">{value}</span>
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
