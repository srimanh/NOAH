/**
 * Reversible Operations Engine — recording and undo orchestration.
 *
 * `recordOp` is called by mutating tools right after they succeed. `undo`
 * replays a recorded operation's inverse through an injected runner (the CLI
 * wires this to the real platform adapter, behind the safety gate).
 */
import { appendEvent, getById, lastUndoable, recordTransaction, LEDGER_PATH } from "./ledger.js";
import { describeAction, inverseOf } from "./inverse.js";
import type { HistoryItem, ToolAction, Transaction } from "./types.js";

export function makeTxId(now: number = Date.now(), rnd: () => number = Math.random): string {
  return `${now}-${Math.floor(rnd() * 1e6).toString(36)}`;
}

export interface RecordOptions {
  path?: string;
  now?: number;
  rnd?: () => number;
}

/** Build a Transaction for an action and append it to the ledger. */
export function recordOp(action: ToolAction, opts: RecordOptions = {}): Transaction {
  const { path = LEDGER_PATH, now = Date.now(), rnd } = opts;
  const inverse = inverseOf(action);
  const tx: Transaction = {
    id: makeTxId(now, rnd),
    at: now,
    action,
    inverse,
    reversible: inverse !== null,
    desc: describeAction(action),
  };
  recordTransaction(tx, path);
  return tx;
}

export interface UndoOptions {
  /** Undo a specific op; omit to undo the most recent reversible one. */
  id?: string;
  path?: string;
  now?: number;
  /** Executes an inverse action and returns its output (throws on failure). */
  run: (action: ToolAction) => Promise<string>;
}

export interface UndoResult {
  ok: boolean;
  tx?: HistoryItem;
  output?: string;
  reason?: string;
}

export async function undo(opts: UndoOptions): Promise<UndoResult> {
  const { id, path = LEDGER_PATH, now = Date.now(), run } = opts;

  const target = id ? getById(id, path) : lastUndoable(path);
  if (!target) {
    return { ok: false, reason: id ? `No operation found with id ${id}.` : "Nothing to undo." };
  }
  if (target.undone) {
    return { ok: false, tx: target, reason: `Already undone: ${target.desc}.` };
  }
  if (!target.reversible || !target.inverse) {
    return { ok: false, tx: target, reason: `Not reversible: ${target.desc}.` };
  }

  try {
    const output = await run(target.inverse);
    appendEvent({ kind: "undo", id: target.id, at: now }, path);
    return { ok: true, tx: target, output };
  } catch (err) {
    // Leave the op reversible so the user can retry once the cause is fixed.
    return { ok: false, tx: target, reason: err instanceof Error ? err.message : String(err) };
  }
}
