/**
 * Startup health dashboard — the "AI OS" first impression. On launch NOAH reads
 * the machine and shows status, memory/disk meters, and top recommendations.
 */
import type { Component } from "@earendil-works/pi-tui";
import { truncate, visibleLen, UNICODE } from "../../ui/ansi.js";
import { C, G, b, d } from "./theme.js";
import { humanBytes, type SystemSnapshot } from "../../sys/probe.js";
import { realDisks } from "../../sys/report.js";
import { assessHealth, type HealthReport, type Severity } from "../../sys/health.js";

export interface DashboardData {
  snap: SystemSnapshot;
  health: HealthReport;
}

const FULL = UNICODE ? "█" : "#";
const EMPTY = UNICODE ? "░" : "-";

/** A fixed-width meter bar for a percent. */
export function meter(pct: number, width: number): string {
  const p = Math.max(0, Math.min(100, pct));
  const filled = Math.round((p / 100) * width);
  const tint = p >= 90 ? C.danger : p >= 80 ? C.warn : C.good;
  return tint(FULL.repeat(filled)) + C.ghost(EMPTY.repeat(Math.max(0, width - filled)));
}

const SEV_GLYPH: Record<Severity, (s: string) => string> = {
  high: C.danger,
  medium: C.warn,
  low: C.faint,
};
const STATUS_TINT = { ok: C.good, warn: C.warn, critical: C.danger } as const;

export class Dashboard implements Component {
  constructor(private get: () => DashboardData | null) {}

  render(width: number): string[] {
    const data = this.get();
    if (!data) {
      return ["", ` ${C.plasma(G.node)} ${d(C.faint("reading machine state\u2026"))}`, ""];
    }
    const { snap, health } = data;
    const w = Math.max(20, width);
    const out: string[] = [""];

    const status = `${STATUS_TINT[health.status](health.status.toUpperCase())}`;
    out.push(` ${C.plasma(G.node)} ${b(C.star("SYSTEM"))}  ${d(C.faint(snap.os))}  ${C.ghost(G.dot)}  ${status}`);

    const barW = Math.min(18, Math.max(8, w - 40));
    if (snap.memory) {
      out.push(
        `   ${C.faint("memory")}  ${meter(snap.memory.usedPct, barW)} ${C.text(`${snap.memory.usedPct}%`)} ${d(
          C.faint(`(${humanBytes(snap.memory.used)} / ${humanBytes(snap.memory.total)})`),
        )}`,
      );
    }
    const root = (realDisks(snap)[0] ?? snap.disks[0]);
    if (root) {
      out.push(
        `   ${C.faint("disk  ")}  ${meter(root.usedPct, barW)} ${C.text(`${root.usedPct}%`)} ${d(
          C.faint(`(${humanBytes(root.available)} free on ${root.mount})`),
        )}`,
      );
    }

    if (health.items.length) {
      out.push(` ${C.plasma(G.node)} ${d(C.faint("recommendations"))}`);
      for (const it of health.items.slice(0, 3)) {
        const line = `   ${SEV_GLYPH[it.severity](G.caret)} ${C.text(it.title)}  ${d(C.faint(it.detail))}`;
        out.push(truncate(line, w));
      }
    } else {
      out.push(`   ${C.good(G.check)} ${C.text("all clear \u2014 nothing needs attention")}`);
    }
    out.push(`   ${d(C.faint('ask "how healthy is my machine?" or /doctor for the full report'))}`);
    out.push("");
    return out.map((l) => (visibleLen(l) > w ? truncate(l, w) : l));
  }

  invalidate(): void {}
}

/** Build dashboard data from a snapshot. */
export function dashboardData(snap: SystemSnapshot): DashboardData {
  return { snap, health: assessHealth(snap) };
}
