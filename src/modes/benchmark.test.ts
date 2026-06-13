import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeReports } from "./benchmark.js";
import { summarize, type BenchReport } from "../bench/report.js";

test("writeReports: emits benchmark.md and benchmark.json", () => {
  const dir = mkdtempSync(join(tmpdir(), "noah-bench-"));
  const results = [
    { task: "health check", completed: true, durationMs: 1200, toolCalls: 1, safetyInterventions: 0, telemetryReads: 1 },
  ];
  const report: BenchReport = {
    generatedAt: "2026-06-14T00:00:00.000Z",
    model: "anthropic/claude-sonnet-4-5",
    results,
    summary: summarize(results),
  };
  const { md, json } = writeReports(report, dir);
  assert.ok(existsSync(md) && existsSync(json));
  assert.match(readFileSync(md, "utf8"), /# NOAH Benchmark/);
  const parsed = JSON.parse(readFileSync(json, "utf8"));
  assert.equal(parsed.summary.completed, 1);
  assert.equal(parsed.results[0].task, "health check");
});
