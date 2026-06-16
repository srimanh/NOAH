import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performStep } from "./perform.js";
import { history } from "../ops/ledger.js";
import { undo } from "../ops/engine.js";
import { restoreSnapshot } from "../ops/snapshot.js";

test("performStep: file write snapshots, writes, and records a reversible op", async () => {
  const root = mkdtempSync(join(tmpdir(), "noah-perf-"));
  const file = join(root, "motd");
  process.env.NOAH_OPS_LEDGER = join(root, "ops.jsonl");
  process.env.NOAH_SNAP_DIR = join(root, "snaps");
  try {
    writeFileSync(file, "original motd");

    const out = await performStep(
      { name: "Set MOTD", action: { tool: "file", action: "write", path: file, content: "hardened motd" } },
      7,
    );
    assert.match(out, /motd/);
    assert.equal(readFileSync(file, "utf8"), "hardened motd");

    const h = history(process.env.NOAH_OPS_LEDGER!);
    assert.equal(h.length, 1);
    assert.equal(h[0].turn, 7, "tagged with the playbook turn");
    assert.equal(h[0].reversible, true);

    // and it actually rolls back
    const res = await undo({
      path: process.env.NOAH_OPS_LEDGER!,
      run: async () => "",
      restore: async (r) => restoreSnapshot(r),
    });
    assert.equal(res.ok, true);
    assert.equal(readFileSync(file, "utf8"), "original motd");
  } finally {
    delete process.env.NOAH_OPS_LEDGER;
    delete process.env.NOAH_SNAP_DIR;
  }
});
