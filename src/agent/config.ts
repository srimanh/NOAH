/**
 * NOAH user config — small persisted preferences at ~/.noah/config.json.
 * Currently remembers the last-used model so NOAH reopens where you left off
 * instead of always defaulting to a built-in model.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface NoahConfig {
  lastModel?: string;
  /** Epoch ms of the last npm update check (rate-limits the network probe). */
  lastUpdateCheck?: number;
  /** Most recent version seen on the registry (used between checks). */
  latestKnownVersion?: string;
}

export const CONFIG_PATH = join(homedir(), ".noah", "config.json");

export function readConfig(path: string = CONFIG_PATH): NoahConfig {
  try {
    if (!existsSync(path)) return {};
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" ? (parsed as NoahConfig) : {};
  } catch {
    return {};
  }
}

export function writeConfig(cfg: NoahConfig, path: string = CONFIG_PATH): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(cfg, null, 2) + "\n");
  } catch {
    /* preferences are best-effort; never crash */
  }
}

export function getLastModel(path: string = CONFIG_PATH): string | undefined {
  return readConfig(path).lastModel;
}

export function setLastModel(ref: string, path: string = CONFIG_PATH): void {
  const cfg = readConfig(path);
  cfg.lastModel = ref;
  writeConfig(cfg, path);
}
