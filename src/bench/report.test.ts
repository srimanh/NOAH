import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize, toMarkdown, toJSON, type BenchResult, type BenchReport } from "./report.js";

const FIXTURE: BenchResult[] = [
  { task: "install htop", completed: true, durationMs: 4200, toolCalls: 3, safetyInterventions: 1, telemetryReads: 1 },
  { task: "why is it slow", completed: true, durationMs: 2600, toolCalls: 1, safetyInterventions: 0, telemetryReads: 1 },
  { task: "free up space", completed: false, durationMs: 9000, toolCalls: 2, safetyInterventions: 2, telemetryReads: 1, error: "timeout" },
];

test("summarize: deterministic aggregate metrics", () => {
  const s = summarize(FIXTURE);
  assert.equal(s.tasks, 3);
  assert.equal(s.completed, 2);
  assert.equal(s.completionRate, 2 / 3);
  assert.equal(s.totalDurationMs, 4200 + 2600 + 9000);
  assert.equal(s.avgDurationMs, Math.round((4200 + 2600 + 9000) / 3));
  assert.equal(s.totalToolCalls, 6);
  assert.equal(s.totalSafetyInterventions, 3);
  assert.equal(s.totalTelemetryReads, 3);
});

const report: BenchReport = {
  generatedAt: "2026-06-14T00:00:00.000Z",
  model: "anthropic/claude-sonnet-4-5",
  results: FIXTURE,
  summary: summarize(FIXTURE),
};

test("toMarkdown: stable, human-readable report", () => {
  const md = toMarkdown(report);
  assert.match(md, /# NOAH Benchmark/);
  assert.match(md, /claude-sonnet-4-5/);
  assert.match(md, /install htop/);
  assert.match(md, /Completion/i);
  assert.match(md, /67%|66\.7%|2\/3/); // completion rate surfaced
  assert.match(md, /timeout/); // error surfaced
  // a markdown table
  assert.match(md, /\| *Task *\|/);
});

test("toJSON: round-trips and includes summary", () => {
  const json = toJSON(report);
  const parsed = JSON.parse(json);
  assert.equal(parsed.model, "anthropic/claude-sonnet-4-5");
  assert.equal(parsed.results.length, 3);
  assert.equal(parsed.summary.completed, 2);
});
