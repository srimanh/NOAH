import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPlatform } from "./detect.js";

const has = (...present: string[]) => (cmd: string) => present.includes(cmd);

test("detectPlatform: macOS always uses brew", () => {
  const d = detectPlatform({ platform: "darwin", has: has() });
  assert.equal(d.kind, "macos");
  assert.equal(d.pkgManager, "brew");
});

test("detectPlatform: Linux picks apt when present", () => {
  const d = detectPlatform({ platform: "linux", has: has("apt-get") });
  assert.equal(d.kind, "linux");
  assert.equal(d.pkgManager, "apt");
});

test("detectPlatform: Linux probe order — dnf before pacman/zypper", () => {
  const d = detectPlatform({ platform: "linux", has: has("dnf", "pacman") });
  assert.equal(d.pkgManager, "dnf");
});

test("detectPlatform: Linux picks pacman", () => {
  assert.equal(detectPlatform({ platform: "linux", has: has("pacman") }).pkgManager, "pacman");
});

test("detectPlatform: Linux picks zypper", () => {
  assert.equal(detectPlatform({ platform: "linux", has: has("zypper") }).pkgManager, "zypper");
});

test("detectPlatform: Linux with no known PM falls back to apt", () => {
  const d = detectPlatform({ platform: "linux", has: has() });
  assert.equal(d.kind, "linux");
  assert.equal(d.pkgManager, "apt");
});
