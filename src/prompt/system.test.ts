import { test } from "node:test";
import assert from "node:assert/strict";
import { NOAH_SYSTEM_PROMPT } from "./system.js";

test("system prompt: NOAH OS-agent identity, not pi coding assistant", () => {
  assert.match(NOAH_SYSTEM_PROMPT, /\bNOAH\b/);
  assert.match(NOAH_SYSTEM_PROMPT, /operating system|operate .*system/i);
  assert.doesNotMatch(NOAH_SYSTEM_PROMPT, /expert coding assistant/i);
  assert.doesNotMatch(NOAH_SYSTEM_PROMPT, /inside pi/i);
});

test("system prompt: lists the abstract OS tools in pi's style", () => {
  assert.match(NOAH_SYSTEM_PROMPT, /Available tools:/);
  assert.match(NOAH_SYSTEM_PROMPT, /- package:/);
  assert.match(NOAH_SYSTEM_PROMPT, /- service:/);
  assert.match(NOAH_SYSTEM_PROMPT, /- bash:/);
});

test("system prompt: behaviour guidelines (plan-first, prefer tools, inspect first)", () => {
  assert.match(NOAH_SYSTEM_PROMPT, /Guidelines:/);
  assert.match(NOAH_SYSTEM_PROMPT, /plan/i);
  assert.match(NOAH_SYSTEM_PROMPT, /package tool/i);
  assert.match(NOAH_SYSTEM_PROMPT, /read-only|inspect/i);
});

test("system prompt: states the enforced safety contract", () => {
  assert.match(NOAH_SYSTEM_PROMPT, /safety/i);
  assert.match(NOAH_SYSTEM_PROMPT, /bypass|disable/i);
  assert.match(NOAH_SYSTEM_PROMPT, /audit/i);
});

test("system prompt: states the AI System Administrator doctrine", () => {
  // understand → analyze → recommend (severity) → approve → execute
  assert.match(NOAH_SYSTEM_PROMPT, /system administrator/i);
  assert.match(NOAH_SYSTEM_PROMPT, /\bsystem tool\b/i, "tells it to read telemetry first");
  assert.match(NOAH_SYSTEM_PROMPT, /impact|severity/i);
  assert.match(NOAH_SYSTEM_PROMPT, /recommend/i);
  assert.match(NOAH_SYSTEM_PROMPT, /before (installing|making|changing)/i, "pre-flight checks");
});

test("system prompt: does not hardcode date/cwd (pi appends those)", () => {
  assert.doesNotMatch(NOAH_SYSTEM_PROMPT, /Current date:/);
  assert.doesNotMatch(NOAH_SYSTEM_PROMPT, /Current working directory:/);
});
