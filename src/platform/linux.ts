/**
 * Linux adapter — package + service + logs across apt/dnf/pacman/zypper + systemd.
 * The package-manager mapping is the cross-distro core.
 */
import type {
  NetAction,
  PkgAction,
  PkgManager,
  PlatformAdapter,
  ServiceAction,
  ShRunner,
} from "./types.js";

/** Build the argv (after `sudo`) for a package action on a given manager. */
function pkgArgs(pm: PkgManager, action: PkgAction, pkg?: string): string[] {
  const p = pkg ? [pkg] : [];
  switch (pm) {
    case "pacman": {
      const flag = { install: "-S", remove: "-R", update: "-Syu" }[action];
      return ["pacman", flag, "--noconfirm", ...p];
    }
    case "apt": {
      const sub = { install: "install", remove: "remove", update: "upgrade" }[action];
      return ["apt-get", sub, "-y", ...p];
    }
    case "dnf": {
      const sub = { install: "install", remove: "remove", update: "upgrade" }[action];
      return ["dnf", sub, "-y", ...p];
    }
    case "zypper": {
      const sub = { install: "install", remove: "remove", update: "update" }[action];
      return ["zypper", sub, "-y", ...p];
    }
    default:
      return ["apt-get", "install", "-y", ...p];
  }
}

/** systemctl actions that change state need root; status is read-only. */
const MUTATING_SERVICE: ReadonlySet<ServiceAction> = new Set([
  "start",
  "stop",
  "restart",
  "enable",
  "disable",
]);

export function makeLinuxAdapter(pm: Exclude<PkgManager, "brew">, sh: ShRunner): PlatformAdapter {
  return {
    os: `Linux (${pm})`,
    pkgManager: pm,
    pkg: (action, pkg) => sh("sudo", pkgArgs(pm, action, pkg)),
    service: (name, action) => {
      if (action === "status") return sh("systemctl", ["status", name, "--no-pager"]);
      if (MUTATING_SERVICE.has(action)) return sh("sudo", ["systemctl", action, name]);
      return sh("systemctl", [action, name, "--no-pager"]);
    },
    logs: (unit) =>
      sh("journalctl", [...(unit ? ["-u", unit] : []), "-n", "200", "--no-pager"]),
    net: (action: NetAction, target) => {
      switch (action) {
        case "info":
          return sh("ip", ["-br", "addr"]);
        case "ports":
          return sh("ss", ["-tlnp"]);
        case "connections":
          return sh("ss", ["-tnp"]);
        case "ping":
          return sh("ping", ["-c", "4", target ?? ""]);
        case "fetch":
          return sh("curl", ["-sSL", "--max-time", "30", target ?? ""]);
      }
    },
  };
}
