import { test } from "node:test";
import assert from "node:assert/strict";
import { procLabel, formatSnapshot, formatDisks, formatProcesses, formatDoctor } from "./report.js";
import { assessHealth } from "./health.js";
import type { SystemSnapshot } from "./probe.js";

const SNAP: SystemSnapshot = {
  os: "macOS 14.5",
  memory: { total: 16 * 1024 ** 3, used: 12 * 1024 ** 3, usedPct: 75 },
  disks: [
    { mount: "/", total: 500 * 1024 ** 3, used: 430 * 1024 ** 3, available: 70 * 1024 ** 3, usedPct: 86 },
    { mount: "/dev", total: 404 * 1024, used: 404 * 1024, available: 0, usedPct: 100 },
  ],
  topProcesses: [
    { pid: 1, cpu: 42.5, mem: 8.1, command: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer)" },
    { pid: 2, cpu: 12, mem: 3, command: "/usr/local/bin/node" },
  ],
  failedServices: ["nginx.service"],
};

test("procLabel: strips path to a clean name", () => {
  assert.equal(procLabel("/usr/local/bin/node"), "node");
  assert.equal(
    procLabel("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper (Renderer)"),
    "Google Chrome Helper (Renderer)",
  );
  assert.equal(procLabel("node"), "node");
});

test("formatSnapshot: includes os, memory%, disk%, failed services", () => {
  const txt = formatSnapshot(SNAP).join("\n");
  assert.match(txt, /macOS 14\.5/);
  assert.match(txt, /75%/); // memory
  assert.match(txt, /86%/); // root disk
  assert.match(txt, /nginx\.service/);
  assert.match(txt, /node|Chrome/); // a top process
});

test("formatDisks: real mounts with human sizes and percent", () => {
  const txt = formatDisks(SNAP).join("\n");
  assert.match(txt, /\//);
  assert.match(txt, /86%/);
  assert.match(txt, /GB/);
});

test("formatDoctor: status header + telemetry + prioritized recommendations", () => {
  const lines = formatDoctor(SNAP, assessHealth(SNAP));
  const txt = lines.join("\n");
  assert.match(txt, /HEALTH/i);
  assert.match(txt, /critical/i, "failed service + 86% disk → critical");
  assert.match(txt, /macOS 14\.5/);
  assert.match(txt, /Recommend|nginx\.service|Disk/i);
});

test("formatDoctor: surfaces extension health when provided", () => {
  const lines = formatDoctor(SNAP, assessHealth(SNAP), [
    { name: "anthropic-subscription-fix", source: "built-in", status: "loaded" },
    { name: "broken-ext", source: "user", status: "error", error: "boom" },
  ]);
  const txt = lines.join("\n");
  assert.match(txt, /Extensions/i);
  assert.match(txt, /anthropic-subscription-fix/);
  assert.match(txt, /broken-ext/);
  assert.match(txt, /boom|error/i);
});

test("formatDoctor: clean machine reports all clear", () => {
  const ok: SystemSnapshot = { os: "Linux", memory: { total: 100, used: 20, usedPct: 20 }, disks: [{ mount: "/", total: 100, used: 30, available: 70, usedPct: 30 }], topProcesses: [], failedServices: [] };
  assert.match(formatDoctor(ok, assessHealth(ok)).join("\n"), /all clear|ok/i);
});

test("formatProcesses: clean names, cpu + mem", () => {
  const lines = formatProcesses(SNAP);
  assert.match(lines.join("\n"), /Google Chrome Helper \(Renderer\)/);
  assert.match(lines.join("\n"), /42\.5/);
  assert.doesNotMatch(lines.join("\n"), /\/Applications/, "no raw paths");
});
