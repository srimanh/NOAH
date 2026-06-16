import { test } from "node:test";
import assert from "node:assert/strict";
import { CheckpointLog } from "./checkpoints.js";

test("CheckpointLog: add + list in order", () => {
  const log = new CheckpointLog();
  log.add(1, "install htop", 0, 1000);
  log.add(2, "start nginx", 3, 2000);
  assert.equal(log.size, 2);
  assert.deepEqual(
    log.list().map((c) => c.turn),
    [1, 2],
  );
});

test("CheckpointLog: get by turn", () => {
  const log = new CheckpointLog();
  log.add(1, "a", 0, 1000);
  log.add(2, "b", 2, 2000);
  assert.equal(log.get(2)!.text, "b");
  assert.equal(log.get(2)!.entryIndex, 2);
  assert.equal(log.get(99), undefined);
});

test("CheckpointLog: truncateFrom removes a turn and everything after it", () => {
  const log = new CheckpointLog();
  log.add(1, "a", 0, 1000);
  log.add(2, "b", 2, 2000);
  log.add(3, "c", 5, 3000);
  const removed = log.truncateFrom(2);
  assert.equal(removed, 2, "turns 2 and 3 removed");
  assert.deepEqual(
    log.list().map((c) => c.turn),
    [1],
  );
});

test("CheckpointLog: latest", () => {
  const log = new CheckpointLog();
  assert.equal(log.latest(), undefined);
  log.add(1, "a", 0, 1000);
  log.add(2, "b", 2, 2000);
  assert.equal(log.latest()!.turn, 2);
});
