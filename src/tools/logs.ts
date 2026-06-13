/**
 * `logs` tool — read recent system logs (journalctl on Linux, `log show` on
 * macOS) via the platform adapter. Read-only; the key to diagnosing failures.
 */
import { Type } from "typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { platform } from "../platform/adapter.js";

export const logsTool = defineTool({
  name: "logs",
  label: "System logs",
  description:
    "Read recent system logs (journalctl on Linux, unified log on macOS). " +
    "Pass an optional unit/process name to filter (e.g. the failing service). " +
    "Use this to find the root cause when a service or the system misbehaves.",
  promptSnippet: "Read recent system logs (optionally for one unit/process)",
  promptGuidelines: ["Use the logs tool to find root causes when a service or the system misbehaves"],
  parameters: Type.Object({
    unit: Type.Optional(Type.String({ description: "Service unit (Linux) or process name (macOS) to filter" })),
  }),
  execute: async (_id, params) => {
    const { unit } = params as { unit?: string };
    const out = await platform.logs(unit);
    return { content: [{ type: "text", text: out || "(no log output)" }], details: {} };
  },
});
