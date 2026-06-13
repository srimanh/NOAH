import { test } from "node:test";
import assert from "node:assert/strict";
import {
  OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODELS,
  ollamaModelConfig,
  ollamaProvider,
} from "./providers.js";

test("ollamaModelConfig: sane defaults for a local model", () => {
  const m = ollamaModelConfig("qwen2.5-coder");
  assert.equal(m.id, "qwen2.5-coder");
  assert.equal(m.name, "qwen2.5-coder");
  assert.equal(m.reasoning, false);
  assert.deepEqual(m.input, ["text"]);
  // local = free
  assert.deepEqual(m.cost, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  assert.ok(m.contextWindow > 0, "has a context window");
  assert.ok(m.maxTokens > 0, "has a max tokens");
});

test("ollamaModelConfig: overrides win", () => {
  const m = ollamaModelConfig("llama3.1", { name: "Llama 3.1", contextWindow: 8192 });
  assert.equal(m.name, "Llama 3.1");
  assert.equal(m.contextWindow, 8192);
});

test("ollamaProvider: builds an openai-compatible provider config", () => {
  const p = ollamaProvider({ models: ["qwen2.5-coder"] });
  assert.equal(p.api, "openai-completions");
  assert.equal(p.baseUrl, OLLAMA_BASE_URL);
  assert.ok(p.apiKey, "has a (dummy) api key so the model counts as available");
  assert.equal(p.models?.length, 1);
  assert.equal(p.models?.[0].id, "qwen2.5-coder");
});

test("ollamaProvider: accepts a custom baseUrl and pre-built model configs", () => {
  const m = ollamaModelConfig("phi3");
  const p = ollamaProvider({ baseUrl: "http://box:11434/v1", models: [m] });
  assert.equal(p.baseUrl, "http://box:11434/v1");
  assert.equal(p.models?.[0].id, "phi3");
});

test("ollamaProvider: defaults to the built-in model list when none given", () => {
  const p = ollamaProvider();
  assert.equal(p.models?.length, DEFAULT_OLLAMA_MODELS.length);
});
