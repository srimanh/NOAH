import { test } from "node:test";
import assert from "node:assert/strict";
import { packageTool } from "./package.js";
import { serviceTool } from "./service.js";

test("packageTool: rich LLM-facing prompt fields", () => {
  // description should name the per-OS backends and the when-to-use rule
  assert.match(packageTool.description, /apt|brew/i);
  assert.match(packageTool.description, /prefer this over|raw shell|instead of/i);
  // one-line snippet for the Available tools list
  assert.ok(packageTool.promptSnippet, "has promptSnippet");
  assert.ok((packageTool.promptSnippet as string).length <= 90, "snippet is a one-liner");
  // guideline steering the model away from apt/brew in bash
  assert.ok(packageTool.promptGuidelines && packageTool.promptGuidelines.length > 0);
});

test("serviceTool: rich LLM-facing prompt fields", () => {
  assert.match(serviceTool.description, /systemd|launchd/i);
  assert.match(serviceTool.description, /start|stop|restart/i);
  assert.ok(serviceTool.promptSnippet, "has promptSnippet");
  assert.ok(serviceTool.promptGuidelines && serviceTool.promptGuidelines.length > 0);
});
