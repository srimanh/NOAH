import { test } from "node:test";
import assert from "node:assert/strict";
import { networkTool } from "./network.js";
import { classify } from "../safety/policy.js";

function textOf(res: any): string {
  return res.content.map((c: any) => c.text).join("");
}

test("networkTool: schema + prompt fields", () => {
  assert.equal(networkTool.name, "network");
  assert.ok(networkTool.promptSnippet);
  assert.ok(networkTool.promptGuidelines && networkTool.promptGuidelines.length > 0);
  assert.match(networkTool.description, /fetch|ping|ports/i);
});

test("networkTool: ping/fetch require a target", async () => {
  const r1 = await networkTool.execute("id", { action: "ping" });
  assert.match(textOf(r1), /target|host|url/i);
  const r2 = await networkTool.execute("id", { action: "fetch" });
  assert.match(textOf(r2), /target|host|url/i);
});

test("policy: network fetch requires confirmation (exfiltration risk)", () => {
  assert.equal(classify("network", { action: "fetch", target: "https://x" }).action, "confirm");
});

test("policy: read-only network actions are allowed", () => {
  assert.equal(classify("network", { action: "info" }).action, "allow");
  assert.equal(classify("network", { action: "ports" }).action, "allow");
  assert.equal(classify("network", { action: "ping", target: "x" }).action, "allow");
});
