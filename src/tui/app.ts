/**
 * NOAH classic TUI — reuses the upstream InteractiveMode for a plain terminal UX
 * (streaming, tool cards, model cycling with Ctrl+P, footer, slash commands),
 * wired to NOAH's provider registry, OS tools, system prompt, and safety gate.
 *
 * We build an AgentSessionRuntime via the services factory so /new, /resume,
 * /fork all keep NOAH's customizations.
 */
import { fileURLToPath } from "node:url";
import {
  createAgentSessionFromServices,
  createAgentSessionRuntime,
  createAgentSessionServices,
  getAgentDir,
  InteractiveMode,
  SessionManager,
  SettingsManager,
  type CreateAgentSessionRuntimeFactory,
} from "@earendil-works/pi-coding-agent";
import { buildRegistry } from "../llm/registry.js";
import { resolveModel, dedupeModels, type RegistryLike } from "../llm/resolve.js";
import { getLastModel, setLastModel } from "../agent/config.js";
import { safetyExtension } from "../safety/extension.js";
import { snapshotExtension } from "../ops/snapshot-ext.js";
import { packageTool } from "../tools/package.js";
import { serviceTool } from "../tools/service.js";
import { networkTool } from "../tools/network.js";
import { systemTool } from "../tools/system.js";
import { logsTool } from "../tools/logs.js";
import { NOAH_SYSTEM_PROMPT } from "../prompt/system.js";
import { noahBranding } from "./branding.js";

export interface TuiOptions {
  /** Optional first message to send on startup. */
  initialMessage?: string;
  dryRun: boolean;
  autoYes: boolean;
  /** "provider/id" model override. */
  model?: string;
}

/** The OS tool set NOAH exposes (Pi built-ins + NOAH abstract tools). */
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

const CUSTOM_TOOLS = [packageTool, serviceTool, networkTool, systemTool, logsTool];

/** Shipped NOAH dark-blue theme (package-root /themes, resolves for src + dist). */
const NOAH_THEME_PATH = fileURLToPath(new URL("../../themes/noah-dark-blue.json", import.meta.url));
const NOAH_THEME_NAME = "noah-dark-blue";

export async function runNoahInteractive(opts: TuiOptions): Promise<void> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";

  // Suppress Pi's startup network checks ("New version 0.79.x / Run pi update"
  // banner and changelog box) — those are Pi's, not NOAH's. Only disables startup
  // niceties; LLM provider requests are unaffected.
  if (!process.env.PI_OFFLINE) process.env.PI_OFFLINE = "1";
  if (!process.env.PI_SKIP_VERSION_CHECK) process.env.PI_SKIP_VERSION_CHECK = "1";

  // Build the provider registry ONCE (local Ollama + cloud) and reuse it across
  // session switches so we don't re-probe Ollama on every /new.
  const { authStorage, modelRegistry } = await buildRegistry();
  const model = resolveModel(modelRegistry as unknown as RegistryLike, {
    flagModel: opts.model,
    envModel: process.env.NOAH_MODEL,
    lastModel: getLastModel(),
  });
  setLastModel(`${model.provider}/${model.id}`);
  // All ready models are cycleable with Ctrl+P.
  const scopedModels = dedupeModels(modelRegistry.getAvailable()).map((m) => ({ model: m }));

  const createRuntime: CreateAgentSessionRuntimeFactory = async ({
    cwd,
    sessionManager,
    sessionStartEvent,
  }) => {
    // Activate the NOAH theme in-memory (does not touch the user's settings.json).
    const settingsManager = SettingsManager.create(cwd, getAgentDir());
    await settingsManager.reload();
    settingsManager.applyOverrides({ theme: NOAH_THEME_NAME });

    const services = await createAgentSessionServices({
      cwd,
      authStorage,
      modelRegistry,
      settingsManager,
      resourceLoaderOptions: {
        additionalThemePaths: [NOAH_THEME_PATH],
        // NOAH owns its prompt; replace Pi's coding-assistant base.
        systemPromptOverride: () => NOAH_SYSTEM_PROMPT,
        appendSystemPromptOverride: () => [],
        // Safety gate + audit (unbypassable) and NOAH header/footer branding.
        extensionFactories: [
          safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes }),
          snapshotExtension(),
          noahBranding({ dryRun: opts.dryRun }),
        ],
      },
    });

    const created = await createAgentSessionFromServices({
      services,
      sessionManager,
      sessionStartEvent,
      // resolveModel returns a structural view; it is the registry's real Model.
      model: model as unknown as (typeof scopedModels)[number]["model"],
      scopedModels,
      tools: NOAH_TOOLS,
      customTools: CUSTOM_TOOLS,
    });

    return { ...created, services, diagnostics: services.diagnostics };
  };

  const runtime = await createAgentSessionRuntime(createRuntime, {
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    sessionManager: SessionManager.create(process.cwd()),
  });

  const mode = new InteractiveMode(runtime, {
    initialMessage: opts.initialMessage,
    modelFallbackMessage: runtime.modelFallbackMessage,
  });

  await mode.init();
  await mode.run();
}
