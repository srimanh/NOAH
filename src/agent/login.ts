/**
 * Login — reuses pi's real OAuth providers (Anthropic Claude Pro/Max,
 * GitHub Copilot, ChatGPT/Codex) instead of reimplementing the flow.
 *
 * pi-ai hides the oauth module behind its exports map, so we resolve the
 * installed package and import the file directly. The TUI supplies a LoginUI
 * (browser-open, code paste, sub-select); we map it to pi's OAuthLoginCallbacks.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface LoginUI {
  openUrl(url: string): void;
  note(message: string): void;
  prompt(message: string): Promise<string>;
  select(message: string, options: { id: string; label: string }[]): Promise<string | undefined>;
}

export interface LoginProvider {
  id: string;
  name: string;
}

/** Map our LoginUI to pi's OAuthLoginCallbacks shape. */
export function buildCallbacks(ui: LoginUI): Record<string, unknown> {
  return {
    onAuth: (info: { url: string; instructions?: string }) => {
      ui.note(`Opening your browser to sign in…\nIf it doesn't open, visit:\n${info.url}`);
      ui.openUrl(info.url);
    },
    onDeviceCode: (info: { userCode: string; verificationUri: string }) =>
      ui.note(`Go to ${info.verificationUri} and enter code:  ${info.userCode}`),
    onProgress: (message: string) => ui.note(message),
    onPrompt: (p: { message: string }) => ui.prompt(p.message),
    onManualCodeInput: () => ui.prompt("Paste the authorization code:"),
    onSelect: (p: { message: string; options: { id: string; label: string }[] }) => ui.select(p.message, p.options),
  };
}

/** Tag raw OAuth credentials so AuthStorage persists them as a subscription. */
export function oauthCredential(creds: Record<string, unknown>): { type: "oauth" } & Record<string, unknown> {
  return { type: "oauth", ...creds };
}

let oauthMod: Promise<Record<string, any>> | undefined;
function loadOAuth(): Promise<Record<string, any>> {
  if (!oauthMod) {
    // pi-ai exposes oauth only as an internal (non-exported) module. Resolve the
    // package's ESM entry, then walk to the oauth file by path and import it.
    const idxPath = fileURLToPath(import.meta.resolve("@earendil-works/pi-ai"));
    const file = join(dirname(idxPath), "utils", "oauth", "index.js");
    oauthMod = import(pathToFileURL(file).href);
  }
  return oauthMod;
}

export async function listLoginProviders(): Promise<LoginProvider[]> {
  const m = await loadOAuth();
  return (m.getOAuthProviders?.() ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
}

export interface AuthStoreSet {
  set(provider: string, cred: unknown): void;
}
export interface RegistryRefresh {
  refresh(): void;
}

/** Run pi's OAuth login for `id`, persist the credential, refresh models. */
export async function runLogin(
  id: string,
  ui: LoginUI,
  authStorage: AuthStoreSet,
  registry: RegistryRefresh,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const m = await loadOAuth();
    const provider = m.getOAuthProvider?.(id);
    if (!provider) return { ok: false, error: `unknown provider: ${id}` };
    const creds = await provider.login(buildCallbacks(ui));
    authStorage.set(id, oauthCredential(creds));
    registry.refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
