/**
 * Ollama dynamic model discovery.
 *
 * Queries the local Ollama daemon for installed models so NOAH lists exactly
 * what the user has pulled. Always degrades gracefully: if Ollama is down or the
 * payload is odd, returns [] and the caller falls back to the static defaults.
 */
import { OLLAMA_BASE_URL, ollamaModelConfig, type ModelConfig } from "./providers.js";

/** Derive Ollama's native `/api/tags` endpoint from the OpenAI-compat `/v1` base url. */
export function tagsUrl(baseUrl: string): string {
  const root = baseUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  return `${root}/api/tags`;
}

interface OllamaTag {
  name?: string;
}
interface OllamaTagsResponse {
  models?: OllamaTag[];
}

export interface DiscoverOptions {
  baseUrl?: string;
  /** Injectable fetch for testing. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export async function discoverOllamaModels(opts: DiscoverOptions = {}): Promise<ModelConfig[]> {
  const baseUrl = opts.baseUrl ?? OLLAMA_BASE_URL;
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(tagsUrl(baseUrl));
    if (!res.ok) return [];
    const body = (await res.json()) as OllamaTagsResponse;
    if (!Array.isArray(body.models)) return [];
    return body.models
      .map((t) => t.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0)
      .map((id) => ollamaModelConfig(id));
  } catch {
    return [];
  }
}
