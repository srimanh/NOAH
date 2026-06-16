/**
 * In-session checkpoint log. Each user message starts a "turn"; we remember the
 * turn number, the message text (so it can be restored for editing on rewind),
 * and where it sits in the transcript (so the display can be trimmed).
 *
 * Pairs with the ops ledger: `turn` here matches `Transaction.turn` there, so a
 * rewind can roll back both the conversation view and the machine state.
 */
export interface Checkpoint {
  turn: number;
  text: string;
  entryIndex: number; // index in the transcript where this turn's user block sits
  at: number;
}

export class CheckpointLog {
  private items: Checkpoint[] = [];

  add(turn: number, text: string, entryIndex: number, at: number = Date.now()): Checkpoint {
    const cp: Checkpoint = { turn, text, entryIndex, at };
    this.items.push(cp);
    return cp;
  }

  list(): readonly Checkpoint[] {
    return this.items;
  }

  get(turn: number): Checkpoint | undefined {
    return this.items.find((c) => c.turn === turn);
  }

  latest(): Checkpoint | undefined {
    return this.items[this.items.length - 1];
  }

  /** Drop the given turn and every later one. Returns how many were removed. */
  truncateFrom(turn: number): number {
    const before = this.items.length;
    this.items = this.items.filter((c) => c.turn < turn);
    return before - this.items.length;
  }

  get size(): number {
    return this.items.length;
  }
}
