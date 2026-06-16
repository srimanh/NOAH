import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveMachineFacts } from "./capture.js";

test("deriveMachineFacts: turns telemetry into machine facts", () => {
  const facts = deriveMachineFacts({ os: "macOS 26.5.1", packageManager: "brew" });
  const texts = facts.map((f) => f.text);
  assert.ok(texts.some((t) => /macOS 26\.5\.1/.test(t)));
  assert.ok(texts.some((t) => /brew/.test(t)));
  assert.ok(facts.every((f) => f.kind === "machine" && f.source === "telemetry"));
});

test("deriveMachineFacts: omits unknown fields", () => {
  const facts = deriveMachineFacts({ os: "Ubuntu 24.04" });
  assert.equal(facts.length, 1, "only OS when no package manager");
  assert.match(facts[0].text, /Ubuntu/);
});
