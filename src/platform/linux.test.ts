import { test } from "node:test";
import assert from "node:assert/strict";
import { makeLinuxAdapter } from "./linux.js";
import type { ShRunner } from "./types.js";

/** Spy runner: records the last (cmd, args) and returns a canned string. */
function spy() {
  const calls: { cmd: string; args: string[] }[] = [];
  const sh: ShRunner = async (cmd, args) => {
    calls.push({ cmd, args });
    return "ok";
  };
  return { sh, calls, last: () => calls[calls.length - 1] };
}

test("makeLinuxAdapter: reports os label and pkgManager", () => {
  const { sh } = spy();
  const a = makeLinuxAdapter("dnf", sh);
  assert.equal(a.pkgManager, "dnf");
  assert.match(a.os, /dnf/i);
});

test("apt: install/remove/update map to apt-get with -y", async () => {
  const s = spy();
  const a = makeLinuxAdapter("apt", s.sh);
  await a.pkg("install", "htop");
  assert.deepEqual(s.last(), { cmd: "sudo", args: ["apt-get", "install", "-y", "htop"] });
  await a.pkg("remove", "htop");
  assert.deepEqual(s.last().args, ["apt-get", "remove", "-y", "htop"]);
  await a.pkg("update");
  assert.deepEqual(s.last().args, ["apt-get", "upgrade", "-y"]);
});

test("dnf: maps actions", async () => {
  const s = spy();
  const a = makeLinuxAdapter("dnf", s.sh);
  await a.pkg("install", "htop");
  assert.deepEqual(s.last(), { cmd: "sudo", args: ["dnf", "install", "-y", "htop"] });
});

test("pacman: uses -S/-R/-Syu with --noconfirm", async () => {
  const s = spy();
  const a = makeLinuxAdapter("pacman", s.sh);
  await a.pkg("install", "htop");
  assert.deepEqual(s.last().args, ["pacman", "-S", "--noconfirm", "htop"]);
  await a.pkg("remove", "htop");
  assert.deepEqual(s.last().args, ["pacman", "-R", "--noconfirm", "htop"]);
  await a.pkg("update");
  assert.deepEqual(s.last().args, ["pacman", "-Syu", "--noconfirm"]);
});

test("zypper: maps actions", async () => {
  const s = spy();
  const a = makeLinuxAdapter("zypper", s.sh);
  await a.pkg("install", "htop");
  assert.deepEqual(s.last().args, ["zypper", "install", "-y", "htop"]);
  await a.pkg("update");
  assert.deepEqual(s.last().args, ["zypper", "update", "-y"]);
});

test("service: systemctl with sudo for mutating actions, no sudo for status", async () => {
  const s = spy();
  const a = makeLinuxAdapter("apt", s.sh);
  await a.service("nginx", "start");
  assert.deepEqual(s.last(), { cmd: "sudo", args: ["systemctl", "start", "nginx"] });
  await a.service("nginx", "status");
  assert.deepEqual(s.last(), { cmd: "systemctl", args: ["status", "nginx", "--no-pager"] });
});

test("net: linux uses ip/ss/curl", async () => {
  const s = spy();
  const a = makeLinuxAdapter("apt", s.sh);
  await a.net("info");
  assert.equal(s.last().cmd, "ip");
  await a.net("ports");
  assert.equal(s.last().cmd, "ss");
  await a.net("ping", "example.com");
  assert.deepEqual(s.last(), { cmd: "ping", args: ["-c", "4", "example.com"] });
  await a.net("fetch", "https://example.com");
  assert.equal(s.last().cmd, "curl");
  assert.ok(s.last().args.includes("https://example.com"));
});

test("logs: journalctl for a unit", async () => {
  const s = spy();
  const a = makeLinuxAdapter("apt", s.sh);
  await a.logs("nginx");
  assert.deepEqual(s.last(), {
    cmd: "journalctl",
    args: ["-u", "nginx", "-n", "200", "--no-pager"],
  });
});
