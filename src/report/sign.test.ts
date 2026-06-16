import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { signReport, verifyReport } from "./sign.js";
import { buildIncident } from "./incident.js";

function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    pub: publicKey.export({ type: "spki", format: "pem" }).toString(),
    priv: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

const report = buildIncident({ audit: [], history: [], host: "macOS 26", now: 1000 });

test("signReport + verifyReport: a correctly signed report verifies", () => {
  const { pub, priv } = keypair();
  const signed = signReport(report, priv, pub);
  assert.equal(verifyReport(signed).ok, true);
});

test("verifyReport: a tampered report fails", () => {
  const { pub, priv } = keypair();
  const signed = signReport(report, priv, pub);
  signed.report.host = "evil-host"; // tamper
  assert.equal(verifyReport(signed).ok, false);
});

test("verifyReport: garbage signature → fails, never throws", () => {
  const { pub } = keypair();
  assert.equal(verifyReport({ report, signature: "nope", publicKey: pub }).ok, false);
});
