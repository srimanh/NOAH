import { test } from "node:test";
import assert from "node:assert/strict";
import { parseModelRef, resolveModel, formatModelList, type RegistryLike } from "./resolve.js";

const M = (provider: string, id: string) => ({ provider, id }) as any;

function fakeRegistry(opts: {
  all?: any[];
  available?: any[];
}): RegistryLike {
  const all = opts.all ?? [];
  const available = opts.available ?? [];
  return {
    find: (provider, id) => all.find((m) => m.provider === provider && m.id === id),
    getAvailable: () => available,
    getAll: () => all,
  };
}

test("parseModelRef: splits provider/id on the first slash", () => {
  assert.deepEqual(parseModelRef("ollama/qwen2.5-coder"), { provider: "ollama", id: "qwen2.5-coder" });
  assert.deepEqual(parseModelRef("anthropic/claude-opus-4-5"), {
    provider: "anthropic",
    id: "claude-opus-4-5",
  });
  // model ids may contain slashes
  assert.deepEqual(parseModelRef("ollama/library/llama3.1"), {
    provider: "ollama",
    id: "library/llama3.1",
  });
});

test("parseModelRef: rejects refs without a provider", () => {
  assert.equal(parseModelRef("llama3.1"), null);
  assert.equal(parseModelRef(""), null);
});

test("resolveModel: --model flag wins", () => {
  const reg = fakeRegistry({
    all: [M("ollama", "qwen2.5-coder"), M("anthropic", "claude")],
    available: [M("anthropic", "claude")],
  });
  const m = resolveModel(reg, { flagModel: "ollama/qwen2.5-coder" });
  assert.equal(m.provider, "ollama");
  assert.equal(m.id, "qwen2.5-coder");
});

test("resolveModel: env var used when no flag", () => {
  const reg = fakeRegistry({ all: [M("ollama", "llama3.1")], available: [] });
  const m = resolveModel(reg, { envModel: "ollama/llama3.1" });
  assert.equal(m.id, "llama3.1");
});

test("resolveModel: flag overrides env", () => {
  const reg = fakeRegistry({ all: [M("ollama", "a"), M("ollama", "b")] });
  const m = resolveModel(reg, { flagModel: "ollama/a", envModel: "ollama/b" });
  assert.equal(m.id, "a");
});

test("resolveModel: falls back to first available", () => {
  const reg = fakeRegistry({ available: [M("anthropic", "claude"), M("ollama", "x")] });
  const m = resolveModel(reg, {});
  assert.equal(m.provider, "anthropic");
});

test("resolveModel: unknown explicit ref throws with the ref in the message", () => {
  const reg = fakeRegistry({ all: [M("ollama", "x")] });
  assert.throws(() => resolveModel(reg, { flagModel: "ollama/nope" }), /ollama\/nope/);
});

test("resolveModel: no models available throws guidance", () => {
  const reg = fakeRegistry({ all: [M("anthropic", "claude")], available: [] });
  assert.throws(() => resolveModel(reg, {}), /no model/i);
});

test("formatModelList: marks availability", () => {
  const reg = fakeRegistry({
    all: [M("ollama", "qwen2.5-coder"), M("anthropic", "claude")],
    available: [M("ollama", "qwen2.5-coder")],
  });
  const out = formatModelList(reg);
  assert.match(out, /ollama\/qwen2\.5-coder/);
  assert.match(out, /anthropic\/claude/);
  // available marker present on the available one
  assert.match(out, /✓\s+ollama\/qwen2\.5-coder/);
});
