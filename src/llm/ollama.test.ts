import { test } from "node:test";
import assert from "node:assert/strict";
import { tagsUrl, discoverOllamaModels } from "./ollama.js";

test("tagsUrl: derives the /api/tags endpoint from a v1 base url", () => {
  assert.equal(tagsUrl("http://localhost:11434/v1"), "http://localhost:11434/api/tags");
  assert.equal(tagsUrl("http://localhost:11434/v1/"), "http://localhost:11434/api/tags");
  assert.equal(tagsUrl("http://box:11434"), "http://box:11434/api/tags");
});

function mockFetch(body: unknown, ok = true): typeof fetch {
  return (async () =>
    ({
      ok,
      json: async () => body,
    }) as Response) as unknown as typeof fetch;
}

test("discoverOllamaModels: maps Ollama tag names to model configs", async () => {
  const fetchImpl = mockFetch({
    models: [{ name: "qwen2.5-coder:latest" }, { name: "llama3.1:8b" }],
  });
  const models = await discoverOllamaModels({ fetchImpl });
  assert.deepEqual(
    models.map((m) => m.id),
    ["qwen2.5-coder:latest", "llama3.1:8b"],
  );
  assert.equal(models[0].cost.input, 0);
});

test("discoverOllamaModels: returns [] when Ollama is unreachable", async () => {
  const fetchImpl = (async () => {
    throw new Error("ECONNREFUSED");
  }) as unknown as typeof fetch;
  const models = await discoverOllamaModels({ fetchImpl });
  assert.deepEqual(models, []);
});

test("discoverOllamaModels: returns [] on a non-ok response", async () => {
  const models = await discoverOllamaModels({ fetchImpl: mockFetch({}, false) });
  assert.deepEqual(models, []);
});

test("discoverOllamaModels: tolerates a malformed payload", async () => {
  const models = await discoverOllamaModels({ fetchImpl: mockFetch({ nope: true }) });
  assert.deepEqual(models, []);
});
