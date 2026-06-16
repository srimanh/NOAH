import { test } from "node:test";
import assert from "node:assert/strict";
import { requiredPermissions, checkPermissions } from "./permissions.js";
import type { SkillManifest } from "./manifest.js";

function manifest(perms: string[], stepTools: string[]): SkillManifest {
  return {
    id: "s",
    name: "S",
    version: "1.0.0",
    author: "a",
    description: "d",
    permissions: perms as never,
    playbooks: [
      {
        id: "p",
        title: "P",
        description: "d",
        steps: stepTools.map((t, i) => ({
          name: `step ${i}`,
          action:
            t === "package"
              ? { tool: "package", action: "install", pkg: "x" }
              : t === "service"
                ? { tool: "service", action: "enable", name: "x" }
                : { tool: "file", action: "write", path: "/tmp/x", content: "y" },
        })) as never,
      },
    ],
  };
}

test("requiredPermissions: derives the set of tools a skill's steps use", () => {
  const reqs = requiredPermissions(manifest([], ["package", "service", "package"]));
  assert.deepEqual([...reqs].sort(), ["package", "service"]);
});

test("checkPermissions: passes when declared ⊇ required", () => {
  const v = checkPermissions(manifest(["package", "service"], ["package", "service"]));
  assert.deepEqual(v, []);
});

test("checkPermissions: FLAGS over-reach (a step uses an undeclared tool)", () => {
  // declares only package, but a step writes a file → privilege escalation
  const v = checkPermissions(manifest(["package"], ["package", "file"]));
  assert.equal(v.length, 1);
  assert.match(v[0], /file/);
});

test("checkPermissions: declaring more than used is allowed (just not less)", () => {
  const v = checkPermissions(manifest(["package", "service", "file"], ["package"]));
  assert.deepEqual(v, []);
});
