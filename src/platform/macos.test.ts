import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMacosAdapter } from "./macos.js";
import type { ShRunner } from "./types.js";

function spy() {
  const calls: { cmd: string; args: string[] }[] = [];
  const sh: ShRunner = async (cmd, args) => {
    calls.push({ cmd, args });
    return "ok";
  };
  return { sh, calls, last: () => calls[calls.length - 1] };
}

test("macos: brew pkg mapping", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  assert.equal(a.pkgManager, "brew");
  await a.pkg("install", "htop");
  assert.deepEqual(s.last(), { cmd: "brew", args: ["install", "htop"] });
  await a.pkg("remove", "htop");
  assert.deepEqual(s.last().args, ["uninstall", "htop"]);
  await a.pkg("update");
  assert.deepEqual(s.last().args, ["upgrade"]);
});

test("macos: service start/stop via launchctl", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  await a.service("com.example.app", "start");
  assert.deepEqual(s.last(), { cmd: "launchctl", args: ["start", "com.example.app"] });
  await a.service("com.example.app", "stop");
  assert.deepEqual(s.last().args, ["stop", "com.example.app"]);
});

test("macos: service status uses launchctl list", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  await a.service("com.example.app", "status");
  assert.deepEqual(s.last(), { cmd: "launchctl", args: ["list", "com.example.app"] });
});

test("macos: enable/disable unsupported -> explains, no exec", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  const out = await a.service("com.example.app", "enable");
  assert.match(out, /not supported on macOS/i);
  assert.equal(s.calls.length, 0, "no command run for unsupported action");
});

test("macos: net uses ifconfig/lsof/curl", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  await a.net("info");
  assert.equal(s.last().cmd, "ifconfig");
  await a.net("ports");
  assert.equal(s.last().cmd, "lsof");
  await a.net("ping", "example.com");
  assert.deepEqual(s.last(), { cmd: "ping", args: ["-c", "4", "example.com"] });
  await a.net("fetch", "https://example.com");
  assert.equal(s.last().cmd, "curl");
  assert.ok(s.last().args.includes("https://example.com"));
});

test("macos: logs uses log show", async () => {
  const s = spy();
  const a = makeMacosAdapter(s.sh);
  await a.logs();
  assert.equal(s.last().cmd, "log");
  assert.ok(s.last().args.includes("show"));
});
