/** Curated, cross-platform built-in playbooks. */
import { parsePlaybook, type ParseResult } from "./parse.js";

export const BUILTIN_PLAYBOOKS: Record<string, unknown> = {
  "update-all": {
    id: "update-all",
    title: "Update everything",
    description: "Refresh and upgrade all OS packages via the native package manager.",
    steps: [{ name: "Upgrade all packages", action: { tool: "package", action: "update" } }],
  },

  "harden-ssh": {
    id: "harden-ssh",
    title: "Harden SSH",
    description: "Install fail2ban and enable it to protect SSH from brute-force attempts.",
    steps: [
      { name: "Install fail2ban", action: { tool: "package", action: "install", pkg: "fail2ban" } },
      { name: "Enable fail2ban at boot", action: { tool: "service", action: "enable", name: "fail2ban" } },
      { name: "Start fail2ban now", action: { tool: "service", action: "start", name: "fail2ban" } },
    ],
  },

  "setup-python": {
    id: "setup-python",
    title: "Set up Python",
    description: "Install a modern Python toolchain (python3 + pip).",
    steps: [
      { name: "Install Python 3", action: { tool: "package", action: "install", pkg: "python3" } },
      { name: "Install pip", action: { tool: "package", action: "install", pkg: "python3-pip" } },
    ],
  },
};

export function listBuiltins(): Array<{ id: string; title: string; description: string }> {
  return Object.values(BUILTIN_PLAYBOOKS).map((p) => {
    const o = p as { id: string; title: string; description: string };
    return { id: o.id, title: o.title, description: o.description };
  });
}

export function getBuiltin(id: string): ParseResult | undefined {
  const raw = BUILTIN_PLAYBOOKS[id];
  if (!raw) return undefined;
  return parsePlaybook(raw);
}
