import { test } from "node:test";
import assert from "node:assert/strict";
import { HeaderComponent } from "./header.js";
import { visibleLen } from "../../ui/ansi.js";

test("HeaderComponent: renders ASCII logo + tagline on wide terminals", () => {
  const lines = new HeaderComponent().render(80);
  const joined = lines.join("\n");
  assert.match(joined, /█/, "shows block-letter logo");
  assert.match(joined, /Native Operating-system Agentic Harness/);
  for (const l of lines) assert.ok(visibleLen(l) <= 80, "fits width");
});

test("HeaderComponent: compact wordmark fallback on narrow terminals", () => {
  const lines = new HeaderComponent().render(20);
  const joined = lines.join("\n");
  assert.match(joined, /NOAH/);
  assert.doesNotMatch(joined, /█/, "no big logo when too narrow");
  for (const l of lines) assert.ok(visibleLen(l) <= 20, "fits width");
});
