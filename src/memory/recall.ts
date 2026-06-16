/**
 * Recall — pick the memory facts most relevant to the moment and render them
 * for the system prompt. v1 uses keyword overlap + recency (deterministic and
 * dependency-free); embeddings can slot in behind the same interface later.
 */
import type { Fact } from "./types.js";

const STOP = new Set(["the", "a", "an", "to", "of", "and", "or", "is", "how", "do", "i", "my", "in", "on", "for"]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Higher = more relevant. Each query term that appears in the fact contributes
 * its length, so specific terms ("python") outweigh generic ones ("run"), and
 * near-matches (python/python3, run/runs) still count via substring overlap.
 */
export function scoreFact(fact: Fact, query: string): number {
  const q = tokens(query);
  if (q.length === 0) return 0;
  const ft = tokens(fact.text);
  let score = 0;
  for (const qt of q) {
    const hit = ft.some((t) => t === qt || (qt.length >= 3 && (t.includes(qt) || qt.includes(t))));
    if (hit) score += qt.length;
  }
  return score;
}

export function recall(facts: Fact[], query: string, limit = 8): Fact[] {
  return [...facts]
    .map((f) => ({ f, s: scoreFact(f, query) }))
    .sort((a, b) => b.s - a.s || b.f.at - a.f.at) // score desc, then newest
    .slice(0, limit)
    .map((x) => x.f);
}

export function formatMemoryBlock(facts: Fact[]): string {
  if (facts.length === 0) return "";
  const lines = facts.map((f) => `- [${f.kind}] ${f.text}`);
  return ["What you already know about this machine and user:", ...lines].join("\n");
}
