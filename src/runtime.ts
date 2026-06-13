/**
 * NOAH runtime — the single source of truth for how a NOAH agent is wired:
 * OS tools + safety gate + caveman + system prompt + provider registry.
 *
 * Shared by every front-end (interactive TUI, print, RPC, SDK) so they all get
 * identical behaviour. `noahSessionConfig` is pure (for tests); `buildNoahRuntime`
 * and `createNoahSession` assemble live sessions from it.
 */
import {
  createAgentSession,
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
  type AgentSessionRuntime,
  type AgentSession,
  type ExtensionFactory,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { buildRegistry } from "./llm/registry.js";
import { resolveModel, type RegistryLike } from "./llm/resolve.js";
import { safetyExtension } from "./safety/extension.js";
import { packageTool } from "./tools/package.js";
import { serviceTool } from "./tools/service.js";
import { networkTool } from "./tools/network.js";
import { systemTool } from "./tools/system.js";
import { logsTool } from "./tools/logs.js";
import { NOAH_SYSTEM_PROMPT } from "./prompt/system.js";
import { cavemanExtension, type CavemanLevel } from "./agent/caveman.js";
import { loadExtensions, activeFactories } from "./ext/loader.js";

/** Built-in pi tools + NOAH abstract OS tools. */
export const NOAH_TOOLS = [
  "read",
  "bash",
  "edit",
  "write",
  "grep",
  "find",
  "ls",
  "package",
  "service",
  "network",
  "system",
  "logs",
];

export const NOAH_CUSTOM_TOOLS: ToolDefinition[] = [packageTool, serviceTool, networkTool, systemTool, logsTool];

export interface NoahConfigOptions {
  dryRun: boolean;
  autoYes: boolean;
  /** Static caveman level (used when no live getter is given). */
  caveman?: CavemanLevel;
  /** Live caveman level getter (TUI toggles it). */
  getCavemanLevel?: () => CavemanLevel;
  /** Host-supplied confirmation (TUI). Falls back to ctx.ui / readline. */
  confirm?: (req: { toolName: string; command: string; reason: string }) => Promise<boolean>;
  /** Extra extension factories (built-in shims + discovered user/project extensions). */
  extraExtensions?: ExtensionFactory[];
}

export interface NoahSessionConfig {
  tools: string[];
  customTools: ToolDefinition[];
  systemPromptOverride: () => string;
  appendSystemPromptOverride: () => string[];
  extensionFactories: ExtensionFactory[];
}

/** Pure assembly of NOAH's session configuration. */
export function noahSessionConfig(opts: NoahConfigOptions): NoahSessionConfig {
  const getCaveman = opts.getCavemanLevel ?? (() => opts.caveman ?? "off");
  return {
    tools: NOAH_TOOLS,
    customTools: NOAH_CUSTOM_TOOLS,
    systemPromptOverride: () => NOAH_SYSTEM_PROMPT,
    appendSystemPromptOverride: () => [],
    extensionFactories: [
      safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes, confirm: opts.confirm }),
      cavemanExtension(getCaveman),
      ...(opts.extraExtensions ?? []),
    ],
  };
}

export interface NoahWiring {
  authStorage: import("@earendil-works/pi-coding-agent").AuthStorage;
  modelRegistry: import("@earendil-works/pi-coding-agent").ModelRegistry;
  model: ReturnType<typeof resolveModel>;
}

/** Build the provider registry and resolve the active model. */
export async function noahWiring(opts: { model?: string }): Promise<NoahWiring> {
  const { authStorage, modelRegistry } = await buildRegistry();
  const model = resolveModel(modelRegistry as unknown as RegistryLike, {
    flagModel: opts.model,
    envModel: process.env.NOAH_MODEL,
  });
  return { authStorage, modelRegistry, model };
}

export interface BuildOptions extends NoahConfigOptions {
  model?: string;
}

/**
 * Build a full AgentSessionRuntime (for RPC / session replacement). Reuses the
 * same NOAH config so RPC behaves exactly like the interactive front-ends.
 */
export async function buildNoahRuntime(opts: BuildOptions): Promise<AgentSessionRuntime> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";
  const { authStorage, modelRegistry, model } = await noahWiring(opts);
  const cfg = noahSessionConfig({ ...opts, extraExtensions: activeFactories(await loadExtensions()) });
  const scopedModels = modelRegistry.getAvailable().map((m) => ({ model: m }));

  return createAgentSessionRuntime(
    async ({ cwd, sessionManager, sessionStartEvent }) => {
      const services = await createAgentSessionServices({
        cwd,
        authStorage,
        modelRegistry,
        resourceLoaderOptions: {
          systemPromptOverride: cfg.systemPromptOverride,
          appendSystemPromptOverride: cfg.appendSystemPromptOverride,
          extensionFactories: cfg.extensionFactories,
        },
      });
      const created = await createAgentSessionFromServices({
        services,
        sessionManager,
        sessionStartEvent,
        model: model as unknown as Parameters<typeof createAgentSessionFromServices>[0]["model"],
        scopedModels,
        tools: cfg.tools,
        customTools: cfg.customTools,
      });
      return { ...created, services, diagnostics: services.diagnostics };
    },
    { cwd: process.cwd(), agentDir: getAgentDir(), sessionManager: SessionManager.create(process.cwd()) },
  );
}

export interface CreateNoahSessionResult {
  session: AgentSession;
  model: NoahWiring["model"];
  authStorage: NoahWiring["authStorage"];
  modelRegistry: NoahWiring["modelRegistry"];
}

/**
 * SDK entry — create a NOAH-wired AgentSession to embed in your own app.
 *
 * @example
 *   import { createNoahSession } from "noah-agent/sdk";
 *   const { session } = await createNoahSession({ dryRun: false, autoYes: false });
 *   await session.prompt("install htop and start it");
 */
export async function createNoahSession(
  opts: BuildOptions & { sessionManager?: SessionManager },
): Promise<CreateNoahSessionResult> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";
  const { authStorage, modelRegistry, model } = await noahWiring(opts);
  const cfg = noahSessionConfig({ ...opts, extraExtensions: activeFactories(await loadExtensions()) });

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    systemPromptOverride: cfg.systemPromptOverride,
    appendSystemPromptOverride: cfg.appendSystemPromptOverride,
    extensionFactories: cfg.extensionFactories,
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    resourceLoader,
    model: model as unknown as NonNullable<Parameters<typeof createAgentSession>[0]>["model"],
    authStorage,
    modelRegistry,
    scopedModels: modelRegistry.getAvailable().map((m) => ({ model: m })),
    tools: cfg.tools,
    customTools: cfg.customTools,
    sessionManager: opts.sessionManager ?? SessionManager.create(process.cwd()),
  });

  return { session, model, authStorage, modelRegistry };
}
