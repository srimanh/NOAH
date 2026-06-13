/**
 * Minimal, wrap-safe Markdown → terminal renderer for assistant responses.
 *
 * Goal: no visible markdown artifacts. Bold/italic/code/headings/lists render as
 * clean styled terminal text, width-constrained. Inline styles are applied
 * per-word so they survive word-wrapping (each token is self-contained ANSI).
 */
import { bold, italic, wordWrap } from "../../ui/ansi.js";
import { C, G, d } from "./theme.js";

/** Apply a style to each whitespace-delimited word so wrapping stays clean. */
function styleWords(text: string, style: (s: string) => string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) || part === "" ? part : style(part)))
    .join("");
}

/** Process inline markdown within a single logical line. Order matters. */
function inline(s: string): string {
  // links [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  // bold **x** / __x__
  s = s.replace(/(\*\*|__)(.+?)\1/g, (_m, _w, t) => styleWords(t, (w) => bold(C.star(w))));
  // inline code `x`
  s = s.replace(/`([^`]+)`/g, (_m, t) => styleWords(t, (w) => C.plasma(w)));
  // italic *x* / _x_  (single markers, after bold consumed the doubles)
  s = s.replace(/(^|[^*_\w])([*_])(?!\s)([^*_]+?)\2(?=[^*_\w]|$)/g, (_m, pre, _mk, t) => pre + styleWords(t, italic));
  return s;
}

const HR = "─";

export function renderMarkdown(text: string, width: number): string[] {
  const w = Math.max(8, width);
  const out: string[] = [];
  let inCode = false;

  for (const raw of (text ?? "").split("\n")) {
    const line = raw.replace(/\r$/, "");

    // fenced code block toggle
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      // verbatim, dimmed; hard-wrap to width
      for (let i = 0; i < line.length || i === 0; i += w) out.push(d(C.faint(line.slice(i, i + w))) || "");
      continue;
    }

    // blank line
    if (line.trim() === "") {
      out.push("");
      continue;
    }
    // horizontal rule
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push(C.ghost(HR.repeat(Math.min(w, 40))));
      continue;
    }
    // heading
    const h = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (h) {
      for (const l of wordWrap(inline(h[2]), w)) out.push(bold(C.nebula(l)));
      continue;
    }
    // blockquote
    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) {
      for (const l of wordWrap(inline(q[1]), Math.max(4, w - 2))) out.push(`${C.ghost(G.bar)} ${d(C.text(l))}`);
      continue;
    }
    // bullet list
    const b = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (b) {
      const indent = b[1] ?? "";
      const wrapped = wordWrap(inline(b[2]), Math.max(4, w - indent.length - 2));
      wrapped.forEach((l, i) => out.push(`${indent}${i === 0 ? C.plasma("•") + " " : "  "}${l}`));
      continue;
    }
    // numbered list
    const n = line.match(/^(\s*)(\d+\.)\s+(.*)$/);
    if (n) {
      const lead = `${n[1]}${C.plasma(n[2])} `;
      const wrapped = wordWrap(inline(n[3]), Math.max(4, w - (n[1].length + n[2].length + 1)));
      wrapped.forEach((l, i) => out.push(`${i === 0 ? lead : " ".repeat(n[1].length + n[2].length + 1)}${l}`));
      continue;
    }

    // paragraph
    for (const l of wordWrap(inline(line), w)) out.push(l);
  }

  return out;
}
