/**
 * Platform adapter entry — detects the OS + package manager and wires the
 * matching backend (Linux apt/dnf/pacman/zypper + systemd, or macOS brew + launchd).
 *
 * Detection logic lives in detect.ts (pure); this module supplies the real
 * `has()` (PATH probe) and `sh()` (child process) seams.
 */
import { execFile } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { detectPlatform } from "./detect.js";
import { makeLinuxAdapter } from "./linux.js";
import { makeMacosAdapter } from "./macos.js";
import type { PlatformAdapter, ShRunner } from "./types.js";

export type { PkgAction, ServiceAction, PlatformAdapter, PkgManager } from "./types.js";

const exec = promisify(execFile);

/** Run a command, returning combined stdout+stderr; never throws (errors surface as text). */
const sh: ShRunner = async (cmd, args) => {
  try {
    const { stdout, stderr } = await exec(cmd, args, { timeout: 120_000 });
    return (stdout || "") + (stderr ? `\n${stderr}` : "");
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return e.stdout || e.stderr || e.message;
  }
};

/** True if `cmd` is an executable on PATH (sync, no child process). */
function hasOnPath(cmd: string): boolean {
  const dirs = (process.env.PATH ?? "").split(":").filter(Boolean);
  for (const dir of dirs) {
    try {
      accessSync(join(dir, cmd), constants.X_OK);
      return true;
    } catch {
      // not here, keep looking
    }
  }
  return false;
}

function build(): PlatformAdapter {
  const d = detectPlatform({ platform: process.platform, has: hasOnPath });
  if (d.kind === "macos") return makeMacosAdapter(sh);
  return makeLinuxAdapter(d.pkgManager as Exclude<typeof d.pkgManager, "brew">, sh);
}

export const platform: PlatformAdapter = build();
