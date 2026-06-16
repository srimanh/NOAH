/**
 * Sign & verify incident reports (ed25519) — so a report can be proven
 * authentic and unaltered later. Reuses the same canonical-JSON approach as
 * skill signing.
 */
import { sign as edSign, verify as edVerify, createPublicKey, createPrivateKey } from "node:crypto";
import { canonicalize } from "../skills/signing.js";
import type { IncidentReport } from "./incident.js";

export interface SignedReport {
  report: IncidentReport;
  signature: string; // base64
  publicKey: string; // PEM (spki)
}

export function signReport(report: IncidentReport, privateKeyPem: string, publicKeyPem: string): SignedReport {
  const key = createPrivateKey(privateKeyPem);
  const sig = edSign(null, Buffer.from(canonicalize(report)), key);
  return { report, signature: sig.toString("base64"), publicKey: publicKeyPem };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

export function verifyReport(signed: SignedReport): VerifyResult {
  try {
    const key = createPublicKey(signed.publicKey);
    const ok = edVerify(
      null,
      Buffer.from(canonicalize(signed.report)),
      key,
      Buffer.from(signed.signature, "base64"),
    );
    return ok ? { ok: true } : { ok: false, reason: "signature does not match report" };
  } catch (err) {
    return { ok: false, reason: `verification failed: ${err instanceof Error ? err.message : err}` };
  }
}
