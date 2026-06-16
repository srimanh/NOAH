/**
 * Native desktop notifications + a persistent sentinel log.
 * Notifications are best-effort; the log is always written.
 */
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface NotifyCommand {
  cmd: string;
  args: string[];
}

export function sentinelLogPath(): string {
  return process.env.NOAH_SENTINEL_LOG || join(homedir(), ".noah", "sentinel.log");
}

/** Build the platform-native notification command (null if unsupported). */
export function notifyCommand(os: string, title: string, message: string): NotifyCommand | null {
  if (os === "macos") {
    const esc = (s: string) => s.replace(/"/g, '\\"');
    return {
      cmd: "osascript",
      args: ["-e", `display notification "${esc(message)}" with title "${esc(title)}"`],
    };
  }
  if (os === "linux") {
    return { cmd: "notify-send", args: [title, message] };
  }
  return null;
}

export function appendSentinelLog(line: string, path: string = sentinelLogPath()): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${new Date().toISOString()}  ${line}\n`);
  } catch {
    /* best-effort */
  }
}

/** Fire a native notification (best-effort) and always log it. */
export function notify(os: string, title: string, message: string): void {
  appendSentinelLog(`${title} — ${message}`);
  const c = notifyCommand(os, title, message);
  if (!c) return;
  try {
    spawn(c.cmd, c.args, { stdio: "ignore", detached: false }).on("error", () => {});
  } catch {
    /* notification is optional */
  }
}
