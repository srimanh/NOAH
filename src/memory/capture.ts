/** Derive durable machine facts from telemetry, for auto-capture into memory. */
import type { FactInput } from "./types.js";

export interface MachineInfo {
  os: string;
  packageManager?: string;
}

export function deriveMachineFacts(info: MachineInfo): FactInput[] {
  const facts: FactInput[] = [];
  if (info.os?.trim()) facts.push({ kind: "machine", text: `Operating system: ${info.os}`, source: "telemetry" });
  if (info.packageManager?.trim()) {
    facts.push({ kind: "machine", text: `Package manager: ${info.packageManager}`, source: "telemetry" });
  }
  return facts;
}
