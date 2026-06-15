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
import { serviceTool } from "./tools/service.js";
import { networkTool } from "./tools/network.js";
import { systemTool } from "./tools/system.js";
import { logsTool } from "./tools/logs.js";
import { NOAH_SYSTEM_PROMPT } from "./prompt/system.js";
import { buildRegistry } from "./llm/registry.js";
import { resolveModel, type RegistryLike } from "./llm/resolve.js";
import { getLastModel } from "./agent/config.js";
import * as ui from "./ui/render.js";

export interface RunOptions {
  prompt: string;
  dryRun: boolean;
  autoYes: boolean;
  /** Optional "provider/id" override (from --model). */
  model?: string;
}

const out = (s: string) => process.stdout.write(s);

/** Human-readable summary of a tool's arguments for the tool card. */
function describeArgs(toolName: string, args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const a = args as Record<string, unknown>;
  if (typeof a.command === "string") return a.command;
  if (toolName === "package") return `${a.action ?? ""} ${a.pkg ?? ""}`.trim();
  if (toolName === "service") return `${a.action ?? ""} ${a.name ?? ""}`.trim();
  if (toolName === "network") return `${a.action ?? ""} ${a.target ?? ""}`.trim();
  if (typeof a.path === "string") return String(a.path);
  return JSON.stringify(a);
}

export async function runNoah(opts: RunOptions): Promise<void> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    // Replace Pi's "expert coding assistant" base with NOAH's OS-operator prompt.
    systemPromptOverride: () => NOAH_SYSTEM_PROMPT,
    // Don't auto-append the user's APPEND_SYSTEM.md — NOAH owns its prompt.
    appendSystemPromptOverride: () => [],
    extensionFactories: [safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes })],
  });
  await resourceLoader.reload();

  // Layer 1 — provider abstraction: assemble the registry (local Ollama + cloud)
  // and resolve which model this run uses.
  const { authStorage, modelRegistry } = await buildRegistry();
  const model = resolveModel(modelRegistry as unknown as RegistryLike, {
    flagModel: opts.model,
    envModel: process.env.NOAH_MODEL,
    lastModel: getLastModel(),
  });

  const { session } = await createAgentSession({
    resourceLoader,
    // resolveModel returns a structural view; it is the registry's real Model.
    model: model as unknown as NonNullable<Parameters<typeof createAgentSession>[0]>["model"],
    authStorage,
    modelRegistry,
    tools: ["read", "bash", "edit", "write", "grep", "find", "ls", "package", "service", "network", "system", "logs"],
    customTools: [packageTool, serviceTool, networkTool, systemTool, logsTool],
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
    out(ui.note(`model: ${model.provider}/${model.id}`, "info") + "\n");
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
