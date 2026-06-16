/** Render a health diff into human alert lines. */
import type { HealthItem } from "../sys/health.js";
import type { IssueDiff } from "./state.js";

function line(item: HealthItem): string {
  return item.detail ? `${item.title} — ${item.detail}` : item.title;
}

export function formatAlerts(diff: IssueDiff): string[] {
  const out: string[] = [];
  for (const i of diff.appeared) out.push(`⚠ ${line(i)}`);
  for (const i of diff.resolved) out.push(`✓ resolved: ${i.title}`);
  return out;
}

export function alertTitle(diff: IssueDiff): string {
  const n = diff.appeared.length;
  const r = diff.resolved.length;
  if (n && r) return `NOAH: ${n} new issue${n > 1 ? "s" : ""}, ${r} resolved`;
  if (n) return `NOAH: ${n} new issue${n > 1 ? "s" : ""}`;
  return `NOAH: ${r} issue${r > 1 ? "s" : ""} resolved`;
}
