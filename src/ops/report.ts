/** Plain-text rendering for `noah history` and `noah undo`. */
import type { HistoryItem } from "./types.js";
import type { UndoResult } from "./engine.js";

function when(at: number): string {
  try {
    return new Date(at).toLocaleString();
  } catch {
    return String(at);
  }
}

export function formatHistory(items: HistoryItem[]): string {
  if (items.length === 0) return "No operations recorded yet.";
  const lines: string[] = ["Operation history (newest first):", ""];
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    const tag = it.undone
      ? "[undone]"
      : it.reversible
        ? "[reversible]"
        : "[not reversible]";
    lines.push(`  ${tag.padEnd(17)} ${it.desc}`);
    lines.push(`  ${" ".repeat(17)} ${when(it.at)}  ·  id ${it.id}`);
  }
  lines.push("");
  lines.push("Undo the most recent reversible op with:  noah undo");
  return lines.join("\n");
}

export function formatUndoResult(res: UndoResult): string {
  if (res.ok) {
    return `✓ Reverted: ${res.tx?.desc ?? "operation"}${res.output ? `\n${res.output.trim()}` : ""}`;
  }
  return `✗ ${res.reason ?? "Undo failed."}`;
}
