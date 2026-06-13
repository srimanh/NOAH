/**
 * Registry assembly — wires Pi's AuthStorage + ModelRegistry and registers
 * NOAH's pluggable providers (local Ollama first; cloud providers come from
 * Pi's built-ins + ~/.pi auth).
 */
import { AuthStorage, ModelRegistry } from "@earendil-works/pi-coding-agent";
import { discoverOllamaModels } from "./ollama.js";
import { ollamaProvider, OLLAMA_BASE_URL, type ModelConfig } from "./providers.js";

export interface BuildRegistryOptions {
  /** Ollama OpenAI-compat base url. Default: http://localhost:11434/v1 */
  baseUrl?: string;
  /** Injectable model discovery (for tests). Default: live Ollama probe. */
  discover?: (opts: { baseUrl?: string }) => Promise<ModelConfig[]>;
  /** Pre-built auth storage (for tests / custom locations). */
  authStorage?: AuthStorage;
  /** Pre-built model registry (for tests). */
  modelRegistry?: ModelRegistry;
}

export interface BuiltRegistry {
  authStorage: AuthStorage;
  modelRegistry: ModelRegistry;
}

export async function buildRegistry(opts: BuildRegistryOptions = {}): Promise<BuiltRegistry> {
  const baseUrl = opts.baseUrl ?? OLLAMA_BASE_URL;
  const authStorage = opts.authStorage ?? AuthStorage.create();
  const modelRegistry = opts.modelRegistry ?? ModelRegistry.create(authStorage);

  const discover = opts.discover ?? discoverOllamaModels;
  const discovered = await discover({ baseUrl });

  // Discovered models win; otherwise register the built-in defaults so the
  // provider still appears (and works once the user pulls a model).
  modelRegistry.registerProvider(
    "ollama",
    ollamaProvider({ baseUrl, models: discovered.length ? discovered : undefined }),
  );

  return { authStorage, modelRegistry };
}
