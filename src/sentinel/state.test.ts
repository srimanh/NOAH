import { test } from "node:test";
import assert from "node:assert/strict";
import { issueKey, diffIssues } from "./state.js";
import type { HealthItem } from "../sys/health.js";

const item = (title: string, detail = "", severity: HealthItem["severity"] = "high"): HealthItem => ({
  severity,
  title,
  detail,
});

test("issueKey: normalizes counts/percentages so the same problem keeps one key", () => {
  assert.equal(issueKey(item("1 failed service")), issueKey(item("2 failed services")));
  assert.equal(issueKey(item("Disk nearly full", "/ at 92%")), issueKey(item("Disk nearly full", "/ at 95%")));
  assert.notEqual(issueKey(item("Disk nearly full")), issueKey(item("Memory pressure")));
});

test("diffIssues: classifies appeared / resolved / ongoing", () => {
  const prev = [item("Memory pressure"), item("Disk filling up", "", "medium")];
  const curr = [item("Memory pressure"), item("High CPU usage", "", "low")];
  const d = diffIssues(prev, curr);
  assert.deepEqual(d.appeared.map((i) => i.title), ["High CPU usage"]);
  assert.deepEqual(d.resolved.map((i) => i.title), ["Disk filling up"]);
  assert.deepEqual(d.ongoing.map((i) => i.title), ["Memory pressure"]);
});

test("diffIssues: nothing changes → no appeared/resolved (no nagging)", () => {
  const same = [item("Memory pressure"), item("High CPU usage", "node at 91%", "low")];
  const d = diffIssues(same, [item("Memory pressure"), item("High CPU usage", "node at 88%", "low")]);
  assert.equal(d.appeared.length, 0, "percentage drift is not a new alert");
  assert.equal(d.resolved.length, 0);
  assert.equal(d.ongoing.length, 2);
});

test("diffIssues: first run (empty prev) → everything appeared", () => {
  const d = diffIssues([], [item("Memory pressure")]);
  assert.equal(d.appeared.length, 1);
});
