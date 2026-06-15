/**
 * Supply-chain integrity guard.
 *
 * NOAH is built on the pi SDK, but it must NOT inherit pi's release cadence or
 * any compromise in a pi patch release. We pin the exact pi versions we have
 * vetted and verify — across the WHOLE installed tree (including nested copies
 * that npm may resolve via pi's own `^` ranges) — that nothing has drifted.
 *
 * Combined with `bundleDependencies` (we ship the vetted pi tree inside our
 * tarball), this means: even if a malicious pi release lands on the registry,
 * a NOAH install neither downloads nor runs it.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The single source of truth for which pi versions NOAH trusts. */
export const PINNED_DEPS: Record<string, string> = {
  "@earendil-works/pi-ai": "0.79.2",
  "@earendil-works/pi-coding-agent": "0.79.2",
  "@earendil-works/pi-tui": "0.79.2",
};

export interface InstalledCopy {
  name: string;
  version: string;
  path: string;
}

export interface DepViolation {
  name: string;
  expected: string;
  found: string; // a version, or "missing"
  path: string;
}

function readVersion(pkgJsonPath: string): string | null {
  try {
    const parsed = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    return typeof parsed?.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

/** Every `node_modules` directory reachable from a root node_modules dir. */
function allNodeModules(root: string): string[] {
  const found: string[] = [];
  if (!existsSync(root)) return found;

  const visit = (nm: string) => {
    found.push(nm);
    let entries: string[];
    try {
      entries = readdirSync(nm);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === ".bin" || entry === ".cache") continue;
      // Scoped packages (@scope/pkg) hold their packages one level deeper.
      const pkgDirs = entry.startsWith("@")
        ? safeList(join(nm, entry)).map((sub) => join(nm, entry, sub))
        : [join(nm, entry)];
      for (const pkgDir of pkgDirs) {
        const childNm = join(pkgDir, "node_modules");
        if (existsSync(childNm)) visit(childNm);
      }
    }
  };

  visit(root);
  return found;
}

function safeList(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** All installed copies of the named packages anywhere in the tree. */
export function collectInstalledCopies(nodeModulesRoot: string, names: string[]): InstalledCopy[] {
  const copies: InstalledCopy[] = [];
  for (const nm of allNodeModules(nodeModulesRoot)) {
    for (const name of names) {
      const pkgJson = join(nm, ...name.split("/"), "package.json");
      if (!existsSync(pkgJson)) continue;
      const version = readVersion(pkgJson);
      if (version) copies.push({ name, version, path: pkgJson });
    }
  }
  return copies;
}

/**
 * Verify every installed copy of every pinned package matches the pin exactly.
 * A pin with no copy at all is reported as `found: "missing"`.
 */
export function verifyPinnedDeps(
  nodeModulesRoot: string,
  pinned: Record<string, string> = PINNED_DEPS,
): DepViolation[] {
  const names = Object.keys(pinned);
  const copies = collectInstalledCopies(nodeModulesRoot, names);
  const violations: DepViolation[] = [];

  for (const name of names) {
    const expected = pinned[name];
    const mine = copies.filter((c) => c.name === name);
    if (mine.length === 0) {
      violations.push({ name, expected, found: "missing", path: nodeModulesRoot });
      continue;
    }
    for (const c of mine) {
      if (c.version !== expected) {
        violations.push({ name, expected, found: c.version, path: c.path });
      }
    }
  }
  return violations;
}

/** Human-readable report for CLI / prepublish use. */
export function formatViolations(violations: DepViolation[]): string {
  if (violations.length === 0) return "✓ pi dependencies verified — all pinned versions intact.";
  const lines = violations.map(
    (v) => `  ✗ ${v.name}: expected ${v.expected}, found ${v.found}\n      ${v.path}`,
  );
  return `Supply-chain integrity check FAILED — pi dependency drift detected:\n${lines.join("\n")}`;
}
