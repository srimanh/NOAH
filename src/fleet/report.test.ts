import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFleetResults } from "./report.js";
import type { FleetResult } from "./coordinator.js";

const results: FleetResult[] = [
  { node: "web1", ok: true, output: "all good" },
  { node: "web2", ok: false, output: "", error: "connection refused" },
];

test("formatFleetResults: per-node status + summary count", () => {
  const out = formatFleetResults(results);
  assert.match(out, /web1/);
  assert.match(out, /web2/);
  assert.match(out, /connection refused/);
  assert.match(out, /1\/2|1 of 2/, "summary of how many succeeded");
});

test("formatFleetResults: empty → friendly message", () => {
  assert.match(formatFleetResults([]), /no nodes|empty/i);
});
