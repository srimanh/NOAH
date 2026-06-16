/**
 * Skill signing & verification (ed25519).
 *
 * The author signs the *canonical JSON* of the manifest with their private key
 * and ships the signature + public key. NOAH verifies before trusting a skill,
 * so a tampered manifest or a forged signature is rejected. This proves both
 * authenticity (who made it) and integrity (it wasn't altered).
 */
import { sign as edSign, verify as edVerify, createPublicKey, createPrivateKey } from "node:crypto";
import type { SkillManifest } from "./manifest.js";

export interface SignedSkill {
  manifest: SkillManifest;
  signature: string; // base64 ed25519 signature over canonicalize(manifest)
  publicKey: string; // PEM (spki)
}

/** Deterministic JSON: object keys sorted recursively, so signing is stable. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function signManifest(manifest: SkillManifest, privateKeyPem: string, publicKeyPem: string): SignedSkill {
  const key = createPrivateKey(privateKeyPem);
  const sig = edSign(null, Buffer.from(canonicalize(manifest)), key);
  return { manifest, signature: sig.toString("base64"), publicKey: publicKeyPem };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifySkill(signed: SignedSkill): VerifyResult {
  try {
    const key = createPublicKey(signed.publicKey);
    const ok = edVerify(
      null,
      Buffer.from(canonicalize(signed.manifest)),
      key,
      Buffer.from(signed.signature, "base64"),
    );
    return ok ? { ok: true } : { ok: false, reason: "signature does not match manifest" };
  } catch (err) {
    return { ok: false, reason: `signature verification failed: ${err instanceof Error ? err.message : err}` };
  }
}
