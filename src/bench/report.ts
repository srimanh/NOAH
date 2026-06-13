/**
 * Benchmark report — aggregate metrics + deterministic markdown/JSON exporters.
 * Pure: given results, produces stable output (no clocks, no randomness).
 */

export interface BenchResult {
  task: string;
  completed: boolean;
  durationMs: number;
  toolCalls: number;
  safetyInterventions: number;
  telemetryReads: number;
  error?: string;
}

export interface BenchSummary {
  tasks: number;
  completed: number;
  completionRate: number;
  totalDurationMs: number;
  avgDurationMs: number;
  totalToolCalls: number;
  totalSafetyInterventions: number;
  totalTelemetryReads: number;
}

export interface BenchReport {
  generatedAt: string;
  model: string;
  results: BenchResult[];
  summary: BenchSummary;
}

export function summarize(results: BenchResult[]): BenchSummary {
  const n = results.length;
  const sum = (f: (r: BenchResult) => number) => results.reduce((a, r) => a + f(r), 0);
  const completed = results.filter((r) => r.completed).length;
  const totalDurationMs = sum((r) => r.durationMs);
  return {
    tasks: n,
    completed,
    completionRate: n ? completed / n : 0,
    totalDurationMs,
    avgDurationMs: n ? Math.round(totalDurationMs / n) : 0,
    totalToolCalls: sum((r) => r.toolCalls),
    totalSafetyInterventions: sum((r) => r.safetyInterventions),
    totalTelemetryReads: sum((r) => r.telemetryReads),
  };
}

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function toMarkdown(report: BenchReport): string {
  const s = report.summary;
  const rows = report.results
    .map(
      (r) =>
        `| ${r.task} | ${r.completed ? "✅" : "❌"} | ${secs(r.durationMs)} | ${r.toolCalls} | ${r.safetyInterventions} | ${r.telemetryReads} | ${r.error ?? ""} |`,
    )
    .join("\n");
  return `# NOAH Benchmark

- **Model:** ${report.model}
- **Generated:** ${report.generatedAt}
- **Completion:** ${s.completed}/${s.tasks} (${pct(s.completionRate)})
- **Total time:** ${secs(s.totalDurationMs)} · **avg:** ${secs(s.avgDurationMs)}
- **Tool calls:** ${s.totalToolCalls} · **Safety interventions:** ${s.totalSafetyInterventions} · **Telemetry reads:** ${s.totalTelemetryReads}

| Task | Done | Duration | Tools | Safety | Telemetry | Notes |
|------|------|----------|-------|--------|-----------|-------|
${rows}
`;
}

export function toJSON(report: BenchReport): string {
  return JSON.stringify(report, null, 2);
}
