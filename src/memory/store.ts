/**
 * Local memory store (~/.noah/memory.jsonl).
 *
 * One JSON fact per line. Unlike the ops ledger (an immutable audit trail), the
 * memory store is user-owned: facts can be added, listed, and deleted, because
 * privacy means you can always inspect and wipe what NOAH remembers.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Fact, FactInput } from "./types.js";

export function defaultMemoryPath(): string {
  return process.env.NOAH_MEMORY || join(homedir(), ".noah", "memory.jsonl");
}

function makeId(now: number, rnd: () => number): string {
  return `${now}-${Math.floor(rnd() * 1e6).toString(36)}`;
}

export function all(path: string = defaultMemoryPath()): Fact[] {
  if (!existsSync(path)) return [];
  const out: Fact[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const f = JSON.parse(t) as Fact;
      if (f && f.id && typeof f.text === "string") out.push(f);
    } catch {
      /* skip corrupt line */
    }
  }
  return out;
}

function writeAll(facts: Fact[], path: string): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, facts.map((f) => JSON.stringify(f)).join("\n") + (facts.length ? "\n" : ""));
  } catch {
    /* best-effort */
  }
}

export function remember(
  input: FactInput,
  path: string = defaultMemoryPath(),
  now: number = Date.now(),
  rnd: () => number = Math.random,
): Fact {
  const fact: Fact = { id: makeId(now, rnd), at: now, ...input };
  const facts = all(path);
  facts.push(fact);
  writeAll(facts, path);
  return fact;
}

/** Add a fact only if no existing fact has the same kind + text. */
export function rememberUnique(
  input: FactInput,
  path: string = defaultMemoryPath(),
  now: number = Date.now(),
  rnd: () => number = Math.random,
): Fact {
  const existing = all(path).find((f) => f.kind === input.kind && f.text === input.text);
  if (existing) return existing;
  return remember(input, path, now, rnd);
}

export function forget(id: string, path: string = defaultMemoryPath()): boolean {
  const facts = all(path);
  const next = facts.filter((f) => f.id !== id);
  if (next.length === facts.length) return false;
  writeAll(next, path);
  return true;
}

export function forgetAll(path: string = defaultMemoryPath()): void {
  writeAll([], path);
}
