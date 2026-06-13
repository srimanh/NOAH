/**
 * Abstract `package` tool — dispatches through the platform adapter.
 * Same tool on macOS (brew) and Linux (apt/...). Cross-platform by design.
 */
import { Type } from "typebox";
import { defineTool } from "@earendil-works/pi-coding-agent";
import { platform } from "../platform/adapter.js";

export const packageTool = defineTool({
  name: "package",
  label: "Package manager",
  description:
    "Install, remove, or update OS packages via the native package manager " +
    "(brew on macOS, apt on Linux). Use this instead of raw shell for software management.",
  parameters: Type.Object({
    action: Type.Union([Type.Literal("install"), Type.Literal("remove"), Type.Literal("update")], {
      description: "What to do",
    }),
    pkg: Type.Optional(Type.String({ description: "Package name (optional for update-all)" })),
  }),
  execute: async (_id, params) => {
    const { action, pkg } = params as { action: "install" | "remove" | "update"; pkg?: string };

    if (process.env.NOAH_DRY_RUN === "1") {
      return {
        content: [
          { type: "text", text: `[DRY-RUN] would ${action} package "${pkg ?? "(all)"}" via ${platform.os}` },
        ],
        details: {},
      };
    }

    const out = await platform.pkg(action, pkg);
    return { content: [{ type: "text", text: out || `${action} ${pkg ?? ""} done` }], details: {} };
  },
});
