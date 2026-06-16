import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { snapshotFile, restoreSnapshot } from "./snapshot.js";

function workspace() {
  const root = mkdtempSync(join(tmpdir(), "noah-snap-"));
  return { file: join(root, "f.txt"), snaps: join(root, "snaps") };
}

test("snapshotFile: existing file → content-addressed copy", () => {
  const { file, snaps } = workspace();
  writeFileSync(file, "original content");
  const ref = snapshotFile(file, snaps);
  assert.equal(ref.existed, true);
  assert.ok(ref.hash, "has a content hash");
  assert.equal(ref.originalPath, file);
});

test("snapshotFile: missing file → existed:false (so undo deletes)", () => {
  const { file, snaps } = workspace();
  const ref = snapshotFile(file, snaps);
  assert.equal(ref.existed, false);
  assert.equal(ref.hash, undefined);
});

test("restoreSnapshot: brings back the exact original bytes", () => {
  const { file, snaps } = workspace();
  writeFileSync(file, "ssh hardened config v1");
  const ref = snapshotFile(file, snaps);
  // NOAH overwrites the file
  writeFileSync(file, "TOTALLY DIFFERENT");
  restoreSnapshot(ref, snaps);
  assert.equal(readFileSync(file, "utf8"), "ssh hardened config v1");
});

test("restoreSnapshot: a file that did not exist → deleted on undo", () => {
  const { file, snaps } = workspace();
  const ref = snapshotFile(file, snaps); // existed:false
  writeFileSync(file, "newly created by NOAH");
  assert.ok(existsSync(file));
  restoreSnapshot(ref, snaps);
  assert.equal(existsSync(file), false, "new file removed");
});

test("snapshotFile: identical content dedupes to the same hash", () => {
  const { file, snaps } = workspace();
  writeFileSync(file, "same");
  const a = snapshotFile(file, snaps);
  writeFileSync(file, "same");
  const b = snapshotFile(file, snaps);
  assert.equal(a.hash, b.hash, "content-addressed");
});
