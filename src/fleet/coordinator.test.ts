import { test } from "node:test";
import assert from "node:assert/strict";
import { fanOut } from "./coordinator.js";
import type { Node } from "./inventory.js";
import type { NodeClient } from "./transport.js";

const nodes: Node[] = [
  { name: "a", host: "ha" },
  { name: "b", host: "hb" },
  { name: "c", host: "hc" },
];

test("fanOut: runs the command on every node and collects results", async () => {
  const client: NodeClient = {
    run: async (node) => ({ ok: true, stdout: `${node.name}: ok` }),
  };
  const results = await fanOut(nodes, "noah doctor", client);
  assert.equal(results.length, 3);
  assert.ok(results.every((r) => r.ok));
  assert.deepEqual(results.map((r) => r.node).sort(), ["a", "b", "c"]);
});

test("fanOut: one failing node does not break the others", async () => {
  const client: NodeClient = {
    run: async (node) => {
      if (node.name === "b") throw new Error("connection refused");
      return { ok: true, stdout: "fine" };
    },
  };
  const results = await fanOut(nodes, "uptime", client);
  const b = results.find((r) => r.node === "b")!;
  assert.equal(b.ok, false);
  assert.match(b.error!, /connection refused/);
  assert.equal(results.filter((r) => r.ok).length, 2);
});

test("fanOut: a non-zero remote exit is reported as not ok", async () => {
  const client: NodeClient = {
    run: async () => ({ ok: false, stdout: "", stderr: "boom", code: 1 }),
  };
  const results = await fanOut([nodes[0]], "x", client);
  assert.equal(results[0].ok, false);
  assert.match(results[0].error ?? results[0].output, /boom/);
});

test("fanOut: respects concurrency limit", async () => {
  let active = 0;
  let peak = 0;
  const client: NodeClient = {
    run: async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { ok: true, stdout: "ok" };
    },
  };
  await fanOut(nodes, "x", client, { concurrency: 1 });
  assert.equal(peak, 1, "never more than 1 in flight");
});
