import { test } from "node:test";
import assert from "node:assert/strict";
import { runWatch } from "./watch.js";
import type { HealthItem } from "../sys/health.js";

const item = (title: string): HealthItem => ({ severity: "high", title, detail: "" });

test("runWatch: alerts only when issues change across ticks", async () => {
  // tick sequence: none → disk → disk (same) → disk+mem → none
  const seq: HealthItem[][] = [
    [],
    [item("Disk nearly full")],
    [item("Disk nearly full")],
    [item("Disk nearly full"), item("Memory pressure")],
    [],
  ];
  let i = 0;
  const alerts: string[][] = [];
  await runWatch({
    intervalMs: 0,
    maxTicks: seq.length,
    sleep: async () => {},
    probe: async () => seq[i++],
    onAlert: (lines) => alerts.push(lines),
  });

  // tick0: none (no alert) · tick1: disk appears (alert) · tick2: same (no alert)
  // tick3: mem appears (alert) · tick4: both resolved (alert)
  assert.equal(alerts.length, 3, "alerts on appear/appear/resolve only");
  assert.ok(alerts[0].some((l) => /Disk/.test(l)));
  assert.ok(alerts[1].some((l) => /Memory/.test(l)));
  assert.ok(alerts[2].some((l) => /resolved|cleared/i.test(l)));
});

test("runWatch: stops at maxTicks and returns a summary", async () => {
  const res = await runWatch({
    intervalMs: 0,
    maxTicks: 3,
    sleep: async () => {},
    probe: async () => [],
    onAlert: () => {},
  });
  assert.equal(res.ticks, 3);
  assert.equal(res.alerts, 0);
});

test("runWatch: a probe failure does not crash the loop", async () => {
  let i = 0;
  const res = await runWatch({
    intervalMs: 0,
    maxTicks: 2,
    sleep: async () => {},
    probe: async () => {
      if (i++ === 0) throw new Error("probe failed");
      return [];
    },
    onAlert: () => {},
  });
  assert.equal(res.ticks, 2, "kept going after the failed probe");
});
