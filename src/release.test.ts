import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = (f: string) => fileURLToPath(new URL(`../${f}`, import.meta.url));
const pkg = JSON.parse(readFileSync(root("package.json"), "utf8"));

test("release: LICENSE file exists and is MIT with an author + year", () => {
  assert.ok(existsSync(root("LICENSE")), "LICENSE file present");
  const lic = readFileSync(root("LICENSE"), "utf8");
  assert.match(lic, /MIT License/);
  assert.match(lic, /20\d\d/);
  assert.match(lic, /Copyright/);
});

test("release: package.json has the npm metadata publishers expect", () => {
  assert.equal(pkg.license, "MIT");
  assert.ok(pkg.description && pkg.description.length > 20);
  assert.ok(pkg.author, "author set");
  assert.ok(pkg.repository && /github\.com/.test(JSON.stringify(pkg.repository)), "repository → github");
  assert.ok(pkg.homepage && /github/.test(pkg.homepage), "homepage set");
  assert.ok(pkg.bugs, "bugs url set");
  assert.ok(pkg.engines && pkg.engines.node, "engines.node pinned");
});

test("release: bin, exports, files are publish-correct", () => {
  assert.equal(pkg.bin.noah, "./dist/cli.js");
  assert.equal(pkg.exports["."], "./dist/sdk.js");
  assert.ok(pkg.files.includes("dist") && pkg.files.includes("themes"));
});

test("release: prepublishOnly guards the registry with build + tests", () => {
  assert.ok(pkg.scripts.prepublishOnly, "prepublishOnly script present");
  assert.match(pkg.scripts.prepublishOnly, /test/, "runs tests before publish");
});

test("release: discoverable keywords (sysadmin / devops / ai)", () => {
  for (const k of ["sysadmin", "devops", "ai"]) assert.ok(pkg.keywords.includes(k), `keyword ${k}`);
});

test("release: README documents install, the doctor command, and license", () => {
  const readme = readFileSync(root("README.md"), "utf8");
  assert.match(readme, /npm install|npm i /);
  assert.match(readme, /noah-agent|noah /);
  assert.match(readme, /doctor/i, "documents the health report");
  assert.match(readme, /## License/i);
});
