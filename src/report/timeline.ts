/**
 * Timeline — fold the audit log (what NOAH did) and the ops ledger (what it
 * changed) into a single chronological view for an incident report.
 */
import type { AuditEntry } from "../safety/audit.js";
import type { HistoryItem } from "../ops/types.js";

export interface TimelineEvent {
  at: number; // epoch ms
  kind: "action" | "change" | "undo";
  text: string;
  ok?: boolean;
}

function inputText(input: unknown): string {
  if (input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    if (typeof o.command === "string") return o.command;
    return JSON.stringify(o);
  }
  return String(input ?? "");
}

export function buildTimeline(audit: AuditEntry[], ledger: HistoryItem[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const a of audit) {
    events.push({
      at: Date.parse(a.ts) || 0,
      kind: "action",
      text: `[${a.tool}] ${inputText(a.input)}`,
      ok: a.ok,
    });
  }

  for (const h of ledger) {
    const tags = [h.reversible ? "reversible" : "not reversible", h.undone ? "undone" : ""].filter(Boolean);
    events.push({
      at: h.at,
      kind: h.undone ? "undo" : "change",
      text: `${h.desc} (${tags.join(", ")})`,
    });
  }

  return events.sort((a, b) => a.at - b.at);
}
