import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtTokens, UsageBar, type UsageStats } from "./usage.js";
import { visibleLen } from "../../ui/ansi.js";

test("fmtTokens: compact human counts", () => {
  assert.equal(fmtTokens(0), "0");
  assert.equal(fmtTokens(999), "999");
  assert.equal(fmtTokens(1234), "1.2k");
  assert.equal(fmtTokens(1_500_000), "1.5M");
});

const stats = (o: Partial<UsageStats> = {}): UsageStats => ({
  model: "claude-sonnet-4-5",
  input: 1234,
  output: 340,
  total: 1574,
  contextPercent: 12,
  ...o,
});

test("UsageBar: shows model, input, output, total tokens and context %", () => {
  const line = new UsageBar(() => stats()).render(100)[0];
  const t = line.replace(/\x1b\[[0-9;]*m/g, "");
  assert.match(t, /claude-sonnet-4-5/);
  assert.match(t, /1\.2k/); // input
  assert.match(t, /340/); // output
  assert.match(t, /1\.6k/); // total (1574 -> 1.6k)
  assert.match(t, /12%/); // context utilization
});

test("UsageBar: unknown context renders a placeholder, never crashes", () => {
  const t = new UsageBar(() => stats({ contextPercent: null })).render(80)[0].replace(/\x1b\[[0-9;]*m/g, "");
  assert.match(t, /ctx/i);
  assert.doesNotMatch(t, /null/);
});

test("UsageBar: width-safe at any size", () => {
  const bar = new UsageBar(() => stats({ model: "anthropic/claude-very-long-model-name-x" }));
  for (const w of [30, 60, 100, 200]) {
    for (const l of bar.render(w)) assert.ok(visibleLen(l) <= w, `width ${w}: ${visibleLen(l)}`);
  }
});
