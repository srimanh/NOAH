import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRegistry } from "./registry.js";
import { DEFAULT_OLLAMA_MODELS, ollamaModelConfig } from "./providers.js";

function fakeRegistry() {
  const calls: { name: string; config: any }[] = [];
  return {
    calls,
    registerProvider: (name: string, config: any) => calls.push({ name, config }),
  };
}

test("buildRegistry: registers Ollama with discovered models", async () => {
  const reg = fakeRegistry();
  const discover = async () => [ollamaModelConfig("qwen2.5-coder:latest")];
  const { modelRegistry } = await buildRegistry({
    authStorage: {} as any,
    modelRegistry: reg as any,
    discover,
  });

  assert.equal(modelRegistry, reg);
  const ollama = reg.calls.find((c) => c.name === "ollama");
  assert.ok(ollama, "ollama provider registered");
  assert.equal(ollama!.config.api, "openai-completions");
  assert.deepEqual(
    ollama!.config.models.map((m: any) => m.id),
    ["qwen2.5-coder:latest"],
  );
});

test("buildRegistry: falls back to default models when discovery is empty", async () => {
  const reg = fakeRegistry();
  await buildRegistry({
    authStorage: {} as any,
    modelRegistry: reg as any,
    discover: async () => [],
  });
  const ollama = reg.calls.find((c) => c.name === "ollama");
  assert.equal(ollama!.config.models.length, DEFAULT_OLLAMA_MODELS.length);
});

test("buildRegistry: passes a custom baseUrl through to discovery and provider", async () => {
  const reg = fakeRegistry();
  let seenBase = "";
  await buildRegistry({
    authStorage: {} as any,
    modelRegistry: reg as any,
    baseUrl: "http://box:11434/v1",
    discover: async (o: any) => {
      seenBase = o.baseUrl;
      return [];
    },
  });
  assert.equal(seenBase, "http://box:11434/v1");
  const ollama = reg.calls.find((c) => c.name === "ollama");
  assert.equal(ollama!.config.baseUrl, "http://box:11434/v1");
});
