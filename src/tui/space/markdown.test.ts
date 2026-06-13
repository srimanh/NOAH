import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "./markdown.js";
import { visibleLen, stripAnsi } from "../../ui/ansi.js";

const plain = (lines: string[]) => stripAnsi(lines.join("\n"));

test("renderMarkdown: strips bold/italic markers, keeps text", () => {
  const t = plain(renderMarkdown("This is **bold** and *italic* text", 80));
  assert.match(t, /bold/);
  assert.match(t, /italic/);
  assert.doesNotMatch(t, /\*\*|\*italic\*/);
});

test("renderMarkdown: headings lose the # markers", () => {
  const t = plain(renderMarkdown("# Title\n## Sub", 80));
  assert.match(t, /Title/);
  assert.match(t, /Sub/);
  assert.doesNotMatch(t, /^#/m);
});

test("renderMarkdown: bullet + numbered lists", () => {
  const t = plain(renderMarkdown("- one\n* two\n1. three", 80));
  assert.match(t, /[•·-]\s*one/);
  assert.match(t, /two/);
  assert.match(t, /1\.\s*three/);
});

test("renderMarkdown: inline code and fenced code blocks lose backticks", () => {
  const t = plain(renderMarkdown("run `npm test` now\n```sh\ndocker run hello\n```", 80));
  assert.match(t, /npm test/);
  assert.match(t, /docker run hello/);
  assert.doesNotMatch(t, /`/);
  assert.doesNotMatch(t, /```/);
});

test("renderMarkdown: links render as text", () => {
  const t = plain(renderMarkdown("see [the docs](https://pi.dev/x) please", 80));
  assert.match(t, /the docs/);
  assert.doesNotMatch(t, /\]\(/);
});

test("renderMarkdown: wraps to width and never exceeds it", () => {
  const long = "word ".repeat(60).trim();
  for (const w of [20, 40, 80]) {
    const lines = renderMarkdown(`**${long}**`, w);
    for (const l of lines) assert.ok(visibleLen(l) <= w, `width ${w}: ${visibleLen(l)}`);
  }
});

test("renderMarkdown: code block content is preserved verbatim (not inline-processed)", () => {
  const t = plain(renderMarkdown("```\na = b * c   # not italic\n```", 80));
  assert.match(t, /a = b \* c/);
});
