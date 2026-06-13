/**
 * Status badges — colored, consistent indicators.
 * The literal words (INFO/RUNNING/SUCCESS/WARNING/BLOCKED/ALLOW/CONFIRM)
 * are preserved in output so plain-text assertions keep matching.
 */
import { bold, cyan, gray, green, red, yellow, fg256, UNICODE } from "./ansi.js";

export type Status =
  | "info"
  | "running"
  | "success"
  | "warning"
  | "blocked"
  | "allow"
  | "confirm";

interface BadgeSpec {
  label: string;
  dot: string;
  paint: (s: string) => string;
}

const orange = fg256(208);

const SPECS: Record<Status, BadgeSpec> = {
  info: { label: "INFO", dot: "●", paint: cyan },
  running: { label: "RUNNING", dot: "◐", paint: (s) => orange(s) },
  success: { label: "SUCCESS", dot: "●", paint: green },
  warning: { label: "WARNING", dot: "▲", paint: yellow },
  blocked: { label: "BLOCKED", dot: "■", paint: red },
  allow: { label: "ALLOW", dot: "●", paint: green },
  confirm: { label: "CONFIRM", dot: "▲", paint: yellow },
};

/** Inline badge, e.g. "● SUCCESS" (colored). */
export function badge(status: Status): string {
  const s = SPECS[status];
  const dot = UNICODE ? s.dot : "*";
  return s.paint(bold(`${dot} ${s.label}`));
}

/** Just the colored label text (no dot), for panel right-aligned tags. */
export function badgeLabel(status: Status): string {
  const s = SPECS[status];
  return s.paint(bold(s.label));
}

export function statusColor(status: Status): (s: string) => string {
  return SPECS[status].paint;
}

export const muted = gray;
