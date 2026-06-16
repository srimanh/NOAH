/** Pure inverse-action synthesis for the Reversible Operations Engine. */
import type { ToolAction } from "./types.js";

const SVC_INVERSE: Record<string, string> = {
  enable: "disable",
  disable: "enable",
  start: "stop",
  stop: "start",
};

/** The action that undoes `a`, or null when it cannot be auto-reversed. */
export function inverseOf(a: ToolAction): ToolAction | null {
  if (a.tool === "package") {
    if (a.action === "install" && a.pkg) return { tool: "package", action: "remove", pkg: a.pkg };
    if (a.action === "remove" && a.pkg) return { tool: "package", action: "install", pkg: a.pkg };
    return null; // update (and pkg-less actions) are not reversible
  }
  if (a.tool === "service") {
    const inv = SVC_INVERSE[a.action];
    return inv ? { tool: "service", action: inv, name: a.name } : null;
  }
  return null;
}

export function isReversible(a: ToolAction): boolean {
  return inverseOf(a) !== null;
}

export function describeAction(a: ToolAction): string {
  if (a.tool === "package") return `package ${a.action} ${a.pkg ?? "(all)"}`;
  return `service ${a.action} ${a.name}`;
}
