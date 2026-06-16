/**
 * Content-addressed file snapshots for the Reversible Operations Engine.
 *
 * Before NOAH overwrites or creates a file, we snapshot the current state so
 * `noah undo` can restore the exact bytes (or delete a file that didn't exist
 * before). Snapshots are keyed by SHA-256, so identical content is stored once.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/** Resolved at call time so tests (and `NOAH_SNAP_DIR`) take effect. */
export function defaultSnapDir(): string {
  return process.env.NOAH_SNAP_DIR || join(homedir(), ".noah", "snapshots");
}

export interface SnapshotRef {
  originalPath: string;
  existed: boolean;
  hash?: string; // present only when the file existed
  size?: number;
}

/** Capture the current state of `path`. */
export function snapshotFile(path: string, dir: string = defaultSnapDir()): SnapshotRef {
  if (!existsSync(path)) {
    return { originalPath: path, existed: false };
  }
  try {
    const buf = readFileSync(path);
    const hash = createHash("sha256").update(buf).digest("hex");
    mkdirSync(dir, { recursive: true });
    const dest = join(dir, hash);
    if (!existsSync(dest)) copyFileSync(path, dest);
    return { originalPath: path, existed: true, hash, size: statSync(path).size };
  } catch {
    // If we can't snapshot, mark as non-restorable by reporting "existed:false"
    // is wrong (would delete). Instead report existed with no hash → undo skips.
    return { originalPath: path, existed: true };
  }
}

/** Restore `path` to its snapshotted state. */
export function restoreSnapshot(ref: SnapshotRef, dir: string = defaultSnapDir()): void {
  if (!ref.existed) {
    // The file did not exist before NOAH touched it → remove it.
    if (existsSync(ref.originalPath)) rmSync(ref.originalPath, { force: true });
    return;
  }
  if (!ref.hash) {
    throw new Error(`Snapshot for ${ref.originalPath} is incomplete; cannot restore.`);
  }
  const src = join(dir, ref.hash);
  if (!existsSync(src)) throw new Error(`Snapshot blob missing for ${ref.originalPath}.`);
  mkdirSync(dirname(ref.originalPath), { recursive: true });
  copyFileSync(src, ref.originalPath);
}
