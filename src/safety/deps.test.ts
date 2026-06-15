import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PINNED_DEPS, collectInstalledCopies, verifyPinnedDeps } from "./deps.js";

/** Build a fake node_modules tree: place a package at an arbitrary nested path. */
function pkg(nmRoot: string, relDir: string, name: string, version: string) {
  const dir = join(nmRoot, relDir, ...name.split("/"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, version }));
}

function tree(): string {
  return mkdtempSync(join(tmpdir(), "noah-deps-")) + "/node_modules";
}

test("collectInstalledCopies: finds top-level AND nested copies", () => {
  const nm = tree();
  pkg(nm, ".", "@earendil-works/pi-ai", "0.79.2");
  // nested inside another package's node_modules
  pkg(nm, "@earendil-works/pi-coding-agent/node_modules", "@earendil-works/pi-ai", "0.79.9");
  const copies = collectInstalledCopies(nm, ["@earendil-works/pi-ai"]);
  const versions = copies.map((c) => c.version).sort();
  assert.deepEqual(versions, ["0.79.2", "0.79.9"], "both copies discovered");
});

test("verifyPinnedDeps: clean tree → no violations", () => {
  const nm = tree();
  for (const [name, v] of Object.entries(PINNED_DEPS)) pkg(nm, ".", name, v);
  assert.deepEqual(verifyPinnedDeps(nm), []);
});

test("verifyPinnedDeps: a drifted nested copy is a violation (the pi-hack scenario)", () => {
  const nm = tree();
  for (const [name, v] of Object.entries(PINNED_DEPS)) pkg(nm, ".", name, v);
  // attacker / npm pulls a different pi-ai deep in the tree
  pkg(nm, "@earendil-works/pi-coding-agent/node_modules", "@earendil-works/pi-ai", "0.79.66");
  const bad = verifyPinnedDeps(nm);
  assert.equal(bad.length, 1);
  assert.equal(bad[0].name, "@earendil-works/pi-ai");
  assert.equal(bad[0].expected, "0.79.2");
  assert.equal(bad[0].found, "0.79.66");
});

test("verifyPinnedDeps: missing pin is reported (can't silently vanish)", () => {
  const nm = tree();
  pkg(nm, ".", "@earendil-works/pi-ai", "0.79.2");
  pkg(nm, ".", "@earendil-works/pi-tui", "0.79.2");
  // pi-coding-agent absent entirely
  const bad = verifyPinnedDeps(nm);
  assert.ok(bad.some((v) => v.name === "@earendil-works/pi-coding-agent" && v.found === "missing"));
});

test("INTEGRATION: the real installed tree matches the pins exactly", () => {
  const realNm = resolve(process.cwd(), "node_modules");
  const violations = verifyPinnedDeps(realNm);
  assert.deepEqual(violations, [], `pi dependency drift detected: ${JSON.stringify(violations)}`);
});
