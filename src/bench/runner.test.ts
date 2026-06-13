import { test } from "node:test";
import assert from "node:assert/strict";
import { runBenchmark, DEFAULT_TASKS } from "./runner.js";
import type { BenchResult } from "./report.js";

test("DEFAULT_TASKS: covers the AI-SysAdmin demo surface", () => {
  assert.ok(DEFAULT_TASKS.length >= 3);
  assert.ok(DEFAULT_TASKS.some((t) => /health|slow|space|install/i.test(t)));
});

test("runBenchmark: runs each task and assembles a report with summary", async () => {
  const seen: string[] = [];
  const runTask = async (task: string): Promise<BenchResult> => {
    seen.push(task);
    return { task, completed: true, durationMs: 1000, toolCalls: 1, safetyInterventions: 0, telemetryReads: 1 };
  };
  const report = await runBenchmark(["a", "b"], "test/model", runTask);
  assert.deepEqual(seen, ["a", "b"]);
  assert.equal(report.model, "test/model");
  assert.equal(report.results.length, 2);
  assert.equal(report.summary.completed, 2);
  assert.match(report.generatedAt, /^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
});

test("runBenchmark: a thrown task is recorded as not-completed, run continues", async () => {
  const runTask = async (task: string): Promise<BenchResult> => {
    if (task === "boom") throw new Error("kaboom");
    return { task, completed: true, durationMs: 500, toolCalls: 0, safetyInterventions: 0, telemetryReads: 0 };
  };
  const report = await runBenchmark(["ok", "boom", "ok2"], "m", runTask);
  assert.equal(report.results.length, 3);
  const boom = report.results.find((r) => r.task === "boom")!;
  assert.equal(boom.completed, false);
  assert.match(boom.error ?? "", /kaboom/);
  assert.equal(report.summary.completed, 2);
});
