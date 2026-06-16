import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHistory, formatUndoResult } from "./report.js";
import type { HistoryItem } from "./types.js";

function item(over: Partial<HistoryItem>): HistoryItem {
  return {
    id: "1000-x",
    at: 1700000000000,
    action: { tool: "package", action: "install", pkg: "htop" },
    inverse: { tool: "package", action: "remove", pkg: "htop" },
    reversible: true,
    desc: "package install htop",
    undone: false,
    ...over,
  };
}

test("formatHistory: empty → friendly message", () => {
  assert.match(formatHistory([]), /No operations recorded/i);
});

test("formatHistory: newest first, marks reversible/undone", () => {
  const out = formatHistory([
    item({ id: "a", desc: "package install htop" }),
    item({ id: "b", desc: "package update (all)", reversible: false, inverse: null }),
    item({ id: "c", desc: "service enable nginx", undone: true }),
  ]);
  const lines = out.split("\n").filter(Boolean);
  // newest (c) should appear before oldest (a)
  assert.ok(lines.findIndex((l) => /nginx/.test(l)) < lines.findIndex((l) => /htop/.test(l)));
  assert.match(out, /htop/);
  assert.match(out, /undone/i); // c marked
  assert.match(out, /not reversible|irreversible/i); // b marked
});

test("formatUndoResult: success and failure phrasing", () => {
  assert.match(formatUndoResult({ ok: true, tx: item({}), output: "removed" }), /Undid|Reverted/i);
  assert.match(formatUndoResult({ ok: false, reason: "Nothing to undo." }), /Nothing to undo/);
});
