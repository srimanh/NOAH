/**
 * NOAH SDK — embed a NOAH-wired agent in your own app (in-process).
 *
 * @example
 *   import { createNoahSession } from "noah-agent/sdk";
 *   const { session } = await createNoahSession({ dryRun: false, autoYes: false });
 *   session.subscribe((e) => {
 *     if (e.type === "message_update" && e.assistantMessageEvent.type === "text_delta")
 *       process.stdout.write(e.assistantMessageEvent.delta);
 *   });
 *   await session.prompt("install htop and start it");
 *   session.dispose();
 */

// Core entry points + shared config
export {
  createNoahSession,
  buildNoahRuntime,
  noahSessionConfig,
  noahWiring,
  NOAH_TOOLS,
  NOAH_CUSTOM_TOOLS,
  type NoahConfigOptions,
  type NoahSessionConfig,
  type BuildOptions,
  type CreateNoahSessionResult,
} from "./runtime.js";

// OS tools
export { packageTool } from "./tools/package.js";
export { serviceTool } from "./tools/service.js";
export { networkTool } from "./tools/network.js";

// Safety
export { classify, type Verdict, type Action } from "./safety/policy.js";
export { safetyExtension } from "./safety/extension.js";
export { appendAudit, readAudit, type AuditEntry } from "./safety/audit.js";

// Providers / models
export { buildRegistry } from "./llm/registry.js";
export { resolveModel } from "./llm/resolve.js";

// Token saver / extensions
export {
  cavemanExtension,
  cavemanInstruction,
  CAVEMAN_LEVELS,
  type CavemanLevel,
} from "./agent/caveman.js";

// Platform adapter
export { platform } from "./platform/adapter.js";
export type { PlatformAdapter, PkgAction, ServiceAction } from "./platform/types.js";

// Prompt
export { NOAH_SYSTEM_PROMPT } from "./prompt/system.js";
