import { test } from "node:test";
import assert from "node:assert/strict";
import { parseManifest } from "./manifest.js";

const valid = {
  id: "harden-pro",
  name: "Harden Pro",
  version: "1.0.0",
  author: "alice",
  description: "Advanced hardening",
  permissions: ["package", "service"],
  playbooks: [
    {
      id: "harden-pro",
      title: "Harden Pro",
      description: "do it",
      steps: [{ name: "install ufw", action: { tool: "package", action: "install", pkg: "ufw" } }],
    },
  ],
};

test("parseManifest: accepts a well-formed manifest", () => {
  const r = parseManifest(valid);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.manifest.id, "harden-pro");
    assert.deepEqual(r.manifest.permissions, ["package", "service"]);
    assert.equal(r.manifest.playbooks.length, 1);
  }
});

test("parseManifest: rejects missing required fields", () => {
  assert.equal(parseManifest({}).ok, false);
  assert.equal(parseManifest({ ...valid, id: "" }).ok, false);
  assert.equal(parseManifest({ ...valid, version: "not-semver" }).ok, false);
});

test("parseManifest: rejects unknown permission", () => {
  const r = parseManifest({ ...valid, permissions: ["package", "network-raw"] });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => /permission/i.test(e)));
});

test("parseManifest: rejects when a playbook is malformed", () => {
  const r = parseManifest({ ...valid, playbooks: [{ id: "x" }] });
  assert.equal(r.ok, false);
});

test("parseManifest: requires at least one playbook", () => {
  assert.equal(parseManifest({ ...valid, playbooks: [] }).ok, false);
});
