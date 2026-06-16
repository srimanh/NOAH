/**
 * Reversible Operations Engine — recording and undo orchestration.
 *
 * `recordOp` is called by mutating tools right after they succeed. `undo`
 * replays a recorded operation's inverse through an injected runner (the CLI
 * wires this to the real platform adapter, behind the safety gate).
 */
import { appendEvent, getById, history, lastUndoable, recordTransaction, defaultLedgerPath } from "./ledger.js";
import { describeAction, inverseOf } from "./inverse.js";
import { getCurrentTurn } from "./context.js";
import type { HistoryItem, ToolAction, Transaction } from "./types.js";
import type { SnapshotRef } from "./snapshot.js";

export function makeTxId(now: number = Date.now(), rnd: () => number = Math.random): string {
  return `${now}-${Math.floor(rnd() * 1e6).toString(36)}`;
}

export interface RecordOptions {
  path?: string;
  now?: number;
  rnd?: () => number;
  /** For file ops: the snapshot that can restore the prior state. */
  snapshot?: SnapshotRef;
  /** Conversation turn that caused this op (defaults to the current turn). */
  turn?: number;
}

/** Build a Transaction for an action and append it to the ledger. */
export function recordOp(action: ToolAction, opts: RecordOptions = {}): Transaction {
  const { path = defaultLedgerPath(), now = Date.now(), rnd, snapshot } = opts;
  const inverse = inverseOf(action);
  const tx: Transaction = {
    id: makeTxId(now, rnd),
    at: now,
    turn: opts.turn ?? getCurrentTurn(),
    action,
    inverse,
    snapshot,
    reversible: inverse !== null || snapshot != null,
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
  /** Restores a file snapshot (throws on failure). Required to undo file ops. */
  restore?: (ref: SnapshotRef) => Promise<void>;
}

export interface UndoResult {
  ok: boolean;
  tx?: HistoryItem;
  output?: string;
  reason?: string;
}

export async function undo(opts: UndoOptions): Promise<UndoResult> {
  const { id, path = defaultLedgerPath(), now = Date.now(), run } = opts;

  const target = id ? getById(id, path) : lastUndoable(path);
  if (!target) {
    return { ok: false, reason: id ? `No operation found with id ${id}.` : "Nothing to undo." };
  }
  if (target.undone) {
    return { ok: false, tx: target, reason: `Already undone: ${target.desc}.` };
  }
  // File ops are reversed by restoring a snapshot rather than running a command.
  if (target.snapshot) {
    if (!opts.restore) {
      return { ok: false, tx: target, reason: `No restore handler for ${target.desc}.` };
    }
    try {
      await opts.restore(target.snapshot);
      appendEvent({ kind: "undo", id: target.id, at: now }, path);
      return { ok: true, tx: target, output: `restored ${target.snapshot.originalPath}` };
    } catch (err) {
      return { ok: false, tx: target, reason: err instanceof Error ? err.message : String(err) };
    }
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

export interface RewindResult {
  ok: boolean;
  undone: number;
  failures: Array<{ id: string; desc: string; reason: string }>;
}

/**
 * Roll the machine back to the state it was in BEFORE conversation turn
 * `targetTurn` ran: undo every reversible, not-yet-undone op whose turn >=
 * targetTurn, newest-first (so inverses apply in the correct order).
 *
 * This is the filesystem half of conversation rewind — the session truncates
 * messages, this reverts the side effects those messages produced.
 */
export async function rewindTo(
  targetTurn: number,
  opts: Omit<UndoOptions, "id">,
): Promise<RewindResult> {
  const { path = defaultLedgerPath() } = opts;
  const candidates = history(path).filter(
    (it) => (it.turn ?? 0) >= targetTurn && it.reversible && !it.undone,
  );

  let undone = 0;
  const failures: RewindResult["failures"] = [];
  // Newest-first: reverse chronological order.
  for (let i = candidates.length - 1; i >= 0; i--) {
    const it = candidates[i];
    const res = await undo({ ...opts, id: it.id });
    if (res.ok) undone++;
    else failures.push({ id: it.id, desc: it.desc, reason: res.reason ?? "undo failed" });
  }
  return { ok: failures.length === 0, undone, failures };
}
