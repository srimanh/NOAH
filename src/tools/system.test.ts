import { test } from "node:test";
import assert from "node:assert/strict";
import { systemTool } from "./system.js";
import { logsTool } from "./logs.js";
import { classify } from "../safety/policy.js";

const textOf = (r: any) => r.content.map((c: any) => c.text).join("");

test("systemTool: read-only schema + prompt fields", () => {
  assert.equal(systemTool.name, "system");
  assert.ok(systemTool.promptSnippet);
  assert.ok(systemTool.promptGuidelines && systemTool.promptGuidelines.length > 0);
  assert.match(systemTool.description, /disk|memory|processes|health/i);
});

test("systemTool: 'info' returns a grounded snapshot", async () => {
  const res = await systemTool.execute("1", { action: "info" });
  const txt = textOf(res);
  assert.match(txt, /OS:/);
  assert.match(txt, /Disks:|Memory:/);
});

test("systemTool: 'disk' and 'processes' work", async () => {
  assert.match(textOf(await systemTool.execute("2", { action: "disk" })), /%|free|used|n\/a/i);
  assert.match(textOf(await systemTool.execute("3", { action: "processes" })), /cpu|pid|n\/a/i);
});

test("policy: system + logs are read-only (allowed, no confirm)", () => {
  assert.equal(classify("system", { action: "info" }).action, "allow");
  assert.equal(classify("logs", { unit: "nginx" }).action, "allow");
});

test("logsTool: schema + prompt fields", () => {
  assert.equal(logsTool.name, "logs");
  assert.ok(logsTool.promptSnippet);
  assert.match(logsTool.description, /log/i);
});
