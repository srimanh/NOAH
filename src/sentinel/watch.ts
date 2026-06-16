/**
 * Sentinel watch loop. Periodically probes health, diffs against the previous
 * tick, and fires an alert only when problems appear or clear. Everything
 * external (probe, clock, alert sink) is injected so the loop is fully testable
 * and the CLI just supplies real implementations.
 */
import type { HealthItem } from "../sys/health.js";
import { diffIssues, type IssueDiff } from "./state.js";
import { formatAlerts } from "./alerts.js";

export interface WatchOptions {
  probe: () => Promise<HealthItem[]>;
  onAlert: (lines: string[], diff: IssueDiff) => void;
  intervalMs: number;
  /** Stop after this many ticks (tests / one-shot). Omit to run until aborted. */
  maxTicks?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Abort signal for graceful shutdown (Ctrl-C). */
  signal?: AbortSignal;
}

export interface WatchResult {
  ticks: number;
  alerts: number;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function runWatch(opts: WatchOptions): Promise<WatchResult> {
  const sleep = opts.sleep ?? defaultSleep;
  let prev: HealthItem[] = [];
  let ticks = 0;
  let alerts = 0;

  while (!opts.signal?.aborted) {
    let curr: HealthItem[];
    try {
      curr = await opts.probe();
    } catch {
      curr = prev; // probe hiccup → treat as unchanged, keep watching
    }
    ticks++;

    const diff = diffIssues(prev, curr);
    if (diff.appeared.length || diff.resolved.length) {
      alerts++;
      opts.onAlert(formatAlerts(diff), diff);
    }
    prev = curr;

    if (opts.maxTicks != null && ticks >= opts.maxTicks) break;
    await sleep(opts.intervalMs);
  }

  return { ticks, alerts };
}
