import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAlerts, alertTitle } from "./alerts.js";
import type { HealthItem } from "../sys/health.js";

const item = (title: string, detail = ""): HealthItem => ({ severity: "high", title, detail });

test("formatAlerts: new issues marked, resolved marked", () => {
  const lines = formatAlerts({
    appeared: [item("Disk nearly full", "/ at 92%")],
    resolved: [item("Memory pressure")],
    ongoing: [],
  });
  assert.ok(lines.some((l) => /Disk nearly full/.test(l) && /92%/.test(l)));
  assert.ok(lines.some((l) => /resolved|cleared/i.test(l) && /Memory pressure/.test(l)));
});

test("formatAlerts: nothing appeared/resolved → no lines", () => {
  assert.deepEqual(formatAlerts({ appeared: [], resolved: [], ongoing: [item("x")] }), []);
});

test("alertTitle: summarizes count", () => {
  assert.match(alertTitle({ appeared: [item("a"), item("b")], resolved: [], ongoing: [] }), /2/);
});
