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
    "Install, remove, or update OS packages via the platform-native package manager " +
    "(apt/dnf/pacman/zypper on Linux, brew on macOS) \u2014 NOAH detects the right one. " +
    "Always prefer this over running apt/brew/etc. in bash: it is cross-platform, is gated " +
    "by the safety layer, and is recorded in the audit trail. `action` is install, remove, " +
    "or update; `pkg` is the package name (omit pkg with update to upgrade everything). " +
    "Returns the package manager's combined output.",
  promptSnippet: "Install/remove/update OS packages (apt/dnf/pacman/zypper/brew)",
  promptGuidelines: [
    "Use the package tool, not apt/brew/dnf/pacman/zypper in bash, to manage software",
  ],
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
