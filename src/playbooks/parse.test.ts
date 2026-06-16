import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlaybook } from "./parse.js";

const valid = {
  id: "harden-ssh",
  title: "Harden SSH",
  description: "Apply SSH best-practices",
  steps: [
    { name: "Install fail2ban", action: { tool: "package", action: "install", pkg: "fail2ban" } },
    { name: "Enable fail2ban", action: { tool: "service", action: "enable", name: "fail2ban" } },
  ],
};

test("parsePlaybook: accepts a well-formed playbook", () => {
  const r = parsePlaybook(valid);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.playbook.id, "harden-ssh");
    assert.equal(r.playbook.steps.length, 2);
  }
});

test("parsePlaybook: rejects missing id/title/steps", () => {
  assert.equal(parsePlaybook({}).ok, false);
  assert.equal(parsePlaybook({ id: "x", title: "y", description: "z" }).ok, false, "no steps");
  assert.equal(parsePlaybook({ id: "x", title: "y", description: "z", steps: [] }).ok, false, "empty steps");
});

test("parsePlaybook: rejects unknown tool / malformed step", () => {
  const bad = {
    id: "x",
    title: "y",
    description: "z",
    steps: [{ name: "weird", action: { tool: "nuke", action: "everything" } }],
  };
  const r = parsePlaybook(bad);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => /tool/i.test(e)));
});

test("parsePlaybook: rejects package step without pkg for install", () => {
  const bad = {
    id: "x",
    title: "y",
    description: "z",
    steps: [{ name: "install", action: { tool: "package", action: "install" } }],
  };
  assert.equal(parsePlaybook(bad).ok, false);
});

test("parsePlaybook: file write step requires path and content", () => {
  const ok = parsePlaybook({
    id: "x",
    title: "y",
    description: "z",
    steps: [{ name: "write", action: { tool: "file", action: "write", path: "/tmp/a", content: "hi" } }],
  });
  assert.equal(ok.ok, true);
  const bad = parsePlaybook({
    id: "x",
    title: "y",
    description: "z",
    steps: [{ name: "write", action: { tool: "file", action: "write", path: "/tmp/a" } }],
  });
  assert.equal(bad.ok, false);
});
