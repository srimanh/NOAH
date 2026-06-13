/**
 * Abstract `network` tool — dispatches through the platform adapter.
 *
 * Read-only diagnostics (info/ports/connections/ping) plus a gated `fetch`
 * (HTTP GET). `fetch` is the only mutating-risk action: the safety policy
 * requires confirmation for it (data-exfiltration guard), and it is audited.
 */
import { Type } from "typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { platform } from "../platform/adapter.js";
import type { NetAction } from "../platform/types.js";

/** Actions that need a target (host or URL). */
const NEEDS_TARGET: ReadonlySet<NetAction> = new Set(["ping", "fetch"]);

export const networkTool = defineTool({
  name: "network",
  label: "Network",
  description:
    "Inspect networking and make simple requests, cross-platform. Actions: " +
    "info (interfaces/IPs), ports (listening sockets), connections (active TCP), " +
    "ping <host> (connectivity), fetch <url> (HTTP GET). Prefer this over raw " +
    "ifconfig/ip/ss/lsof/curl in bash: it is platform-native, safety-gated, and audited. " +
    "fetch downloads from the network and always requires user confirmation.",
  promptSnippet: "Inspect network (info/ports/connections/ping) and fetch URLs",
  promptGuidelines: [
    "Use the network tool, not raw ip/ifconfig/ss/lsof/curl in bash, for network tasks",
  ],
  parameters: Type.Object({
    action: Type.Union(
      [
        Type.Literal("info"),
        Type.Literal("ports"),
        Type.Literal("connections"),
        Type.Literal("ping"),
        Type.Literal("fetch"),
      ],
      { description: "What to do" },
    ),
    target: Type.Optional(
      Type.String({ description: "Host (for ping) or URL (for fetch); unused otherwise" }),
    ),
  }),
  execute: async (_id, params) => {
    const { action, target } = params as { action: NetAction; target?: string };

    if (NEEDS_TARGET.has(action) && !target) {
      const kind = action === "fetch" ? "url" : "host";
      return {
        content: [{ type: "text", text: `network ${action} needs a target ${kind}.` }],
        details: {},
      };
    }

    const out = await platform.net(action, target);
    return { content: [{ type: "text", text: out || `${action} done` }], details: {} };
  },
});
