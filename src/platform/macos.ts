/**
 * macOS adapter — brew + launchd + unified logging.
 * Service control is pragmatic, label-based launchctl (start/stop/restart/status).
 */
import type { NetAction, PkgAction, PlatformAdapter, ServiceAction, ShRunner } from "./types.js";

function pkgArgs(action: PkgAction, pkg?: string): string[] {
  const p = pkg ? [pkg] : [];
  if (action === "update") return ["upgrade", ...p];
  if (action === "remove") return ["uninstall", ...p];
  return ["install", ...p];
}

export function makeMacosAdapter(sh: ShRunner): PlatformAdapter {
  return {
    os: "macOS",
    pkgManager: "brew",
    pkg: (action, pkg) => sh("brew", pkgArgs(action, pkg)),
    service: async (name, action) => {
      switch (action) {
        case "start":
          return sh("launchctl", ["start", name]);
        case "stop":
          return sh("launchctl", ["stop", name]);
        case "restart":
          await sh("launchctl", ["stop", name]);
          return sh("launchctl", ["start", name]);
        case "status":
          return sh("launchctl", ["list", name]);
        default:
          // enable/disable map to bootstrap/bootout domains — out of scope.
          return `'${action}' is not supported on macOS launchctl (use start/stop/restart/status).`;
      }
    },
    logs: (unit) =>
      sh("log", [
        "show",
        "--last",
        "5m",
        ...(unit ? ["--predicate", `process == "${unit}"`] : []),
      ]),
    net: (action: NetAction, target) => {
      switch (action) {
        case "info":
          return sh("ifconfig", []);
        case "ports":
          return sh("lsof", ["-nP", "-iTCP", "-sTCP:LISTEN"]);
        case "connections":
          return sh("netstat", ["-an"]);
        case "ping":
          return sh("ping", ["-c", "4", target ?? ""]);
        case "fetch":
          return sh("curl", ["-sSL", "--max-time", "30", target ?? ""]);
      }
    },
  };
}
