/**
 * `system` tool — gives the agent eyes. Read-only machine telemetry so analysis
 * ("why is it slow?", "free up space") is grounded in real data, not guesses.
 */
import { Type } from "typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { collectSnapshot } from "../sys/probe.js";
import { formatSnapshot, formatDisks, formatProcesses } from "../sys/report.js";

export const systemTool = defineTool({
  name: "system",
  label: "System telemetry",
  description:
    "Inspect the machine's live state (read-only): action 'info' = full snapshot " +
    "(OS, memory, disks, top processes, failed services); 'disk' = filesystem usage; " +
    "'processes' = top CPU consumers; 'health' = same as info. ALWAYS call this to " +
    "understand the machine before recommending or performing system changes.",
  promptSnippet: "Read live machine state (memory/disk/processes/services)",
  promptGuidelines: [
    "Before installing software or diagnosing problems, call the system tool to ground your analysis in real telemetry",
  ],
  parameters: Type.Object({
    action: Type.Union(
      [Type.Literal("info"), Type.Literal("disk"), Type.Literal("processes"), Type.Literal("health")],
      { description: "What to inspect" },
    ),
  }),
  execute: async (_id, params) => {
    const { action } = params as { action: "info" | "disk" | "processes" | "health" };
    const snap = await collectSnapshot();
    const lines =
      action === "disk"
        ? ["Disks:", ...formatDisks(snap).map((l) => `  ${l}`)]
        : action === "processes"
          ? ["Top processes (by CPU):", ...formatProcesses(snap).map((l) => `  ${l}`)]
          : formatSnapshot(snap);
    return { content: [{ type: "text", text: lines.join("\n") || "(no data)" }], details: {} };
  },
});
