import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { remember, rememberUnique, all, forget, forgetAll } from "./store.js";

const mem = () => join(mkdtempSync(join(tmpdir(), "noah-mem-")), "memory.jsonl");

test("remember + all: persists facts in order", () => {
  const p = mem();
  remember({ kind: "learning", text: "deploys with pm2", source: "user" }, p);
  remember({ kind: "preference", text: "prefers VS Code", source: "user" }, p);
  const facts = all(p);
  assert.equal(facts.length, 2);
  assert.equal(facts[0].text, "deploys with pm2");
  assert.ok(facts[0].id, "has an id");
});

test("rememberUnique: skips an identical fact (same kind+text)", () => {
  const p = mem();
  rememberUnique({ kind: "machine", text: "Package manager: brew", source: "telemetry" }, p);
  rememberUnique({ kind: "machine", text: "Package manager: brew", source: "telemetry" }, p);
  assert.equal(all(p).length, 1, "deduped");
  rememberUnique({ kind: "machine", text: "OS: macOS", source: "telemetry" }, p);
  assert.equal(all(p).length, 2);
});

test("forget: removes one fact by id", () => {
  const p = mem();
  const a = remember({ kind: "learning", text: "a", source: "user" }, p);
  remember({ kind: "learning", text: "b", source: "user" }, p);
  assert.equal(forget(a.id, p), true);
  assert.deepEqual(
    all(p).map((f) => f.text),
    ["b"],
  );
  assert.equal(forget("nope", p), false);
});

test("forgetAll: wipes everything", () => {
  const p = mem();
  remember({ kind: "learning", text: "a", source: "user" }, p);
  remember({ kind: "learning", text: "b", source: "user" }, p);
  forgetAll(p);
  assert.deepEqual(all(p), []);
});

test("all: missing file → empty, corrupt lines skipped", () => {
  assert.deepEqual(all(join(tmpdir(), "noah-mem-missing-xyz", "memory.jsonl")), []);
});
