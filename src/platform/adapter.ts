/**
 * Platform adapter — cross-platform proof.
 *
 * One abstract interface; per-OS backends. Hackathon ships macOS (brew).
 * Linux impl is a thin add later — the interface is the cross-platform story.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export type PkgAction = "install" | "remove" | "update";

export interface PlatformAdapter {
  readonly os: string;
  pkg(action: PkgAction, pkg?: string): Promise<string>;
}

async function sh(cmd: string, args: string[]): Promise<string> {
  try {
    const { stdout, stderr } = await exec(cmd, args, { timeout: 120_000 });
    return (stdout || "") + (stderr ? `\n${stderr}` : "");
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return e.stdout || e.stderr || e.message;
  }
}

const macos: PlatformAdapter = {
  os: "macOS",
  pkg: (action, pkg) => {
    if (action === "update") return sh("brew", ["upgrade", ...(pkg ? [pkg] : [])]);
    if (action === "remove") return sh("brew", ["uninstall", pkg ?? ""]);
    return sh("brew", ["install", pkg ?? ""]);
  },
};

// Minimal Linux (apt) stub — proves the adapter pattern. Expand later.
const linuxApt: PlatformAdapter = {
  os: "Linux (apt)",
  pkg: (action, pkg) => {
    const map: Record<PkgAction, string> = { install: "install", remove: "remove", update: "upgrade" };
    return sh("sudo", ["apt-get", map[action], "-y", ...(pkg ? [pkg] : [])]);
  },
};

export const platform: PlatformAdapter =
  process.platform === "darwin" ? macos : linuxApt;
