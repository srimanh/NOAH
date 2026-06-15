import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLastModel, setLastModel, readConfig } from "./config.js";

const tmp = () => join(mkdtempSync(join(tmpdir(), "noah-cfg-")), "config.json");

test("config: missing file → empty config, no throw", () => {
  assert.deepEqual(readConfig(join(tmpdir(), "nope-does-not-exist-xyz", "config.json")), {});
  assert.equal(getLastModel(join(tmpdir(), "nope-xyz", "config.json")), undefined);
});

test("config: persists and restores the last-used model", () => {
  const p = tmp();
  assert.equal(getLastModel(p), undefined);
  setLastModel("anthropic/claude-sonnet-4-5", p);
  assert.equal(getLastModel(p), "anthropic/claude-sonnet-4-5");
  // overwrite
  setLastModel("ollama/llama3.1", p);
  assert.equal(getLastModel(p), "ollama/llama3.1");
  assert.deepEqual(readConfig(p), { lastModel: "ollama/llama3.1" });
});

test("config: corrupt file is tolerated", () => {
  // write garbage then read
  const p = tmp();
  setLastModel("a/b", p);
  writeFileSync(p, "{ not json"); // simulate corruption
  assert.deepEqual(readConfig(p), {}, "corrupt → empty");
});
