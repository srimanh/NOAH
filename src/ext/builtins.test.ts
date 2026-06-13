import { test } from "node:test";
import assert from "node:assert/strict";
import { stripPiIdentity, anthropicSubscriptionFix, githubCopilotFix, BUILTIN_EXTENSIONS } from "./builtins.js";

const LEAKED = "You are an expert coding assistant operating inside pi, a coding agent harness. You help users by editing code.";

test("stripPiIdentity: removes leaked pi identity, leaves clean prompts untouched", () => {
  const cleaned = stripPiIdentity(LEAKED);
  assert.doesNotMatch(cleaned, /inside pi/i);
  assert.doesNotMatch(cleaned, /coding agent harness/i);
  assert.match(cleaned, /You help users by/);
  // a NOAH prompt has none of those phrases → unchanged
  const noah = "You are NOAH, an AI System Administrator.";
  assert.equal(stripPiIdentity(noah), noah);
});

function handlerOf(factory: (pi: any) => void) {
  let h: any;
  factory({ on: (_e: string, fn: any) => (h = fn) });
  return h;
}

test("anthropicSubscriptionFix: rewrites only for the anthropic provider", async () => {
  const h = handlerOf(anthropicSubscriptionFix);
  const res = await h({ systemPrompt: LEAKED }, { model: { provider: "anthropic" } });
  assert.ok(res && /You help users by/.test(res.systemPrompt) && !/inside pi/i.test(res.systemPrompt));
  // other providers: no-op
  assert.equal(await h({ systemPrompt: LEAKED }, { model: { provider: "openai" } }), undefined);
});

test("githubCopilotFix: rewrites only for github-copilot", async () => {
  const h = handlerOf(githubCopilotFix);
  const res = await h({ systemPrompt: LEAKED }, { model: { provider: "github-copilot" } });
  assert.ok(res && !/inside pi/i.test(res.systemPrompt));
  assert.equal(await h({ systemPrompt: LEAKED }, { model: { provider: "anthropic" } }), undefined);
});

test("BUILTIN_EXTENSIONS: named, registered, both fixes present", () => {
  const names = BUILTIN_EXTENSIONS.map((e) => e.name);
  assert.ok(names.includes("anthropic-subscription-fix"));
  assert.ok(names.includes("github-copilot-fix"));
  for (const e of BUILTIN_EXTENSIONS) assert.equal(typeof e.factory, "function");
});
