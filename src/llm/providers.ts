/**
 * LLM provider catalog — Layer 1 (transport) for NOAH.
 *
 * Pi's real provider abstraction is `ModelRegistry.registerProvider(name, config)`.
 * We don't hand-roll a Transport: we describe providers as ProviderConfig and let
 * Pi's normalized streaming (text_delta / thinking_delta / toolcall_*) do the work.
 *
 * Ollama exposes an OpenAI-compatible endpoint, so `api: "openai-completions"`
 * is all we need — no custom streamSimple.
 */
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

/** The shape `ModelRegistry.registerProvider` accepts (ProviderConfigInput). */
export type ProviderConfig = Parameters<ModelRegistry["registerProvider"]>[1];
export type ModelConfig = NonNullable<ProviderConfig["models"]>[number];

/** Default local Ollama OpenAI-compatible endpoint. */
export const OLLAMA_BASE_URL = "http://localhost:11434/v1";

/** Sensible local defaults (good tool-calling models). */
export const DEFAULT_OLLAMA_MODELS = ["qwen2.5-coder", "llama3.1"] as const;

/**
 * Build a model config for a local Ollama model.
 * Local inference is free, text-only, no extended thinking by default.
 */
export function ollamaModelConfig(id: string, overrides: Partial<ModelConfig> = {}): ModelConfig {
  return {
    id,
    name: id,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 32_768,
    maxTokens: 4096,
    ...overrides,
  };
}

export interface OllamaProviderOptions {
  baseUrl?: string;
  /** Model ids (strings) or pre-built model configs. */
  models?: (string | ModelConfig)[];
}

/**
 * Build a ProviderConfig for local Ollama.
 *
 * A dummy apiKey is set so Pi treats these models as "available" (auth configured);
 * Ollama ignores the bearer token for local use.
 */
export function ollamaProvider(opts: OllamaProviderOptions = {}): ProviderConfig {
  const ids = opts.models ?? [...DEFAULT_OLLAMA_MODELS];
  const models = ids.map((m) => (typeof m === "string" ? ollamaModelConfig(m) : m));
  return {
    name: "Ollama (local)",
    baseUrl: opts.baseUrl ?? OLLAMA_BASE_URL,
    apiKey: "ollama",
    authHeader: true,
    api: "openai-completions",
    models,
  };
}
