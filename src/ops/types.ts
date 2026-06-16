/**
 * Reversible Operations Engine — shared types.
 *
 * Every mutating tool action NOAH performs is captured as a Transaction with a
 * synthesized inverse, written to an append-only ledger. `noah undo` replays the
 * inverse through the safety gate. This is what lets people trust NOAH on real
 * machines: anything it changes, it can take back.
 */

/** A package-manager action (install/remove/update). */
export interface PkgAction {
  tool: "package";
  action: "install" | "remove" | "update";
  pkg?: string;
}

/** A service action (enable/disable/start/stop/restart/reload/status). */
export interface SvcAction {
  tool: "service";
  action: string;
  name: string;
}

/** A file mutation (write/edit/delete) — reversed via a snapshot, not a command. */
export interface FileAction {
  tool: "file";
  action: "write" | "edit" | "delete";
  path: string;
}

export type ToolAction = PkgAction | SvcAction | FileAction;

/** A recorded, potentially-reversible operation. */
export interface Transaction {
  id: string;
  at: number; // epoch ms
  /** The conversation turn (user message #) that caused this op. 0 = unknown. */
  turn?: number;
  action: ToolAction;
  inverse: ToolAction | null; // null ⇒ reversed by snapshot (or not reversible)
  /** For file ops: how to restore the prior state. */
  snapshot?: import("./snapshot.js").SnapshotRef;
  reversible: boolean;
  desc: string;
}

/** Append-only ledger events: an operation, or an undo of one. */
export type LedgerEvent =
  | { kind: "op"; tx: Transaction }
  | { kind: "undo"; id: string; at: number };

/** A transaction folded with its current state. */
export interface HistoryItem extends Transaction {
  undone: boolean;
}
