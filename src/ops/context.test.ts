import { test } from "node:test";
import assert from "node:assert/strict";
import { getCurrentTurn, setCurrentTurn, nextTurn } from "./context.js";

test("turn context: defaults to 0, set/get round-trips", () => {
  setCurrentTurn(0);
  assert.equal(getCurrentTurn(), 0);
  setCurrentTurn(7);
  assert.equal(getCurrentTurn(), 7);
});

test("turn context: nextTurn increments and returns the new turn", () => {
  setCurrentTurn(3);
  assert.equal(nextTurn(), 4);
  assert.equal(getCurrentTurn(), 4);
});
