/**
 * Usage panel — live token + context-window telemetry for the conversation.
 * Reads AgentSession stats each frame; updates as the response streams.
 */
import type { Component } from "@earendil-works/pi-tui";
import { truncate, visibleLen } from "../../ui/ansi.js";
import { C, G, d } from "./theme.js";

export interface UsageStats {
  model: string;
  input: number;
  output: number;
  total: number;
  /** Context-window utilization %, or null when unknown. */
  contextPercent: number | null;
}

/** Compact token count: 1234 → "1.2k", 1.5e6 → "1.5M". */
export function fmtTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export class UsageBar implements Component {
  constructor(private get: () => UsageStats) {}
  render(width: number): string[] {
    const s = this.get();
    const ctx = s.contextPercent == null ? "\u2014" : `${s.contextPercent}%`;
    const ctxTint = s.contextPercent != null && s.contextPercent >= 80 ? C.warn : C.text;
    const seg = [
      `${C.comet(G.node)} ${C.text(s.model)}`,
      `${C.faint("in")} ${C.text(fmtTokens(s.input))}`,
      `${C.faint("out")} ${C.text(fmtTokens(s.output))}`,
      `${C.faint("total")} ${C.text(fmtTokens(s.total))}`,
      `${C.faint("ctx")} ${ctxTint(ctx)}`,
    ];
    const line = "  " + seg.join(d(C.ghost(`  ${G.dot}  `)));
    return [visibleLen(line) > width ? truncate(line, width) : line];
  }
  invalidate(): void {}
}
