/**
 * Sentinel state diffing — the anti-alert-fatigue brain.
 *
 * Two telemetry ticks produce two lists of health issues. We only want to alert
 * when a problem first *appears* (or clears), not on every tick while it lingers
 * or as a percentage drifts. So we key each issue by its normalized title and
 * diff the sets.
 */
import type { HealthItem } from "../sys/health.js";

/** Stable identity for an issue: title with counts/percentages collapsed. */
export function issueKey(item: HealthItem): string {
  return item.title
    .toLowerCase()
    .replace(/\d+/g, "#") // collapse counts/percentages
    .split(/\s+/)
    .map((w) => w.replace(/s$/, "")) // singular/plural → one key
    .filter(Boolean)
    .join(" ");
}

export interface IssueDiff {
  appeared: HealthItem[]; // present now, not before
  resolved: HealthItem[]; // present before, gone now
  ongoing: HealthItem[]; // present in both
}

export function diffIssues(prev: HealthItem[], curr: HealthItem[]): IssueDiff {
  const prevKeys = new Set(prev.map(issueKey));
  const currKeys = new Set(curr.map(issueKey));

  return {
    appeared: curr.filter((i) => !prevKeys.has(issueKey(i))),
    resolved: prev.filter((i) => !currKeys.has(issueKey(i))),
    ongoing: curr.filter((i) => prevKeys.has(issueKey(i))),
  };
}
