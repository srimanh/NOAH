/**
 * NOAH session — wires the Pi SDK with NOAH's tools, safety, and explain-mode.
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

export interface RunOptions {
  prompt: string;
  dryRun: boolean;
  autoYes: boolean;
}

export async function runNoah(opts: RunOptions): Promise<void> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    // Add NOAH guidance without replacing Pi's system prompt.
    agentsFilesOverride: (current) => ({
      agentsFiles: [
        ...current.agentsFiles,
        { path: "/virtual/NOAH.md", content: NOAH_GUIDANCE },
      ],
    }),
    // Wire the safety gate + audit log.
    extensionFactories: [safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes })],
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    resourceLoader,
    // Built-in OS tools + our abstract package tool.
    tools: ["read", "bash", "edit", "write", "grep", "find", "ls", "package"],
    customTools: [packageTool],
    sessionManager: SessionManager.create(process.cwd()),
  });

  try {
    session.subscribe((event) => {
      if (event.type === "message_update") {
        const e = event.assistantMessageEvent;
        if (e.type === "text_delta") process.stdout.write(e.delta);
      }
      if (event.type === "tool_execution_start") {
        process.stdout.write(`\n\x1b[36m▸ ${event.toolName}\x1b[0m\n`);
      }
    });

    if (opts.dryRun) {
      process.stdout.write("\x1b[2m🧪 dry-run: NOAH will preview steps, not execute them.\x1b[0m\n");
    }

    await session.prompt(opts.prompt);
    process.stdout.write("\n");
  } finally {
    session.dispose();
  }
}
