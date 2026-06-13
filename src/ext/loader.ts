/**
 * Extension loader — discovers and registers NOAH extensions.
 *
 * Sources: built-in shims, ~/.noah/extensions (user), ./extensions (project).
 * Each extension is a module with a default-exported pi ExtensionFactory.
 * Failures are isolated: one broken extension never blocks the others.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { BUILTIN_EXTENSIONS } from "./builtins.js";

export type ExtensionSource = "built-in" | "user" | "project";
export type ExtensionStatus = "loaded" | "error";

export interface ExtensionRecord {
  name: string;
  source: ExtensionSource;
  status: ExtensionStatus;
  error?: string;
  factory?: ExtensionFactory;
}

export interface ExtensionDir {
  dir: string;
  source: ExtensionSource;
}

/** Default discovery locations, highest-trust last. */
export function extensionDirs(): ExtensionDir[] {
  return [
    { dir: join(homedir(), ".noah", "extensions"), source: "user" },
    { dir: join(process.cwd(), "extensions"), source: "project" },
  ];
}

const SCRIPT = /\.(mjs|cjs|js|ts)$/;

export interface DiscoverOptions {
  dirs?: ExtensionDir[];
  readdir?: (dir: string) => string[];
  importModule?: (path: string) => Promise<{ default?: unknown }>;
}

const defaultReaddir = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir) : []);
const defaultImport = (path: string) => import(pathToFileURL(path).href) as Promise<{ default?: unknown }>;

export async function discoverExtensions(opts: DiscoverOptions = {}): Promise<ExtensionRecord[]> {
  const dirs = opts.dirs ?? extensionDirs();
  const readdir = opts.readdir ?? defaultReaddir;
  const importModule = opts.importModule ?? defaultImport;
  const records: ExtensionRecord[] = [];

  for (const { dir, source } of dirs) {
    let files: string[] = [];
    try {
      files = readdir(dir).filter((f) => SCRIPT.test(f));
    } catch {
      continue; // unreadable dir → skip, don't fail discovery
    }
    for (const file of files) {
      const name = file.replace(SCRIPT, "");
      try {
        const mod = await importModule(join(dir, file));
        if (typeof mod.default !== "function") {
          records.push({ name, source, status: "error", error: "no default-exported extension function" });
          continue;
        }
        records.push({ name, source, status: "loaded", factory: mod.default as ExtensionFactory });
      } catch (err) {
        records.push({ name, source, status: "error", error: (err as Error).message });
      }
    }
  }
  return records;
}

export async function loadExtensions(opts: DiscoverOptions = {}): Promise<ExtensionRecord[]> {
  const builtins: ExtensionRecord[] = BUILTIN_EXTENSIONS.map((e) => ({
    name: e.name,
    source: "built-in",
    status: "loaded",
    factory: e.factory,
  }));
  const discovered = await discoverExtensions(opts);
  return [...builtins, ...discovered];
}

/** The factories of successfully-loaded extensions, for wiring into a session. */
export function activeFactories(records: ExtensionRecord[]): ExtensionFactory[] {
  return records.filter((r) => r.status === "loaded" && r.factory).map((r) => r.factory!);
}
