import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline } from "./timeline.js";
import type { AuditEntry } from "../safety/audit.js";
import type { HistoryItem } from "../ops/types.js";

const audit: AuditEntry[] = [
  { ts: "2026-01-01T10:00:00.000Z", tool: "bash", input: { command: "ls" }, ok: true },
  { ts: "2026-01-01T10:00:30.000Z", tool: "package", input: { action: "install", pkg: "htop" }, ok: false },
];

const ledger: HistoryItem[] = [
  {
    id: "1",
    at: Date.parse("2026-01-01T10:00:20.000Z"),
    action: { tool: "package", action: "install", pkg: "htop" },
    inverse: { tool: "package", action: "remove", pkg: "htop" },
    reversible: true,
    desc: "package install htop",
    undone: false,
  },
];

test("buildTimeline: merges audit + ledger, sorted by time", () => {
  const tl = buildTimeline(audit, ledger);
  assert.equal(tl.length, 3);
  // chronological: ls (10:00:00) → change (10:00:20) → install audit (10:00:30)
  assert.match(tl[0].text, /ls/);
  assert.equal(tl[1].kind, "change");
  assert.match(tl[2].text, /htop/);
});

test("buildTimeline: marks failed actions", () => {
  const tl = buildTimeline(audit, []);
  const failed = tl.find((e) => e.ok === false);
  assert.ok(failed, "the failed install is captured");
});

test("buildTimeline: notes reversibility on changes", () => {
  const tl = buildTimeline([], ledger);
  assert.equal(tl[0].kind, "change");
  assert.match(tl[0].text, /reversible/i);
});

test("buildTimeline: empty inputs → empty timeline", () => {
  assert.deepEqual(buildTimeline([], []), []);
});
