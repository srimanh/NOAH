/**
 * System telemetry probe — the machine-awareness foundation.
 *
 * Pure parsers (TDD'd against captured command output) + a thin, injectable
 * collector. Every metric is independent and degrades to "unknown"/empty on
 * failure, so a missing tool never crashes the snapshot.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export interface DiskInfo {
  mount: string;
  total: number; // bytes
  used: number; // bytes
  available: number; // bytes
  usedPct: number;
}
export interface ProcInfo {
  pid: number;
  cpu: number; // %
  mem: number; // %
  command: string;
}
export interface MemInfo {
  total: number; // bytes
  used: number; // bytes
  usedPct: number;
}
export interface SystemSnapshot {
  os: string;
  memory?: MemInfo;
  disks: DiskInfo[];
  topProcesses: ProcInfo[];
  failedServices: string[];
  updates?: number;
}

/* ------------------------------------------------------------------ parsers */

/** Parse `df -k -P` (POSIX). Values are 1024-blocks → bytes. */
export function parseDf(output: string): DiskInfo[] {
  const out: DiskInfo[] = [];
  const lines = output.trim().split("\n").slice(1); // drop header
  for (const line of lines) {
    const t = line.trim().split(/\s+/);
    if (t.length < 6) continue;
    const total = Number(t[1]);
    const used = Number(t[2]);
    const avail = Number(t[3]);
    const pct = parseInt(t[4], 10);
    if (!Number.isFinite(total) || !Number.isFinite(used)) continue;
    out.push({
      mount: t.slice(5).join(" "),
      total: total * 1024,
      used: used * 1024,
      available: avail * 1024,
      usedPct: Number.isFinite(pct) ? pct : 0,
    });
  }
  return out;
}

/** Parse `ps -axo pid=,pcpu=,pmem=,comm=` → top N by cpu. */
export function parseProcesses(output: string, topN = 5): ProcInfo[] {
  const procs: ProcInfo[] = [];
  for (const line of output.trim().split("\n")) {
    const m = line.trim().match(/^(\d+)\s+([\d.]+)\s+([\d.]+)\s+(.+)$/);
    if (!m) continue;
    procs.push({ pid: Number(m[1]), cpu: Number(m[2]), mem: Number(m[3]), command: m[4].trim() });
  }
  return procs.sort((a, b) => b.cpu - a.cpu).slice(0, topN);
}

/** Parse Linux /proc/meminfo (uses MemAvailable). */
export function parseMemLinux(meminfo: string): MemInfo {
  const kb = (key: string) => {
    const m = meminfo.match(new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, "m"));
    return m ? Number(m[1]) * 1024 : 0;
  };
  const total = kb("MemTotal");
  const available = kb("MemAvailable");
  const used = total - available;
  return { total, used, usedPct: total ? Math.round((used / total) * 100) : 0 };
}

/** Parse macOS `vm_stat` page counts → used = (active+wired+compressor)*pageSize. */
export function parseMemMac(vmStat: string, pageSize: number, total: number): MemInfo {
  const pages = (label: string) => {
    const m = vmStat.match(new RegExp(`${label}:\\s+(\\d+)`));
    return m ? Number(m[1]) : 0;
  };
  const used =
    (pages("Pages active") + pages("Pages wired down") + pages("Pages occupied by compressor")) * pageSize;
  return { total, used, usedPct: total ? Math.round((used / total) * 100) : 0 };
}

export function parseOsRelease(content: string): string {
  const m = content.match(/^PRETTY_NAME="?([^"\n]+)"?/m);
  return m ? m[1] : "Linux";
}

export function parseSwVers(content: string): string {
  const v = content.match(/ProductVersion:\s*([\d.]+)/);
  return v ? `macOS ${v[1]}` : "macOS";
}

/** Parse `systemctl --failed` → failed unit names. */
export function parseFailedServices(output: string): string[] {
  const out: string[] = [];
  for (const line of output.split("\n")) {
    const m = line.trim().match(/^([\w@.\\-]+\.service)\s+\S+\s+failed/);
    if (m) out.push(m[1]);
  }
  return out;
}

export function humanBytes(n: number): string {
  if (n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${i === 0 ? v : v.toFixed(1)} ${units[i]}`;
}

/* ---------------------------------------------------------------- collector */

export type Runner = (cmd: string, args: string[]) => Promise<string>;

const realRun: Runner = async (cmd, args) => {
  const { stdout } = await exec(cmd, args, { timeout: 8000 });
  return stdout;
};

export interface CollectOptions {
  platform?: NodeJS.Platform | string;
  run?: Runner;
  topN?: number;
}

/** Best-effort, never-throw system snapshot. Each probe degrades independently. */
export async function collectSnapshot(opts: CollectOptions = {}): Promise<SystemSnapshot> {
  const platform = opts.platform ?? process.platform;
  const run = opts.run ?? realRun;
  const topN = opts.topN ?? 5;
  const isMac = platform === "darwin";

  const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const os = await safe(
    async () =>
      isMac
        ? parseSwVers(await run("sw_vers", []))
        : parseOsRelease(await run("cat", ["/etc/os-release"])),
    isMac ? "macOS" : "Linux",
  );

  const memory = await safe<MemInfo | undefined>(async () => {
    if (isMac) {
      const total = Number((await run("sysctl", ["-n", "hw.memsize"])).trim());
      const pageSize = Number((await run("sysctl", ["-n", "hw.pagesize"])).trim()) || 4096;
      return parseMemMac(await run("vm_stat", []), pageSize, total);
    }
    return parseMemLinux(await run("cat", ["/proc/meminfo"]));
  }, undefined);

  const disks = await safe(async () => parseDf(await run("df", ["-k", "-P"])), [] as DiskInfo[]);
  const topProcesses = await safe(
    async () => parseProcesses(await run("ps", ["-axo", "pid=,pcpu=,pmem=,comm="]), topN),
    [] as ProcInfo[],
  );
  const failedServices = isMac
    ? []
    : await safe(
        async () => parseFailedServices(await run("systemctl", ["--failed", "--no-legend", "--plain"])),
        [] as string[],
      );

  return { os, memory, disks, topProcesses, failedServices };
}
