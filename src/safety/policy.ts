/**
 * Safety policy — the heart of the product.
 *
 * classify() decides the fate of every tool call BEFORE it runs:
 *   - deny    : catastrophic. Hard-blocked, no override.
 *   - confirm : dangerous. Requires explicit user approval.
 *   - allow   : safe. Runs freely.
 */

export type Action = "allow" | "confirm" | "deny";
export interface Verdict {
  action: Action;
  reason: string;
}

/** Catastrophic patterns — hard-blocked, never overridable. */
const BLOCKLIST: { re: RegExp; reason: string }[] = [
  { re: /\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\$HOME)(\s|$)/i, reason: "recursive delete of root/home" },
  { re: /\brm\s+-[a-z]*f[a-z]*r?\s+(\/|~)(\s|$)/i, reason: "force delete of root/home" },
  { re: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, reason: "fork bomb" },
  { re: /\bmkfs(\.\w+)?\b/i, reason: "filesystem format" },
  { re: /\bdd\b[^|]*\bof=\/dev\/(disk|sd|nvme|rdisk)/i, reason: "raw disk overwrite" },
  { re: />\s*\/dev\/(sd|disk|nvme|rdisk)/i, reason: "write to raw disk device" },
  { re: /\bchmod\s+-R\s+0*777\s+\/(\s|$)/i, reason: "recursive 777 on root" },
  { re: /\b(shutdown|reboot|halt|poweroff)\b/i, reason: "power state change" },
  { re: /\b(diskutil|gpt)\s+(erase|eraseDisk|eraseVolume|destroy)/i, reason: "disk erase" },
];

/** Dangerous indicators in a shell command — require confirmation. */
const DANGEROUS_CMD = [
  /\brm\b/i,
  /\bsudo\b/i,
  /\bmv\b/i,
  /\b(brew|apt|apt-get|dnf|pacman|yum|port)\s+(install|remove|uninstall|upgrade)/i,
  /\b(npm|pip|pip3|gem|cargo)\s+(install|uninstall)/i,
  /\b(curl|wget)\b/i, // network fetch
  /\b(systemctl|launchctl|service)\b/i,
  /\bkillall?\b/i,
  /\bchmod\b|\bchown\b/i,
  /\bgit\s+push\b/i,
  />\s*\/etc\//i,
];

/** Tools that mutate state — confirm by default. */
const MUTATING_TOOLS = new Set(["write", "edit", "package", "service"]);

function getCommand(input: unknown): string {
  if (input && typeof input === "object" && "command" in input) {
    return String((input as { command: unknown }).command ?? "");
  }
  return "";
}

export function classify(toolName: string, input: unknown): Verdict {
  const command = getCommand(input);

  // 1) Catastrophic — hard deny (applies to any command string).
  if (command) {
    for (const { re, reason } of BLOCKLIST) {
      if (re.test(command)) return { action: "deny", reason: `blocked: ${reason}` };
    }
  }

  // 2) Bash with dangerous indicators — confirm.
  if (toolName === "bash" && command) {
    for (const re of DANGEROUS_CMD) {
      if (re.test(command)) return { action: "confirm", reason: "potentially destructive command" };
    }
    return { action: "allow", reason: "read-only / safe command" };
  }

  // 3) Mutating tools — confirm.
  if (MUTATING_TOOLS.has(toolName)) {
    return { action: "confirm", reason: `${toolName} modifies the system` };
  }

  // 4) Everything else (read, grep, find, ls) — allow.
  return { action: "allow", reason: "safe tool" };
}
