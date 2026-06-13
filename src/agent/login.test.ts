import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCallbacks, oauthCredential, type LoginUI } from "./login.js";

function fakeUI() {
  const log: string[] = [];
  const ui: LoginUI = {
    openUrl: (u) => log.push(`open:${u}`),
    note: (m) => log.push(`note:${m}`),
    prompt: async (m) => `code-for:${m}`,
    select: async (m, opts) => opts[0]?.id ?? undefined,
  };
  return { ui, log };
}

test("buildCallbacks: onAuth opens the url and shows it", () => {
  const { ui, log } = fakeUI();
  const cb = buildCallbacks(ui);
  cb.onAuth({ url: "https://claude.ai/oauth?x=1" });
  assert.ok(log.some((l) => l.startsWith("open:https://claude.ai")));
  assert.ok(log.some((l) => l.includes("claude.ai")));
});

test("buildCallbacks: onPrompt / onManualCodeInput delegate to ui.prompt", async () => {
  const { ui } = fakeUI();
  const cb = buildCallbacks(ui);
  assert.equal(await cb.onPrompt({ message: "Paste code" }), "code-for:Paste code");
  assert.match(await cb.onManualCodeInput!(), /code-for:/);
});

test("buildCallbacks: onDeviceCode + onSelect surface through ui", async () => {
  const { ui, log } = fakeUI();
  const cb = buildCallbacks(ui);
  cb.onDeviceCode({ userCode: "WXYZ-1234", verificationUri: "https://github.com/login/device" });
  assert.ok(log.some((l) => l.includes("WXYZ-1234") && l.includes("github.com/login/device")));
  const picked = await cb.onSelect({ message: "method", options: [{ id: "browser", label: "Browser" }] });
  assert.equal(picked, "browser");
});

test("oauthCredential: tags raw oauth creds for storage", () => {
  const c = oauthCredential({ refresh: "r", access: "a", expires: 123 });
  assert.equal(c.type, "oauth");
  assert.equal(c.refresh, "r");
  assert.equal(c.access, "a");
});
