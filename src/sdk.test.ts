import { test } from "node:test";
import assert from "node:assert/strict";
import * as sdk from "./sdk.js";

test("SDK: exposes the embedding entry point", () => {
  assert.equal(typeof sdk.createNoahSession, "function");
  assert.equal(typeof sdk.buildNoahRuntime, "function");
  assert.equal(typeof sdk.noahSessionConfig, "function");
});

test("SDK: re-exports the OS tools and safety policy", () => {
  assert.equal(sdk.packageTool.name, "package");
  assert.equal(sdk.serviceTool.name, "service");
  assert.equal(sdk.networkTool.name, "network");
  assert.equal(typeof sdk.classify, "function");
  // policy still gates a catastrophe through the SDK surface
  assert.equal(sdk.classify("bash", { command: "rm -rf /" }).action, "deny");
});

test("SDK: re-exports provider + caveman + platform building blocks", () => {
  assert.equal(typeof sdk.buildRegistry, "function");
  assert.equal(typeof sdk.cavemanExtension, "function");
  assert.ok(Array.isArray(sdk.CAVEMAN_LEVELS));
  assert.ok(typeof sdk.platform.os === "string");
});
