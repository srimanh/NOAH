/**
 * Update notifications.
 *
 * NOAH checks the npm registry at most once a day (cached in ~/.noah/config.json)
 * and, if a newer version is published, shows a gentle banner pointing at
 * `noah update`. The check is best-effort and fully offline-safe — it never
 * blocks startup and never throws.
 */
import { readFileSync } from "node:fs";
import { readConfig, writeConfig, type NoahConfig } from "./config.js";
import { CONFIG_PATH } from "./config.js";

/** The running NOAH version, read from the package manifest. */
export function currentVersion(): string {
  try {
    const url = new URL("../../package.json", import.meta.url);
    return JSON.parse(readFileSync(url, "utf8")).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const PKG_NAME = "noah-agent";

interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

function parse(v: string): SemVer | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

/** -1 if a<b, 0 if equal, 1 if a>b. Unparseable inputs sort as equal. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return 0;
  for (const k of ["major", "minor", "patch"] as const) {
    if (pa[k] < pb[k]) return -1;
    if (pa[k] > pb[k]) return 1;
  }
  return 0;
}

export function isNewer(latest: string, current: string): boolean {
  return compareSemver(latest, current) > 0;
}

export function shouldCheck(now: number, lastCheck: number | undefined, intervalMs = DAY_MS): boolean {
  if (!lastCheck) return true;
  return now - lastCheck >= intervalMs;
}

export function formatUpdateBanner(current: string, latest: string): string {
  return `A new NOAH is available: ${current} → ${latest}.  Run  noah update  to upgrade.`;
}

/** Fetch the `latest` dist-tag version from the npm registry. Null on any failure. */
export async function fetchLatestVersion(
  pkg: string = PKG_NAME,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 2500,
): Promise<string | null> {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    const res = await fetchImpl(`https://registry.npmjs.org/${pkg}/latest`, {
      signal: ac.signal,
      headers: { accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res || !("ok" in res) || !res.ok) {
      // some fakes omit ok; tolerate and still try json
    }
    const body = (await res.json()) as { version?: string };
    return typeof body?.version === "string" ? body.version : null;
  } catch {
    return null;
  }
}

export interface UpdateInfo {
  current: string;
  latest: string;
  banner: string;
}

export interface CheckOptions {
  current: string;
  now?: number;
  configPath?: string;
  fetchImpl?: typeof fetch;
  pkg?: string;
}

/**
 * Resolve whether an update is available, using the daily cache. Returns the
 * update info (with a ready-to-print banner) or null when up to date / unknown.
 */
export async function checkForUpdate(opts: CheckOptions): Promise<UpdateInfo | null> {
  const { current, now = Date.now(), configPath = CONFIG_PATH, fetchImpl = fetch, pkg = PKG_NAME } = opts;
  const cfg: NoahConfig = readConfig(configPath);

  let latest = cfg.latestKnownVersion;
  if (shouldCheck(now, cfg.lastUpdateCheck)) {
    const fetched = await fetchLatestVersion(pkg, fetchImpl);
    cfg.lastUpdateCheck = now;
    if (fetched) {
      latest = fetched;
      cfg.latestKnownVersion = fetched;
    }
    writeConfig(cfg, configPath);
  }

  if (latest && isNewer(latest, current)) {
    return { current, latest, banner: formatUpdateBanner(current, latest) };
  }
  return null;
}
