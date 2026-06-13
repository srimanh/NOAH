import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverExtensions, loadExtensions, activeFactories, extensionDirs } from "./loader.js";

test("extensionDirs: ~/.noah/extensions (user) and ./extensions (project)", () => {
  const dirs = extensionDirs();
  assert.ok(dirs.some((d) => d.source === "user" && /\.noah[\/].*extensions/.test(d.dir)));
  assert.ok(dirs.some((d) => d.source === "project" && /extensions$/.test(d.dir)));
});

test("discoverExtensions: loads good, isolates a failing one (injected)", async () => {
  const readdir = (d: string) => (d === "/x" ? ["good.mjs", "bad.mjs", "notes.txt"] : []);
  const importModule = async (p: string) => {
    if (p.endsWith("bad.mjs")) throw new Error("syntax error");
    return { default: () => {} };
  };
  const recs = await discoverExtensions({ dirs: [{ dir: "/x", source: "project" }], readdir, importModule });
  const good = recs.find((r) => r.name === "good")!;
  const bad = recs.find((r) => r.name === "bad")!;
  assert.equal(good.status, "loaded");
  assert.equal(typeof good.factory, "function");
  assert.equal(bad.status, "error");
  assert.match(bad.error ?? "", /syntax error/);
  assert.ok(!recs.some((r) => r.name === "notes"), "non-script files ignored");
});

test("loadExtensions: built-ins always present and loaded", async () => {
  const recs = await loadExtensions({ dirs: [] });
  const names = recs.filter((r) => r.source === "built-in").map((r) => r.name);
  assert.ok(names.includes("anthropic-subscription-fix"));
  assert.ok(names.includes("github-copilot-fix"));
  assert.ok(recs.filter((r) => r.source === "built-in").every((r) => r.status === "loaded"));
});

test("activeFactories: only loaded extensions, failures excluded", async () => {
  const recs = await loadExtensions({ dirs: [] });
  recs.push({ name: "broken", source: "user", status: "error", error: "x" });
  const factories = activeFactories(recs);
  assert.equal(factories.length, recs.filter((r) => r.status === "loaded").length);
  for (const f of factories) assert.equal(typeof f, "function");
});

test("discoverExtensions: real temp dir — good loads, broken isolated", async () => {
  const dir = mkdtempSync(join(tmpdir(), "noah-ext-"));
  writeFileSync(join(dir, "hello.mjs"), "export default function(pi){ pi.on('x', ()=>{}); }\n");
  writeFileSync(join(dir, "broken.mjs"), "export default = ;\n"); // syntax error
  const recs = await discoverExtensions({ dirs: [{ dir, source: "user" }] });
  assert.equal(recs.find((r) => r.name === "hello")?.status, "loaded");
  assert.equal(recs.find((r) => r.name === "broken")?.status, "error");
});
