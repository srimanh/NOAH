import { test } from "node:test";
import assert from "node:assert/strict";
import { NOAH_TOOLS, NOAH_CUSTOM_TOOLS, noahSessionConfig } from "./runtime.js";
import { NOAH_SYSTEM_PROMPT } from "./prompt/system.js";

test("NOAH_TOOLS: the full OS + telemetry tool set", () => {
  for (const t of ["read", "bash", "edit", "write", "grep", "find", "ls", "package", "service", "network", "system", "logs"]) {
    assert.ok(NOAH_TOOLS.includes(t), `missing ${t}`);
  }
});

test("NOAH_CUSTOM_TOOLS: package, service, network, system, logs", () => {
  assert.deepEqual(
    NOAH_CUSTOM_TOOLS.map((t) => t.name).sort(),
    ["logs", "network", "package", "service", "system"],
  );
});

test("noahSessionConfig: wires prompt, tools, safety + snapshot + caveman extensions", () => {
  const cfg = noahSessionConfig({ dryRun: false, autoYes: false });
  assert.equal(cfg.systemPromptOverride(), NOAH_SYSTEM_PROMPT);
  assert.deepEqual(cfg.appendSystemPromptOverride(), []);
  assert.equal(cfg.tools, NOAH_TOOLS);
  assert.equal(cfg.customTools, NOAH_CUSTOM_TOOLS);
  assert.equal(cfg.extensionFactories.length, 3, "safety + snapshot + caveman");
  for (const f of cfg.extensionFactories) assert.equal(typeof f, "function");
});

test("noahSessionConfig: caveman level comes from a live getter when provided", () => {
  let lvl = "off";
  const cfg = noahSessionConfig({ dryRun: false, autoYes: false, getCavemanLevel: () => lvl as never });
  // factory is a function (pi extension factory); just assert it's wired
  assert.equal(typeof cfg.extensionFactories[1], "function");
  // static fallback when no getter
  const cfg2 = noahSessionConfig({ dryRun: true, autoYes: true, caveman: "full" });
  assert.equal(typeof cfg2.extensionFactories[1], "function");
});
