/**
 * Telemetry formatting — pure, plain-text renderers used by the `system` tool
 * (LLM-facing) and the startup dashboard. No colors here; presentation layers
 * add their own.
 */
import { humanBytes, type SystemSnapshot } from "./probe.js";
import type { HealthReport } from "./health.js";

/** Clean a process command path into a readable name. */
export function procLabel(command: string): string {
  const base = command.trim().split("/").pop() ?? command;
  return base.trim() || command;
}

/** Real (non-virtual) mounts worth reporting. */
export function realDisks(snap: SystemSnapshot) {
  return snap.disks.filter((d) => d.mount === "/" || d.mount.startsWith("/Volumes") || d.mount.startsWith("/mnt") || d.mount.startsWith("/home"));
}

export function formatDisks(snap: SystemSnapshot): string[] {
  const disks = realDisks(snap);
  const list = disks.length ? disks : snap.disks;
  return list.map((d) => `${d.mount}  ${d.usedPct}% used  (${humanBytes(d.used)} / ${humanBytes(d.total)}, ${humanBytes(d.available)} free)`);
}

export function formatProcesses(snap: SystemSnapshot): string[] {
  return snap.topProcesses.map((p) => `${procLabel(p.command)}  cpu ${p.cpu}%  mem ${p.mem}%  (pid ${p.pid})`);
}

/** Full deterministic health report (no LLM) for `/doctor` and `noah doctor`. */
export function formatDoctor(snap: SystemSnapshot, health: HealthReport): string[] {
  const out: string[] = [`SYSTEM HEALTH — ${health.status.toUpperCase()}`, ""];
  for (const l of formatSnapshot(snap)) out.push(l);
  out.push("");
  if (health.items.length) {
    out.push("Recommendations (by priority):");
    for (const it of health.items) out.push(`  [${it.severity}] ${it.title} — ${it.detail}`);
  } else {
    out.push("All clear — nothing needs attention.");
  }
  return out;
}

export function formatSnapshot(snap: SystemSnapshot): string[] {
  const out: string[] = [`OS: ${snap.os}`];
  if (snap.memory) out.push(`Memory: ${snap.memory.usedPct}% used (${humanBytes(snap.memory.used)} / ${humanBytes(snap.memory.total)})`);
  out.push("Disks:");
  for (const l of formatDisks(snap)) out.push(`  ${l}`);
  out.push("Top processes (by CPU):");
  for (const l of formatProcesses(snap)) out.push(`  ${l}`);
  if (snap.failedServices.length) out.push(`Failed services: ${snap.failedServices.join(", ")}`);
  if (typeof snap.updates === "number") out.push(`Available updates: ${snap.updates}`);
  return out;
}
