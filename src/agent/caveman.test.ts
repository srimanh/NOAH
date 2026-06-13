import { test } from "node:test";
import assert from "node:assert/strict";
import { CAVEMAN_LEVELS, isCavemanLevel, cavemanInstruction, cavemanExtension } from "./caveman.js";

test("CAVEMAN_LEVELS includes the token-saving tiers", () => {
  assert.ok(CAVEMAN_LEVELS.includes("lite"));
  assert.ok(CAVEMAN_LEVELS.includes("full"));
  assert.ok(CAVEMAN_LEVELS.includes("ultra"));
  assert.ok(CAVEMAN_LEVELS.includes("micro"));
});

test("isCavemanLevel validates input", () => {
  assert.equal(isCavemanLevel("full"), true);
  assert.equal(isCavemanLevel("off"), true);
  assert.equal(isCavemanLevel("nope"), false);
});

test("cavemanInstruction: empty when off, terse rules when on", () => {
  assert.equal(cavemanInstruction("off"), "");
  for (const lvl of CAVEMAN_LEVELS) {
    const txt = cavemanInstruction(lvl);
    assert.ok(txt.length > 0, `${lvl} has rules`);
    assert.match(txt, /caveman|terse|filler|token/i, `${lvl} mentions terseness`);
  }
  // micro uses the compact variant
  assert.notEqual(cavemanInstruction("micro"), cavemanInstruction("full"));
});

test("cavemanExtension: appends rules to the system prompt only when enabled", async () => {
  const calls: Array<(e: any, c?: any) => any> = [];
  const pi = { on: (_ev: string, h: any) => calls.push(h) } as any;

  let level: any = "off";
  cavemanExtension(() => level)(pi);
  const handler = calls[0];

  // off → no change
  assert.equal(await handler({ systemPrompt: "BASE" }), undefined);

  // on → appended
  level = "full";
  const res = await handler({ systemPrompt: "BASE" });
  assert.ok(res && typeof res.systemPrompt === "string");
  assert.ok(res.systemPrompt.startsWith("BASE"));
  assert.ok(res.systemPrompt.length > "BASE".length);
  assert.match(res.systemPrompt, /caveman/i);
});
