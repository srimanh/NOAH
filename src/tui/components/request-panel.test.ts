import { test } from "node:test";
import assert from "node:assert/strict";
import { RequestPanelComponent } from "./request-panel.js";
import { visibleLen } from "../../ui/ansi.js";

test("RequestPanelComponent: every line fits the viewport width", () => {
  const c = new RequestPanelComponent("install htop and show my biggest files");
  for (const width of [20, 40, 64, 100, 120]) {
    const lines = c.render(width);
    assert.ok(Array.isArray(lines), `render(${width}) returns an array`);
    assert.ok(lines.length >= 3, `render(${width}) has at least 3 lines (box)`);
    for (const line of lines) {
      assert.ok(
        visibleLen(line) <= width,
        `width ${width}: line exceeds (${visibleLen(line)}): ${JSON.stringify(line)}`,
      );
    }
  }
});

test("RequestPanelComponent: shows REQUEST title and the request text", () => {
  const c = new RequestPanelComponent("install htop");
  const joined = c.render(80).join("\n");
  assert.match(joined, /REQUEST/);
  assert.match(joined, /install htop/);
});

test("RequestPanelComponent: implements the pi-tui Component contract", () => {
  const c = new RequestPanelComponent("x");
  assert.equal(typeof c.render, "function");
  assert.equal(typeof c.invalidate, "function");
});
