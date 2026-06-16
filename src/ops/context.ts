/**
 * Turn context — a tiny module-level register of "which conversation turn are
 * we in right now". Tools and the snapshot extension record operations deep in
 * the execution stack without any handle to the session, so the session sets
 * the current turn before each user message and `recordOp` reads it.
 *
 * This is what links a chat message to the machine changes it caused — the
 * foundation of conversation rewind + filesystem time-travel.
 */
let currentTurn = 0;

export function setCurrentTurn(n: number): void {
  currentTurn = n;
}

export function getCurrentTurn(): number {
  return currentTurn;
}

export function nextTurn(): number {
  return ++currentTurn;
}
