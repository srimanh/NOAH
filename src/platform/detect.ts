/**
 * Platform detection — pure, injectable capability probe.
 *
 * macOS → brew. Linux → probe package managers in priority order, first match wins.
 * No I/O here; the real `has()` (command -v) is supplied by adapter.ts.
 */
import type { PkgManager } from "./types.js";

export interface DetectInput {
  /** process.platform value, e.g. "darwin" | "linux". */
  platform: NodeJS.Platform | string;
  /** Returns true if a command exists on PATH. */
  has: (cmd: string) => boolean;
}

export interface PlatformDescriptor {
  kind: "macos" | "linux";
  pkgManager: PkgManager;
}

/** Linux package managers probed in priority order: (binary, manager). */
const LINUX_PMS: { bin: string; pm: PkgManager }[] = [
  { bin: "apt-get", pm: "apt" },
  { bin: "dnf", pm: "dnf" },
  { bin: "pacman", pm: "pacman" },
  { bin: "zypper", pm: "zypper" },
];

export function detectPlatform(input: DetectInput): PlatformDescriptor {
  if (input.platform === "darwin") {
    return { kind: "macos", pkgManager: "brew" };
  }
  for (const { bin, pm } of LINUX_PMS) {
    if (input.has(bin)) return { kind: "linux", pkgManager: pm };
  }
  // Unknown Linux: assume apt (most common); commands will surface real errors.
  return { kind: "linux", pkgManager: "apt" };
}
