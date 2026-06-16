import { test } from "node:test";
import assert from "node:assert/strict";
import { sshCommand } from "./transport.js";

test("sshCommand: builds ssh args with user@host", () => {
  const c = sshCommand({ name: "web1", host: "10.0.0.1", user: "deploy" }, "noah doctor");
  assert.equal(c.cmd, "ssh");
  assert.ok(c.args.includes("deploy@10.0.0.1"));
  assert.equal(c.args[c.args.length - 1], "noah doctor");
});

test("sshCommand: no user → bare host", () => {
  const c = sshCommand({ name: "web2", host: "example.com" }, "uptime");
  assert.ok(c.args.includes("example.com"));
  assert.ok(!c.args.some((a) => a.includes("@")));
});

test("sshCommand: uses batch/non-interactive options (won't hang on prompts)", () => {
  const c = sshCommand({ name: "x", host: "h" }, "echo hi");
  const joined = c.args.join(" ");
  assert.match(joined, /BatchMode=yes/);
  assert.match(joined, /ConnectTimeout/);
});
