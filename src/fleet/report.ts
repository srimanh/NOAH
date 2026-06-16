/** Render fan-out results as a per-node status report. */
import type { FleetResult } from "./coordinator.js";

export function formatFleetResults(results: FleetResult[]): string {
  if (results.length === 0) return "No nodes in the fleet. Add one with:  noah fleet add <name> <host>";

  const ok = results.filter((r) => r.ok).length;
  const lines: string[] = [`Fleet results — ${ok}/${results.length} healthy:`, ""];

  for (const r of results.slice().sort((a, b) => a.node.localeCompare(b.node))) {
    lines.push(`  ${r.ok ? "✓" : "✗"} ${r.node}`);
    const body = (r.ok ? r.output : r.error || r.output).trim();
    if (body) {
      for (const l of body.split("\n").slice(0, 6)) lines.push(`      ${l}`);
    }
  }
  return lines.join("\n");
}
