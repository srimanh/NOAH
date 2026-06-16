import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractPath, snapshotExtension } from "./snapshot-ext.js";
import { history } from "./ledger.js";
import { undo } from "./engine.js";
import { restoreSnapshot } from "./snapshot.js";

test("extractPath: reads common path field names", () => {
  assert.equal(extractPath({ path: "/a" }), "/a");
  assert.equal(extractPath({ file_path: "/b" }), "/b");
  assert.equal(extractPath({ filePath: "/c" }), "/c");
  assert.equal(extractPath({ nope: 1 }), null);
  assert.equal(extractPath("string"), null);
});

function fakePi() {
  const handlers: Record<string, Function[]> = {};
  const pi = { on: (name: string, fn: Function) => ((handlers[name] ??= []).push(fn), undefined) };
  const fire = async (name: string, event: unknown, ctx?: unknown) => {
    for (const h of handlers[name] || []) await h(event, ctx);
  };
  return { pi, fire };
}

test("snapshotExtension: write records a reversible file op that restores", async () => {
  const root = mkdtempSync(join(tmpdir(), "noah-snapext-"));
  const file = join(root, "sshd_config");
  const ledger = join(root, "ops.jsonl");
  process.env.NOAH_OPS_LEDGER = ledger;
  process.env.NOAH_SNAP_DIR = join(root, "snaps");
  try {
    writeFileSync(file, "PermitRootLogin yes");

    const { pi, fire } = fakePi();
    snapshotExtension()(pi as never);

    // BEFORE write: extension snapshots the current file
    await fire("tool_call", { toolName: "write", input: { path: file } });
    // the agent overwrites it
    writeFileSync(file, "PermitRootLogin no");
    // AFTER write: extension records the transaction
    await fire("tool_result", { toolName: "write", input: { path: file }, isError: false });

    const h = history(ledger);
    assert.equal(h.length, 1);
    assert.equal(h[0].reversible, true);
    assert.equal(h[0].action.tool, "file");

    // undo restores the original bytes
    const res = await undo({ path: ledger, run: async () => "", restore: async (r) => restoreSnapshot(r) });
    assert.equal(res.ok, true);
    assert.equal(readFileSync(file, "utf8"), "PermitRootLogin yes");
  } finally {
    delete process.env.NOAH_OPS_LEDGER;
    delete process.env.NOAH_SNAP_DIR;
  }
});

test("snapshotExtension: a failed write is NOT recorded", async () => {
  const root = mkdtempSync(join(tmpdir(), "noah-snapext2-"));
  const ledger = join(root, "ops.jsonl");
  process.env.NOAH_OPS_LEDGER = ledger;
  process.env.NOAH_SNAP_DIR = join(root, "snaps");
  try {
    const { pi, fire } = fakePi();
    snapshotExtension()(pi as never);
    await fire("tool_call", { toolName: "write", input: { path: join(root, "x") } });
    await fire("tool_result", { toolName: "write", input: { path: join(root, "x") }, isError: true });
    assert.equal(history(ledger).length, 0);
  } finally {
    delete process.env.NOAH_OPS_LEDGER;
    delete process.env.NOAH_SNAP_DIR;
  }
});

test("snapshotExtension: ignores non-file tools", async () => {
  const root = mkdtempSync(join(tmpdir(), "noah-snapext3-"));
  process.env.NOAH_OPS_LEDGER = join(root, "ops.jsonl");
  try {
    const { pi, fire } = fakePi();
    snapshotExtension()(pi as never);
    await fire("tool_call", { toolName: "bash", input: { command: "ls" } });
    await fire("tool_result", { toolName: "bash", input: { command: "ls" }, isError: false });
    assert.equal(history(process.env.NOAH_OPS_LEDGER!).length, 0);
  } finally {
    delete process.env.NOAH_OPS_LEDGER;
  }
});
