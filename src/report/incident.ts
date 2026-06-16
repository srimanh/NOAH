/** Build a structured incident report from the audit log + ops ledger. */
import { buildTimeline, type TimelineEvent } from "./timeline.js";
import type { AuditEntry } from "../safety/audit.js";
import type { HistoryItem } from "../ops/types.js";

export interface IncidentSummary {
  actions: number;
  failures: number;
  changes: number;
  reversible: number;
  undone: number;
}

export interface IncidentReport {
  generatedAt: number;
  host: string;
  summary: IncidentSummary;
  timeline: TimelineEvent[];
  changes: Array<{ desc: string; reversible: boolean; undone: boolean }>;
}

export interface BuildInput {
  audit: AuditEntry[];
  history: HistoryItem[];
  host: string;
  now?: number;
}

export function buildIncident({ audit, history, host, now = Date.now() }: BuildInput): IncidentReport {
  return {
    generatedAt: now,
    host,
    summary: {
      actions: audit.length,
      failures: audit.filter((a) => !a.ok).length,
      changes: history.length,
      reversible: history.filter((h) => h.reversible && !h.undone).length,
      undone: history.filter((h) => h.undone).length,
    },
    timeline: buildTimeline(audit, history),
    changes: history.map((h) => ({ desc: h.desc, reversible: h.reversible, undone: h.undone })),
  };
}
