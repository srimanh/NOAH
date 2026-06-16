import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeTxId, recordOp, undo, rewindTo } from "./engine.js";
import { history } from "./ledger.js";
import { setCurrentTurn } from "./context.js";
import type { ToolAction } from "./types.js";

const ledger = () => join(mkdtempSync(join(tmpdir(), "noah-eng-")), "ops.jsonl");

test("makeTxId: monotonic-ish, unique", () => {
  const a = makeTxId(1000, () => 0.1);
  const b = makeTxId(1000, () => 0.2);
  assert.notEqual(a, b);
  assert.match(a, /^\d+-/);
});

test("recordOp: builds a reversible transaction and writes it", () => {
  const p = ledger();
  const tx = recordOp({ tool: "package", action: "install", pkg: "htop" }, { path: p });
  assert.equal(tx.reversible, true);
  assert.deepEqual(tx.inverse, { tool: "package", action: "remove", pkg: "htop" });
  assert.equal(history(p).length, 1);
});

test("recordOp: irreversible op is recorded but flagged", () => {
  const p = ledger();
  const tx = recordOp({ tool: "package", action: "update" }, { path: p });
  assert.equal(tx.reversible, false);
  assert.equal(tx.inverse, null);
});

test("undo: runs the inverse of the last reversible op and marks it undone", async () => {
  const p = ledger();
  recordOp({ tool: "package", action: "install", pkg: "htop" }, { path: p });

  const ran: ToolAction[] = [];
  const res = await undo({
    path: p,
    run: async (a) => {
      ran.push(a);
      return `removed ${(a as any).pkg}`;
    },
  });

  assert.equal(res.ok, true);
  assert.deepEqual(ran, [{ tool: "package", action: "remove", pkg: "htop" }], "ran the inverse");
  assert.equal(res.output, "removed htop");
  assert.equal(history(p).find((x) => x.action.tool === "package")!.undone, true);
});

test("undo: nothing to undo → ok:false with reason", async () => {
  const p = ledger();
  const res = await undo({ path: p, run: async () => "noop" });
  assert.equal(res.ok, false);
  assert.match(res.reason!, /nothing/i);
});

test("undo: specific id; non-reversible id refused", async () => {
  const p = ledger();
  const upd = recordOp({ tool: "package", action: "update" }, { path: p });
  const res = await undo({ id: upd.id, path: p, run: async () => "x" });
  assert.equal(res.ok, false);
  assert.match(res.reason!, /revers/i);
});

test("undo: a failing inverse does NOT mark the op undone", async () => {
  const p = ledger();
  recordOp({ tool: "service", action: "enable", name: "nginx" }, { path: p });
  const res = await undo({
    path: p,
    run: async () => {
      throw new Error("permission denied");
    },
  });
  assert.equal(res.ok, false);
  assert.match(res.reason!, /permission denied/);
  assert.equal(history(p)[0].undone, false, "stays reversible so the user can retry");
});

test("recordOp: a file op with a snapshot is reversible via restore", () => {
  const p = ledger();
  const tx = recordOp(
    { tool: "file", action: "edit", path: "/etc/ssh/sshd_config" },
    { path: p, snapshot: { originalPath: "/etc/ssh/sshd_config", existed: true, hash: "abc" } },
  );
  assert.equal(tx.reversible, true, "reversible because it has a snapshot");
  assert.equal(tx.inverse, null, "no command inverse for file ops");
});

test("undo: file op restores the snapshot (not a command)", async () => {
  const p = ledger();
  recordOp(
    { tool: "file", action: "write", path: "/tmp/x.conf" },
    { path: p, snapshot: { originalPath: "/tmp/x.conf", existed: false } },
  );
  const restored: string[] = [];
  const res = await undo({
    path: p,
    run: async () => {
      throw new Error("run should not be called for file ops");
    },
    restore: async (ref) => {
      restored.push(ref.originalPath);
    },
  });
  assert.equal(res.ok, true);
  assert.deepEqual(restored, ["/tmp/x.conf"]);
});

test("undo: file op with no restore handler → ok:false", async () => {
  const p = ledger();
  recordOp(
    { tool: "file", action: "write", path: "/tmp/x.conf" },
    { path: p, snapshot: { originalPath: "/tmp/x.conf", existed: false } },
  );
  const res = await undo({ path: p, run: async () => "x" });
  assert.equal(res.ok, false);
});

test("recordOp: tags the op with the current turn by default", () => {
  const p = ledger();
  setCurrentTurn(5);
  const tx = recordOp({ tool: "package", action: "install", pkg: "htop" }, { path: p });
  assert.equal(tx.turn, 5);
  setCurrentTurn(0);
});

test("rewindTo: undoes ops at/after the target turn, newest-first; keeps earlier turns", async () => {
  const p = ledger();
  recordOp({ tool: "package", action: "install", pkg: "a" }, { path: p, turn: 1 });
  recordOp({ tool: "package", action: "install", pkg: "b" }, { path: p, turn: 2 });
  recordOp({ tool: "service", action: "enable", name: "nginx" }, { path: p, turn: 2 });
  recordOp({ tool: "package", action: "install", pkg: "c" }, { path: p, turn: 3 });

  const order: string[] = [];
  const res = await rewindTo(2, {
    path: p,
    run: async (a) => {
      order.push((a as any).pkg ?? (a as any).name);
      return "ok";
    },
  });

  assert.equal(res.ok, true);
  assert.equal(res.undone, 3, "turns 2 and 3 undone");
  // newest-first: c (turn3), then nginx (turn2), then b (turn2)
  assert.deepEqual(order, ["c", "nginx", "b"]);

  const h = history(p);
  assert.equal(h.find((x) => (x.action as any).pkg === "a")!.undone, false, "turn 1 untouched");
  assert.equal(h.find((x) => (x.action as any).pkg === "c")!.undone, true);
});

test("rewindTo: skips already-undone and non-reversible ops; reports failures", async () => {
  const p = ledger();
  recordOp({ tool: "package", action: "update" }, { path: p, turn: 2 }); // not reversible
  recordOp({ tool: "package", action: "install", pkg: "z" }, { path: p, turn: 2 });
  const res = await rewindTo(2, {
    path: p,
    run: async () => {
      throw new Error("boom");
    },
  });
  assert.equal(res.ok, false, "the install's inverse failed");
  assert.equal(res.undone, 0);
  assert.equal(res.failures.length, 1, "only the reversible one was attempted");
});

test("rewindTo: nothing at/after target → ok with 0 undone", async () => {
  const p = ledger();
  recordOp({ tool: "package", action: "install", pkg: "a" }, { path: p, turn: 1 });
  const res = await rewindTo(5, { path: p, run: async () => "ok" });
  assert.equal(res.ok, true);
  assert.equal(res.undone, 0);
});

test("undo twice: second time finds nothing", async () => {
  const p = ledger();
  recordOp({ tool: "package", action: "install", pkg: "git" }, { path: p });
  await undo({ path: p, run: async () => "ok" });
  const second = await undo({ path: p, run: async () => "ok" });
  assert.equal(second.ok, false);
});
