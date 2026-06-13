/**
 * Box / panel drawing. Styles: round · square · heavy · block.
 * Width is the inner content area; visible length math ignores ANSI codes.
 */
import { gray, padEnd, visibleLen, UNICODE } from "./ansi.js";

export type BoxStyle = "round" | "square" | "heavy" | "block";

export interface BoxOptions {
  title?: string; // already-styled (color) by caller; inserted into top border
  status?: string; // already-styled badge label; right-aligned in top border
  style?: BoxStyle;
  width?: number; // inner content width
  accent?: (s: string) => string; // paints border characters
  indent?: number; // left margin spaces
}

interface Chars {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
}

const STYLES: Record<Exclude<BoxStyle, "block">, Chars> = {
  round: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
  square: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
  heavy: { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" },
};

const ASCII: Chars = { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" };

export function drawBox(body: string[], opts: BoxOptions = {}): string {
  const width = opts.width ?? 64;
  const accent = opts.accent ?? gray;
  const pad = " ".repeat(opts.indent ?? 2);

  if (opts.style === "block") {
    return drawBlock(body, width, accent, pad, opts.title, opts.status);
  }

  const c = UNICODE ? STYLES[(opts.style as Exclude<BoxStyle, "block">) ?? "round"] : ASCII;
  const seg = width + 2; // dashes span between corners

  // Top border with optional title (left) and status (right).
  let titleStr = opts.title ? ` ${opts.title} ` : "";
  let statusStr = opts.status ? ` ${opts.status} ` : "";
  const avail = seg - 2; // room between the lead and trail border dashes
  // Drop the status tag, then the title, if they cannot fit the top border.
  if (visibleLen(titleStr) + visibleLen(statusStr) > avail) statusStr = "";
  if (visibleLen(titleStr) > avail) titleStr = "";
  const used = 1 + visibleLen(titleStr) + visibleLen(statusStr) + 1; // lead + trail h
  const fill = c.h.repeat(Math.max(0, seg - used));
  const top =
    pad +
    accent(c.tl) +
    accent(c.h) +
    titleStr +
    accent(fill) +
    statusStr +
    accent(c.h) +
    accent(c.tr);

  const lines = body.map(
    (line) => pad + accent(c.v) + " " + padEnd(line, width) + " " + accent(c.v),
  );

  const bottom = pad + accent(c.bl) + accent(c.h.repeat(seg)) + accent(c.br);

  return [top, ...lines, bottom].join("\n");
}

function drawBlock(
  body: string[],
  width: number,
  accent: (s: string) => string,
  pad: string,
  title?: string,
  status?: string,
): string {
  const block = UNICODE ? "█" : "#";
  const total = width + 8; // ██ + "  " + width + "  " + ██
  const solid = pad + accent(block.repeat(total));
  const blank = pad + accent(block.repeat(2)) + " ".repeat(width + 4) + accent(block.repeat(2));

  const row = (content: string): string =>
    pad + accent(block.repeat(2)) + "  " + padEnd(content, width) + "  " + accent(block.repeat(2));

  const header: string[] = [];
  if (title) header.push(row(title), blank);
  if (status) header.push(row(status), blank);

  return [solid, blank, ...header, ...body.map(row), blank, solid].join("\n");
}

/** A thin full-width rule for separating sections. */
export function rule(width = 68, indent = 2): string {
  const ch = UNICODE ? "─" : "-";
  return " ".repeat(indent) + gray(ch.repeat(width));
}
