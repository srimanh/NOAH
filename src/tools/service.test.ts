import { test } from "node:test";
import assert from "node:assert/strict";
import { serviceTool } from "./service.js";

function textOf(res: any): string {
  return res.content.map((c: any) => c.text).join("");
}

test("serviceTool: schema basics", () => {
  assert.equal(serviceTool.name, "service");
  assert.ok(serviceTool.parameters, "has typebox parameters");
});

test("serviceTool: dry-run describes without executing", async () => {
  const prev = process.env.NOAH_DRY_RUN;
  process.env.NOAH_DRY_RUN = "1";
  try {
    const res = await serviceTool.execute("id1", { action: "start", name: "nginx" });
    const text = textOf(res);
    assert.match(text, /DRY-RUN/);
    assert.match(text, /start/);
    assert.match(text, /nginx/);
  } finally {
    if (prev === undefined) delete process.env.NOAH_DRY_RUN;
    else process.env.NOAH_DRY_RUN = prev;
  }
});
