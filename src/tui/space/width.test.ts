import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleWidth } from "@earendil-works/pi-tui";
import { InputBox, Palette, Selector, Footer, SystemBlock } from "./components.js";

/** The renderer's own measure — every line MUST be <= width or pi-tui throws. */
const piFits = (lines: string[], w: number) => lines.every((l) => visibleWidth(l) <= w);
const offenders = (lines: string[], w: number) =>
  lines.map((l, i) => ({ i, w: visibleWidth(l) })).filter((x) => x.w > w);

test("InputBox: never exceeds width, even when the field is full", () => {
  // pi-tui's Input renders a line padded to the width it is given.
  const fullInput = { render: (w: number) => ["x".repeat(w)], invalidate() {} } as any;
  const box = new InputBox(fullInput, () => ({ busy: false }));
  for (const w of [40, 80, 120, 207]) {
    assert.deepEqual(offenders(box.render(w), w), [], `InputBox overflow at width ${w}`);
  }
});

test("Palette: highlighted rows fit the renderer's width measure", () => {
  const p = new Palette();
  p.set([
    { name: "help", desc: "a fairly long description that could run wide on a narrow pane" },
    { name: "model", desc: "choose a model" },
  ]);
  p.visible = true;
  for (const w of [30, 60, 120]) assert.ok(piFits(p.render(w), w), `Palette overflow at ${w}`);
});

test("Selector: every row fits the renderer width", () => {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id: `anthropic/claude-very-long-model-name-${i}`,
    label: `anthropic/claude-very-long-model-name-${i}`,
  }));
  for (const w of [40, 70, 207]) assert.ok(piFits(new Selector("select model", items).render(w), w), `selector ${w}`);
});

test("Footer + SystemBlock fit the renderer width", () => {
  const f = new Footer(() => ({ model: "anthropic/claude-3-5-haiku", safety: "dry-run", busy: false }));
  for (const w of [40, 80, 207]) assert.ok(piFits(f.render(w), w), `footer ${w}`);
  const s = new SystemBlock(["a long-ish system note that wraps across the available width nicely"], "info");
  for (const w of [24, 60]) assert.ok(piFits(s.render(w), w), `system ${w}`);
});
