import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendEvent, loadEvents, history, lastUndoable, getById } from "./ledger.js";
import type { Transaction } from "./types.js";

const ledger = () => join(mkdtempSync(join(tmpdir(), "noah-ops-")), "ops.jsonl");

function tx(id: string, pkg: string): Transaction {
  return {
    id,
    at: Number(id),
    action: { tool: "package", action: "install", pkg },
    inverse: { tool: "package", action: "remove", pkg },
    reversible: true,
    desc: `package install ${pkg}`,
  };
}

test("appendEvent + loadEvents: round-trips events in order", () => {
  const p = ledger();
  appendEvent({ kind: "op", tx: tx("1000", "htop") }, p);
  appendEvent({ kind: "op", tx: tx("1001", "git") }, p);
  const evs = loadEvents(p);
  assert.equal(evs.length, 2);
  assert.equal(evs[0].kind, "op");
});

test("loadEvents: skips corrupt lines, never throws", () => {
  const p = ledger();
  appendEvent({ kind: "op", tx: tx("1000", "htop") }, p);
  appendFileSync(p, "this is not json\n");
  appendEvent({ kind: "op", tx: tx("1001", "git") }, p);
  assert.equal(loadEvents(p).length, 2, "two valid events, garbage skipped");
});

test("history: folds undo events into status", () => {
  const p = ledger();
  appendEvent({ kind: "op", tx: tx("1000", "htop") }, p);
  appendEvent({ kind: "op", tx: tx("1001", "git") }, p);
  appendEvent({ kind: "undo", id: "1000", at: 1002 }, p);
  const h = history(p);
  assert.equal(h.length, 2);
  assert.equal(h.find((x) => x.id === "1000")!.undone, true);
  assert.equal(h.find((x) => x.id === "1001")!.undone, false);
});

test("lastUndoable: newest reversible op that is not yet undone", () => {
  const p = ledger();
  appendEvent({ kind: "op", tx: tx("1000", "htop") }, p);
  appendEvent({ kind: "op", tx: tx("1001", "git") }, p);
  assert.equal(lastUndoable(p)!.id, "1001");
  appendEvent({ kind: "undo", id: "1001", at: 1002 }, p);
  assert.equal(lastUndoable(p)!.id, "1000", "skips already-undone");
});

test("lastUndoable: skips non-reversible ops", () => {
  const p = ledger();
  const upd: Transaction = {
    id: "2000",
    at: 2000,
    action: { tool: "package", action: "update" },
    inverse: null,
    reversible: false,
    desc: "package update (all)",
  };
  appendEvent({ kind: "op", tx: upd }, p);
  assert.equal(lastUndoable(p), undefined);
});

test("getById: returns the folded item or undefined", () => {
  const p = ledger();
  appendEvent({ kind: "op", tx: tx("1000", "htop") }, p);
  assert.equal(getById("1000", p)!.desc, "package install htop");
  assert.equal(getById("nope", p), undefined);
});

test("empty/missing ledger → empty history", () => {
  assert.deepEqual(history(join(tmpdir(), "noah-ops-missing-xyz", "ops.jsonl")), []);
});
