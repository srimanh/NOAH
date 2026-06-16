import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { canonicalize, signManifest, verifySkill } from "./signing.js";
import type { SkillManifest } from "./manifest.js";

const manifest: SkillManifest = {
  id: "s",
  name: "S",
  version: "1.0.0",
  author: "a",
  description: "d",
  permissions: ["package"],
  playbooks: [
    { id: "p", title: "P", description: "d", steps: [{ name: "x", action: { tool: "package", action: "update" } }] },
  ],
};

function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    pub: publicKey.export({ type: "spki", format: "pem" }).toString(),
    priv: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

test("canonicalize: stable regardless of key order", () => {
  const a = canonicalize({ b: 1, a: 2 } as never);
  const b = canonicalize({ a: 2, b: 1 } as never);
  assert.equal(a, b);
});

test("signManifest + verifySkill: a correctly signed skill verifies", () => {
  const { pub, priv } = keypair();
  const signed = signManifest(manifest, priv, pub);
  const r = verifySkill(signed);
  assert.equal(r.ok, true);
});

test("verifySkill: tampered manifest fails verification", () => {
  const { pub, priv } = keypair();
  const signed = signManifest(manifest, priv, pub);
  // mutate the manifest after signing
  signed.manifest.permissions.push("file" as never);
  const r = verifySkill(signed);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.reason, /signature/i);
});

test("verifySkill: wrong key fails verification", () => {
  const { priv } = keypair();
  const other = keypair();
  const signed = signManifest(manifest, priv, other.pub); // signed with priv, but advertises other.pub
  const r = verifySkill(signed);
  assert.equal(r.ok, false);
});

test("verifySkill: garbage signature → fails, never throws", () => {
  const { pub } = keypair();
  const r = verifySkill({ manifest, signature: "not-base64-sig", publicKey: pub });
  assert.equal(r.ok, false);
});
