import { test } from "node:test";
import assert from "node:assert/strict";
import { assessHealth, type Severity } from "./health.js";
import type { SystemSnapshot } from "./probe.js";

const base: SystemSnapshot = { os: "macOS", disks: [], topProcesses: [], failedServices: [] };
const disk = (usedPct: number) => ({ mount: "/", total: 100, used: usedPct, available: 100 - usedPct, usedPct });

test("assessHealth: healthy machine → ok, no high/medium items", () => {
  const r = assessHealth({ ...base, memory: { total: 100, used: 30, usedPct: 30 }, disks: [disk(40)] });
  assert.equal(r.status, "ok");
  assert.ok(!r.items.some((i) => i.severity !== "low"));
});

test("assessHealth: disk ≥90% → critical", () => {
  const r = assessHealth({ ...base, disks: [disk(93)] });
  assert.equal(r.status, "critical");
  assert.ok(r.items.some((i) => i.severity === "high" && /disk/i.test(i.title)));
});

test("assessHealth: disk 80–89% → warn (medium)", () => {
  const r = assessHealth({ ...base, disks: [disk(84)] });
  assert.equal(r.status, "warn");
  assert.ok(r.items.some((i) => i.severity === "medium"));
});

test("assessHealth: high memory and failed services flagged", () => {
  const r = assessHealth({
    ...base,
    memory: { total: 100, used: 95, usedPct: 95 },
    failedServices: ["nginx.service", "mysql.service"],
  });
  assert.equal(r.status, "critical");
  assert.ok(r.items.some((i) => /memory/i.test(i.title) && i.severity === "high"));
  const svc = r.items.find((i) => /service/i.test(i.title));
  assert.ok(svc && i_includes(svc.detail, "nginx"));
});

function i_includes(s: string, sub: string) {
  return s.toLowerCase().includes(sub);
}

test("assessHealth: updates available → informational (low)", () => {
  const r = assessHealth({ ...base, updates: 5, disks: [disk(20)] });
  assert.equal(r.status, "ok");
  assert.ok(r.items.some((i) => /update/i.test(i.title) && i.severity === "low"));
});

test("assessHealth: items sorted by severity (high first)", () => {
  const r = assessHealth({
    ...base,
    updates: 3,
    memory: { total: 100, used: 95, usedPct: 95 },
    disks: [disk(85)],
  });
  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  for (let i = 1; i < r.items.length; i++) {
    assert.ok(rank[r.items[i - 1].severity] <= rank[r.items[i].severity], "sorted high→low");
  }
});
