import { test } from "node:test";
import assert from "node:assert/strict";
import { isAuthed, authGate } from "./auth-gate.js";

const store = (creds: Record<string, unknown>) => ({ get: (p: string) => creds[p] }) as any;

test("isAuthed: true only when the provider has a credential", () => {
  const s = store({ anthropic: { type: "oauth" } });
  assert.equal(isAuthed("anthropic", s), true);
  assert.equal(isAuthed("openai", s), false);
});

test("authGate: allows when the model's provider is authed", () => {
  const s = store({ anthropic: { type: "oauth" } });
  const v = authGate({ provider: "anthropic", id: "claude-opus-4-8" } as any, s);
  assert.equal(v.ok, true);
});

test("authGate: blocks when signed out, naming provider + /login", () => {
  const s = store({});
  const v = authGate({ provider: "anthropic", id: "claude-opus-4-8" } as any, s);
  assert.equal(v.ok, false);
  assert.match((v as { reason: string }).reason, /anthropic/);
  assert.match((v as { reason: string }).reason, /login/i);
});

test("authGate: no model selected is blocked", () => {
  const v = authGate(undefined, store({}));
  assert.equal(v.ok, false);
});
