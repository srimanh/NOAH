import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseDf,
  parseProcesses,
  parseMemLinux,
  parseMemMac,
  parseOsRelease,
  parseSwVers,
  parseFailedServices,
  humanBytes,
  collectSnapshot,
} from "./probe.js";

/* ----------------------------------------------------------------- df */

const DF = `Filesystem     1024-blocks      Used Available Capacity Mounted on
/dev/disk3s1s1   482797652  20710480 158473776      12% /
devfs                  404       404         0     100% /dev
/dev/sda1        102687672  45678901  51789012      47% /mnt/data drive`;

test("parseDf: bytes, used%, and space-containing mounts", () => {
  const disks = parseDf(DF);
  assert.equal(disks.length, 3);
  assert.equal(disks[0].mount, "/");
  assert.equal(disks[0].total, 482797652 * 1024);
  assert.equal(disks[0].used, 20710480 * 1024);
  assert.equal(disks[0].usedPct, 12);
  assert.equal(disks[2].mount, "/mnt/data drive", "mount with spaces preserved");
});

/* ---------------------------------------------------------------- procs */

const PS = `  501  42.5  8.1 Google Chrome
   88   12.0  3.2 node
    1    0.0  0.1 launchd
  640   3.4  0.5 Terminal`;

test("parseProcesses: sorts by cpu desc, takes topN", () => {
  const procs = parseProcesses(PS, 2);
  assert.equal(procs.length, 2);
  assert.equal(procs[0].command, "Google Chrome");
  assert.equal(procs[0].cpu, 42.5);
  assert.equal(procs[0].mem, 8.1);
  assert.equal(procs[1].command, "node");
});

/* ---------------------------------------------------------------- memory */

const MEMINFO = `MemTotal:       16384000 kB
MemFree:         1024000 kB
MemAvailable:    4096000 kB
Buffers:          200000 kB`;

test("parseMemLinux: uses MemAvailable for used", () => {
  const m = parseMemLinux(MEMINFO);
  assert.equal(m.total, 16384000 * 1024);
  assert.equal(m.used, (16384000 - 4096000) * 1024);
  assert.equal(m.usedPct, Math.round(((16384000 - 4096000) / 16384000) * 100));
});

const VMSTAT = `Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                          100000.
Pages active:                        200000.
Pages inactive:                       50000.
Pages speculative:                    10000.
Pages wired down:                    150000.
Pages occupied by compressor:         40000.`;

test("parseMemMac: used = (active+wired+compressor)*pageSize", () => {
  const total = 16384 * 1024 * 1024; // 16 GiB
  const m = parseMemMac(VMSTAT, 16384, total);
  const used = (200000 + 150000 + 40000) * 16384;
  assert.equal(m.total, total);
  assert.equal(m.used, used);
  assert.equal(m.usedPct, Math.round((used / total) * 100));
});

/* -------------------------------------------------------------- os + svc */

test("parseOsRelease: PRETTY_NAME", () => {
  const c = `NAME="Ubuntu"\nPRETTY_NAME="Ubuntu 22.04.3 LTS"\nVERSION_ID="22.04"`;
  assert.equal(parseOsRelease(c), "Ubuntu 22.04.3 LTS");
});

test("parseSwVers: macOS <version>", () => {
  const c = `ProductName:    macOS\nProductVersion: 14.5\nBuildVersion:   23F79`;
  assert.equal(parseSwVers(c), "macOS 14.5");
});

test("parseFailedServices: systemctl --failed unit names", () => {
  const out = `  UNIT           LOAD   ACTIVE SUB    DESCRIPTION
  nginx.service  loaded failed failed A high performance web server
  mysql.service  loaded failed failed MySQL

2 loaded units listed.`;
  assert.deepEqual(parseFailedServices(out), ["nginx.service", "mysql.service"]);
});

test("humanBytes: readable sizes", () => {
  assert.equal(humanBytes(0), "0 B");
  assert.equal(humanBytes(1024), "1.0 KB");
  assert.equal(humanBytes(1024 * 1024 * 1.5), "1.5 MB");
  assert.match(humanBytes(1024 ** 3 * 482), /GB/);
});

/* -------------------------------------------------- collectSnapshot (faked) */

test("collectSnapshot: assembles a snapshot from an injected runner (linux)", async () => {
  const run = async (cmd: string, args: string[]) => {
    if (cmd === "cat" && args[0] === "/etc/os-release") return `PRETTY_NAME="Ubuntu 22.04 LTS"`;
    if (cmd === "cat" && args[0] === "/proc/meminfo") return MEMINFO;
    if (cmd === "df") return DF;
    if (cmd === "ps") return PS;
    if (cmd === "systemctl") return `  nginx.service loaded failed failed web\n`;
    return "";
  };
  const snap = await collectSnapshot({ platform: "linux", run, topN: 3 });
  assert.match(snap.os, /Ubuntu/);
  assert.equal(snap.disks.length, 3);
  assert.ok(snap.memory && snap.memory.usedPct > 0);
  assert.equal(snap.topProcesses[0].command, "Google Chrome");
  assert.deepEqual(snap.failedServices, ["nginx.service"]);
});

test("collectSnapshot: degrades gracefully when a probe fails", async () => {
  const run = async (cmd: string) => {
    if (cmd === "df") throw new Error("boom");
    return "";
  };
  const snap = await collectSnapshot({ platform: "linux", run });
  assert.deepEqual(snap.disks, [], "failed disk probe yields empty, not a crash");
  assert.ok(typeof snap.os === "string");
});
