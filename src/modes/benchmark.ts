/**
 * `noah benchmark` — run a representative AI-SysAdmin task suite against the
 * current model and export markdown + JSON reports.
 *
 * Runs in DRY-RUN so benchmarking never mutates the machine; each task uses a
 * fresh in-memory session for independent measurement.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { createNoahSession } from "../runtime.js";
import { DEFAULT_TASKS, executeTask, runBenchmark } from "../bench/runner.js";
import { toMarkdown, toJSON, type BenchReport } from "../bench/report.js";

/** Write markdown + JSON reports to `dir`, return the file paths. */
export function writeReports(report: BenchReport, dir: string): { md: string; json: string } {
  mkdirSync(dir, { recursive: true });
  const md = join(dir, "benchmark.md");
  const json = join(dir, "benchmark.json");
  writeFileSync(md, toMarkdown(report));
  writeFileSync(json, toJSON(report));
  return { md, json };
}

export interface BenchmarkOptions {
  model?: string;
  tasks?: string[];
  timeoutMs?: number;
  outDir?: string;
}

export async function runNoahBenchmark(opts: BenchmarkOptions = {}): Promise<BenchReport> {
  const tasks = opts.tasks ?? DEFAULT_TASKS;
  let modelLabel = opts.model ?? "(default)";

  const runTask = async (task: string) => {
    const { session, model } = await createNoahSession({
      dryRun: true,
      autoYes: true,
      model: opts.model,
      sessionManager: SessionManager.inMemory(),
    });
    modelLabel = `${model.provider}/${model.id}`;
    try {
      return await executeTask(session, task, { timeoutMs: opts.timeoutMs ?? 90_000 });
    } finally {
      session.dispose();
    }
  };

  process.stderr.write(`Running ${tasks.length} benchmark tasks (dry-run)…\n`);
  const report = await runBenchmark(tasks, modelLabel, runTask);
  report.model = modelLabel;
  report.summary = report.summary; // keep

  const { md, json } = writeReports(report, opts.outDir ?? join(process.cwd(), ".noah"));
  process.stdout.write("\n" + toMarkdown(report) + "\n");
  process.stderr.write(`Reports written: ${md}  ${json}\n`);
  return report;
}
