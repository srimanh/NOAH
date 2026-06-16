/**
 * Append-only operations ledger (~/.noah/ops.jsonl).
 *
 * One JSON event per line. Operations and undos are both events — we never
 * mutate or delete history, we fold the event stream to compute current state.
 * This keeps the ledger tamper-evident and audit-friendly.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { HistoryItem, LedgerEvent, Transaction } from "./types.js";

/** Resolved at call time so tests (and `NOAH_OPS_LEDGER`) take effect. */
export function defaultLedgerPath(): string {
  return process.env.NOAH_OPS_LEDGER || join(homedir(), ".noah", "ops.jsonl");
}

export function appendEvent(ev: LedgerEvent, path: string = defaultLedgerPath()): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, JSON.stringify(ev) + "\n");
  } catch {
    /* ledger is best-effort; never crash a real operation over bookkeeping */
  }
}

export function loadEvents(path: string = defaultLedgerPath()): LedgerEvent[] {
  if (!existsSync(path)) return [];
  const out: LedgerEvent[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const ev = JSON.parse(trimmed) as LedgerEvent;
      if (ev && (ev.kind === "op" || ev.kind === "undo")) out.push(ev);
    } catch {
      /* skip corrupt line */
    }
  }
  return out;
}

/** Fold events into the current list of operations (oldest → newest). */
export function history(path: string = defaultLedgerPath()): HistoryItem[] {
  const events = loadEvents(path);
  const undone = new Set<string>();
  for (const ev of events) if (ev.kind === "undo") undone.add(ev.id);

  const items: HistoryItem[] = [];
  for (const ev of events) {
    if (ev.kind !== "op") continue;
    items.push({ ...ev.tx, undone: undone.has(ev.tx.id) });
  }
  return items;
}

/** The newest reversible op that has not yet been undone. */
export function lastUndoable(path: string = defaultLedgerPath()): HistoryItem | undefined {
  const h = history(path);
  for (let i = h.length - 1; i >= 0; i--) {
    if (h[i].reversible && !h[i].undone) return h[i];
  }
  return undefined;
}

export function getById(id: string, path: string = defaultLedgerPath()): HistoryItem | undefined {
  return history(path).find((x) => x.id === id);
}

/** Record a freshly-performed operation. */
export function recordTransaction(tx: Transaction, path: string = defaultLedgerPath()): void {
  appendEvent({ kind: "op", tx }, path);
}
