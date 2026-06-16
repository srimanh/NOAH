import { test } from "node:test";
import assert from "node:assert/strict";
import { inverseOf, describeAction, isReversible } from "./inverse.js";

test("inverseOf: package install ↔ remove", () => {
  assert.deepEqual(inverseOf({ tool: "package", action: "install", pkg: "htop" }), {
    tool: "package",
    action: "remove",
    pkg: "htop",
  });
  assert.deepEqual(inverseOf({ tool: "package", action: "remove", pkg: "htop" }), {
    tool: "package",
    action: "install",
    pkg: "htop",
  });
});

test("inverseOf: package update is NOT reversible", () => {
  assert.equal(inverseOf({ tool: "package", action: "update" }), null);
  assert.equal(inverseOf({ tool: "package", action: "install" }), null, "install without pkg → null");
});

test("inverseOf: service enable↔disable, start↔stop", () => {
  assert.deepEqual(inverseOf({ tool: "service", action: "enable", name: "nginx" }), {
    tool: "service",
    action: "disable",
    name: "nginx",
  });
  assert.deepEqual(inverseOf({ tool: "service", action: "stop", name: "nginx" }), {
    tool: "service",
    action: "start",
    name: "nginx",
  });
});

test("inverseOf: restart/reload/status are NOT reversible", () => {
  for (const action of ["restart", "reload", "status"]) {
    assert.equal(inverseOf({ tool: "service", action, name: "nginx" }), null, action);
  }
});

test("isReversible mirrors inverseOf", () => {
  assert.equal(isReversible({ tool: "package", action: "install", pkg: "git" }), true);
  assert.equal(isReversible({ tool: "package", action: "update" }), false);
});

test("describeAction: human readable", () => {
  assert.equal(describeAction({ tool: "package", action: "install", pkg: "htop" }), "package install htop");
  assert.equal(describeAction({ tool: "service", action: "start", name: "nginx" }), "service start nginx");
  assert.equal(describeAction({ tool: "package", action: "update" }), "package update (all)");
});
