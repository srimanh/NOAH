import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateKeyPairSync } from "node:crypto";
import { signManifest, type SignedSkill } from "./signing.js";
import { installSkill, listSkills, getSkillPlaybook } from "./store.js";
import type { SkillManifest } from "./manifest.js";

function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    pub: publicKey.export({ type: "spki", format: "pem" }).toString(),
    priv: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

function signed(perms: string[], stepTool: "package" | "file"): SignedSkill {
  const manifest: SkillManifest = {
    id: "demo-skill",
    name: "Demo",
    version: "1.0.0",
    author: "alice",
    description: "d",
    permissions: perms as never,
    playbooks: [
      {
        id: "demo-pb",
        title: "Demo PB",
        description: "d",
        steps: [
          {
            name: "s",
            action:
              stepTool === "package"
                ? { tool: "package", action: "install", pkg: "ufw" }
                : { tool: "file", action: "write", path: "/tmp/x", content: "y" },
          },
        ],
      },
    ],
  };
  const { pub, priv } = keypair();
  return signManifest(manifest, priv, pub);
}

const dir = () => mkdtempSync(join(tmpdir(), "noah-skills-"));

test("installSkill: a signed, in-scope skill installs and lists", () => {
  const d = dir();
  const r = installSkill(signed(["package"], "package"), d);
  assert.equal(r.ok, true);
  const list = listSkills(d);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, "demo-skill");
});

test("installSkill: rejects a permission over-reach (declares package, uses file)", () => {
  const d = dir();
  const r = installSkill(signed(["package"], "file"), d);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => /file/.test(e)));
  assert.equal(listSkills(d).length, 0, "nothing installed");
});

test("installSkill: rejects a tampered (bad-signature) skill", () => {
  const d = dir();
  const s = signed(["package"], "package");
  s.manifest.author = "mallory"; // tamper after signing
  const r = installSkill(s, d);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => /signature/i.test(e)));
});

test("getSkillPlaybook: resolves an installed skill's playbook by id", () => {
  const d = dir();
  installSkill(signed(["package"], "package"), d);
  const found = getSkillPlaybook("demo-pb", d);
  assert.ok(found);
  assert.equal(found!.skillId, "demo-skill");
  assert.equal(getSkillPlaybook("nope", d), undefined);
});
