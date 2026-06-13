/**
 * Health assessment — deterministic severity rules over a telemetry snapshot.
 * No LLM: fast, predictable, runs on launch for the dashboard and `/doctor`.
 */
import { humanBytes, type SystemSnapshot } from "./probe.js";
import { realDisks, procLabel } from "./report.js";

export type Severity = "high" | "medium" | "low";
export type HealthStatus = "ok" | "warn" | "critical";

export interface HealthItem {
  severity: Severity;
  title: string;
  detail: string;
}

export interface HealthReport {
  status: HealthStatus;
  items: HealthItem[];
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export function assessHealth(snap: SystemSnapshot): HealthReport {
  const items: HealthItem[] = [];

  // Disk — worst real mount
  const disks = realDisks(snap).length ? realDisks(snap) : snap.disks;
  const worst = disks.slice().sort((a, b) => b.usedPct - a.usedPct)[0];
  if (worst) {
    if (worst.usedPct >= 90)
      items.push({ severity: "high", title: "Disk nearly full", detail: `${worst.mount} at ${worst.usedPct}% (${humanBytes(worst.available)} free)` });
    else if (worst.usedPct >= 80)
      items.push({ severity: "medium", title: "Disk filling up", detail: `${worst.mount} at ${worst.usedPct}% (${humanBytes(worst.available)} free)` });
  }

  // Memory
  if (snap.memory) {
    const p = snap.memory.usedPct;
    if (p >= 90) items.push({ severity: "high", title: "Memory pressure", detail: `${p}% used` });
    else if (p >= 80) items.push({ severity: "medium", title: "Memory high", detail: `${p}% used` });
  }

  // Failed services
  if (snap.failedServices.length) {
    items.push({
      severity: "high",
      title: `${snap.failedServices.length} failed service${snap.failedServices.length > 1 ? "s" : ""}`,
      detail: snap.failedServices.join(", "),
    });
  }

  // Runaway CPU
  const top = snap.topProcesses[0];
  if (top && top.cpu >= 85) {
    items.push({ severity: "low", title: "High CPU usage", detail: `${procLabel(top.command)} at ${top.cpu}%` });
  }

  // Updates
  if (typeof snap.updates === "number" && snap.updates > 0) {
    items.push({ severity: "low", title: `${snap.updates} update${snap.updates > 1 ? "s" : ""} available`, detail: "Run a system update to stay current" });
  }

  items.sort((a, b) => RANK[a.severity] - RANK[b.severity]);

  const status: HealthStatus = items.some((i) => i.severity === "high")
    ? "critical"
    : items.some((i) => i.severity === "medium")
      ? "warn"
      : "ok";

  return { status, items };
}
