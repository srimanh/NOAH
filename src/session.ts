/**
 * NOAH session — wires the Pi SDK with NOAH's tools, safety, and explain-mode,
 * and renders the experience through the NOAH UI panels.
 */
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { safetyExtension } from "./safety/extension.js";
import { packageTool } from "./tools/package.js";
import { NOAH_GUIDANCE } from "./prompt/system.js";
import * as ui from "./ui/render.js";

export interface RunOptions {
  prompt: string;
  dryRun: boolean;
  autoYes: boolean;
}

const out = (s: string) => process.stdout.write(s);

/** Human-readable summary of a tool's arguments for the tool card. */
function describeArgs(toolName: string, args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const a = args as Record<string, unknown>;
  if (typeof a.command === "string") return a.command;
  if (toolName === "package") return `${a.action ?? ""} ${a.pkg ?? ""}`.trim();
  if (typeof a.path === "string") return String(a.path);
  return JSON.stringify(a);
}

export async function runNoah(opts: RunOptions): Promise<void> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    agentsFilesOverride: (current) => ({
      agentsFiles: [...current.agentsFiles, { path: "/virtual/NOAH.md", content: NOAH_GUIDANCE }],
    }),
    extensionFactories: [safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes })],
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    resourceLoader,
    tools: ["read", "bash", "edit", "write", "grep", "find", "ls", "package"],
    customTools: [packageTool],
    sessionManager: SessionManager.create(process.cwd()),
  });

  // --- render state ---
  let streaming = false; // currently streaming assistant text under the bar
  const commands = new Map<string, string>(); // toolCallId -> command summary

  const endStream = () => {
    if (streaming) {
      out("\n");
      streaming = false;
    }
  };

  try {
    out(ui.brand());
    out(ui.requestPanel(opts.prompt) + "\n");
    if (opts.dryRun) out("\n" + ui.note("dry-run: NOAH will preview steps, not execute them.", "info") + "\n");

    session.subscribe((event) => {
      switch (event.type) {
        case "message_update": {
          const e = event.assistantMessageEvent;
          if (e.type === "text_delta") {
            if (!streaming) {
              out(ui.responseHeader() + "\n" + ui.barPrefix());
              streaming = true;
            }
            out(e.delta.replace(/\n/g, "\n" + ui.barPrefix()));
          }
          break;
        }
        case "tool_execution_start": {
          endStream();
          const cmd = describeArgs(event.toolName, event.args);
          commands.set(event.toolCallId, cmd);
          out(ui.toolCard(event.toolName, cmd, "running") + "\n");
          break;
        }
        case "tool_execution_end": {
          const cmd = commands.get(event.toolCallId) ?? "";
          out(ui.auditLine(event.toolName, cmd, !event.isError) + "\n");
          break;
        }
      }
    });

    await session.prompt(opts.prompt);
    endStream();
    out(ui.divider() + "\n");
  } finally {
    session.dispose();
  }
}
