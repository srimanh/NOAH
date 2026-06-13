import { test } from "node:test";
import assert from "node:assert/strict";
import { Dashboard, meter } from "./dashboard.js";
import { visibleLen } from "../../ui/ansi.js";
import type { SystemSnapshot } from "../../sys/probe.js";
import { assessHealth } from "../../sys/health.js";

const snap: SystemSnapshot = {
  os: "macOS 14.5",
  memory: { total: 16 * 1024 ** 3, used: 13 * 1024 ** 3, usedPct: 82 },
  disks: [{ mount: "/", total: 500 * 1024 ** 3, used: 430 * 1024 ** 3, available: 70 * 1024 ** 3, usedPct: 86 }],
  topProcesses: [{ pid: 1, cpu: 90, mem: 5, command: "/usr/bin/node" }],
  failedServices: ["nginx.service"],
  updates: 3,
};
const data = () => ({ snap, health: assessHealth(snap) });

test("meter: fixed-width bar reflecting percent, fits width", () => {
  assert.equal(visibleLen(meter(50, 10).replace(/\x1b\[[0-9;]*m/g, "")), 10);
  assert.ok(meter(100, 12).length > 0);
  assert.ok(meter(0, 12).length > 0);
});

test("Dashboard: scanning state before data is ready", () => {
  const lines = new Dashboard(() => null).render(80);
  assert.match(lines.join("\n"), /scanning|reading/i);
});

test("Dashboard: shows status, memory, disk, a recommendation; fits width", () => {
  const d = new Dashboard(data);
  for (const w of [50, 80, 120]) {
    const lines = d.render(w);
    for (const l of lines) assert.ok(visibleLen(l) <= w, `fits ${w}`);
  }
  const txt = d.render(100).join("\n");
  assert.match(txt, /macOS 14\.5/);
  assert.match(txt, /82%/); // memory
  assert.match(txt, /86%/); // disk
  assert.match(txt, /critical/i); // status (failed service + disk)
  assert.match(txt, /nginx\.service|Disk nearly full|Memory/i); // a recommendation
});
