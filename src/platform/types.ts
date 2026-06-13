/**
 * Platform contract — one abstract interface, per-OS backends.
 * The cross-platform story: the same tools dispatch through this on Linux + macOS.
 */

export type PkgAction = "install" | "remove" | "update";
export type ServiceAction = "start" | "stop" | "restart" | "status" | "enable" | "disable";
export type NetAction = "info" | "ports" | "connections" | "ping" | "fetch";

/** Supported Linux package managers (probed at runtime). */
export type PkgManager = "apt" | "dnf" | "pacman" | "zypper" | "brew";

export interface PlatformAdapter {
  /** Human label, e.g. "macOS" or "Linux (dnf)". */
  readonly os: string;
  /** Resolved package manager backing this adapter. */
  readonly pkgManager: PkgManager;
  pkg(action: PkgAction, pkg?: string): Promise<string>;
  service(name: string, action: ServiceAction): Promise<string>;
  logs(unit?: string): Promise<string>;
  /** Network ops. `target` is a host (ping) or URL (fetch); unused by info/ports/connections. */
  net(action: NetAction, target?: string): Promise<string>;
}

/** A child-process runner: (cmd, args) -> combined stdout/stderr. Injectable for tests. */
export type ShRunner = (cmd: string, args: string[]) => Promise<string>;
