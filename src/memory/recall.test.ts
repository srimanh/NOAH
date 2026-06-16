import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreFact, recall, formatMemoryBlock } from "./recall.js";
import type { Fact } from "./types.js";

function f(text: string, at: number, kind: Fact["kind"] = "learning"): Fact {
  return { id: String(at), kind, text, source: "user", at };
}

test("scoreFact: keyword overlap raises the score", () => {
  const py = f("uses python3 and pip", 1000);
  const db = f("postgres runs on port 5432", 2000);
  assert.ok(scoreFact(py, "how do I run python") > scoreFact(db, "how do I run python"));
});

test("recall: ranks relevant facts first, respects limit", () => {
  const facts = [
    f("uses docker compose", 1000),
    f("prefers VS Code editor", 2000),
    f("deploys with docker swarm", 3000),
  ];
  const top = recall(facts, "docker", 2);
  assert.equal(top.length, 2);
  assert.ok(top.every((x) => /docker/.test(x.text)));
});

test("recall: empty query → most recent first", () => {
  const facts = [f("old", 1000), f("newer", 2000), f("newest", 3000)];
  const top = recall(facts, "", 2);
  assert.deepEqual(
    top.map((x) => x.text),
    ["newest", "newer"],
  );
});

test("formatMemoryBlock: empty facts → empty string", () => {
  assert.equal(formatMemoryBlock([]), "");
});

test("formatMemoryBlock: includes facts under a clear heading", () => {
  const block = formatMemoryBlock([f("Package manager: brew", 1, "machine"), f("prefers pm2", 2, "preference")]);
  assert.match(block, /know/i);
  assert.match(block, /brew/);
  assert.match(block, /pm2/);
});
