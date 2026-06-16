import { test } from "node:test";
import assert from "node:assert/strict";
import { notifyCommand } from "./notify.js";

test("notifyCommand: macOS uses osascript", () => {
  const c = notifyCommand("macos", "NOAH", "disk full");
  assert.equal(c!.cmd, "osascript");
  assert.ok(c!.args.join(" ").includes("display notification"));
  assert.ok(c!.args.join(" ").includes("disk full"));
});

test("notifyCommand: Linux uses notify-send", () => {
  const c = notifyCommand("linux", "NOAH", "disk full");
  assert.equal(c!.cmd, "notify-send");
  assert.deepEqual(c!.args, ["NOAH", "disk full"]);
});

test("notifyCommand: escapes quotes in the macOS AppleScript", () => {
  const c = notifyCommand("macos", "NOAH", 'he said "hi"');
  assert.ok(!/[^\\]"hi"/.test(c!.args[1]), "inner quotes are escaped");
});

test("notifyCommand: unknown os → null (log-only fallback)", () => {
  assert.equal(notifyCommand("windows" as never, "t", "m"), null);
});
