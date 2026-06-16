import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILTIN_PLAYBOOKS, listBuiltins, getBuiltin } from "./builtins.js";

test("every built-in playbook parses cleanly", () => {
  for (const id of Object.keys(BUILTIN_PLAYBOOKS)) {
    const r = getBuiltin(id);
    assert.ok(r, `getBuiltin(${id}) returns`);
    assert.equal(r!.ok, true, `built-in "${id}" must be valid: ${JSON.stringify(r)}`);
  }
});

test("listBuiltins: id/title/description for each", () => {
  const list = listBuiltins();
  assert.ok(list.length >= 2);
  assert.ok(list.every((p) => p.id && p.title && p.description));
});

test("getBuiltin: unknown id → undefined", () => {
  assert.equal(getBuiltin("does-not-exist"), undefined);
});
