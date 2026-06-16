/**
 * Abstract `service` tool — dispatches through the platform adapter.
 * systemd (systemctl) on Linux, launchd (launchctl) on macOS.
 */
import { Type } from "typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { platform } from "../platform/adapter.js";
import type { ServiceAction } from "../platform/types.js";
import { recordOp } from "../ops/engine.js";

export const serviceTool = defineTool({
  name: "service",
  label: "Service manager",
  description:
    "Manage a system service via the platform-native init system (systemd `systemctl` on " +
    "Linux, launchd `launchctl` on macOS) \u2014 NOAH picks the right backend. Prefer this over " +
    "raw shell: it is cross-platform, safety-gated, and audited. `action` is start, stop, " +
    "restart, status, enable, or disable; `name` is the systemd unit (Linux) or launchd label " +
    "(macOS). Note: enable/disable are not supported on macOS launchd. Use status (read-only) " +
    "to inspect a service before changing it.",
  promptSnippet: "Start/stop/restart/enable/disable/status a service (systemd/launchd)",
  promptGuidelines: [
    "Use the service tool, not systemctl/launchctl in bash, to manage services",
  ],
  parameters: Type.Object({
    action: Type.Union(
      [
        Type.Literal("start"),
        Type.Literal("stop"),
        Type.Literal("restart"),
        Type.Literal("status"),
        Type.Literal("enable"),
        Type.Literal("disable"),
      ],
      { description: "What to do with the service" },
    ),
    name: Type.String({ description: "Service/unit name (Linux) or launchd label (macOS)" }),
  }),
  execute: async (_id, params) => {
    const { action, name } = params as { action: ServiceAction; name: string };

    if (process.env.NOAH_DRY_RUN === "1") {
      return {
        content: [
          { type: "text", text: `[DRY-RUN] would ${action} service "${name}" via ${platform.os}` },
        ],
        details: {},
      };
    }

    const out = await platform.service(name, action);
    // Record for `noah undo` (enable⇄disable, start⇄stop are reversible).
    recordOp({ tool: "service", action, name });
    return { content: [{ type: "text", text: out || `${action} ${name} done` }], details: {} };
  },
});
