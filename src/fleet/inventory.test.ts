import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addNode, removeNode, listNodes, getNode } from "./inventory.js";

const inv = () => join(mkdtempSync(join(tmpdir(), "noah-fleet-")), "fleet.json");

test("addNode + listNodes: persists nodes", () => {
  const p = inv();
  addNode({ name: "web1", host: "10.0.0.1", user: "deploy" }, p);
  addNode({ name: "web2", host: "10.0.0.2" }, p);
  const nodes = listNodes(p);
  assert.equal(nodes.length, 2);
  assert.equal(getNode("web1", p)!.user, "deploy");
});

test("addNode: same name overwrites (idempotent registration)", () => {
  const p = inv();
  addNode({ name: "web1", host: "old" }, p);
  addNode({ name: "web1", host: "new" }, p);
  assert.equal(listNodes(p).length, 1);
  assert.equal(getNode("web1", p)!.host, "new");
});

test("removeNode: deletes by name", () => {
  const p = inv();
  addNode({ name: "web1", host: "h1" }, p);
  addNode({ name: "web2", host: "h2" }, p);
  assert.equal(removeNode("web1", p), true);
  assert.deepEqual(listNodes(p).map((n) => n.name), ["web2"]);
  assert.equal(removeNode("nope", p), false);
});

test("listNodes: missing/corrupt file → empty", () => {
  assert.deepEqual(listNodes(join(tmpdir(), "noah-fleet-missing-xyz", "fleet.json")), []);
});
