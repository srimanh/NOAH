/**
 * ANSI primitives — TTY + NO_COLOR aware. Zero dependencies.
 *
 * When stdout is not a TTY (piped, smoke test) or NO_COLOR is set, colors and
 * heavy box characters degrade gracefully so plain-text assertions still match.
 */

const noColorEnv = "NO_COLOR" in process.env && process.env.NO_COLOR !== "";
const forceColor = process.env.NOAH_COLOR === "1";
export const COLOR = forceColor || (process.stdout.isTTY === true && !noColorEnv);
export const UNICODE = process.env.NOAH_ASCII !== "1";

function wrap(open: number, close: number) {
  return (s: string): string => (COLOR ? `\x1b[${open}m${s}\x1b[${close}m` : s);
}

// Styles
export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const underline = wrap(4, 24);

// Foreground colors (256-color where useful, with basic fallback semantics)
export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const magenta = wrap(35, 39);
export const cyan = wrap(36, 39);
export const gray = wrap(90, 39);
export const white = wrap(97, 39);

// 256-color helpers for richer accents
export function fg256(code: number) {
  return (s: string): string => (COLOR ? `\x1b[38;5;${code}m${s}\x1b[39m` : s);
}
export function bg256(code: number) {
  return (s: string): string => (COLOR ? `\x1b[48;5;${code}m${s}\x1b[49m` : s);
}

/** Truecolor foreground (24-bit). Falls back to plain text without color. */
export function rgb(r: number, g: number, b: number) {
  return (s: string): string => (COLOR ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m` : s);
}
/** Truecolor background (24-bit). */
export function bgRgb(r: number, g: number, b: number) {
  return (s: string): string => (COLOR ? `\x1b[48;2;${r};${g};${b}m${s}\x1b[49m` : s);
}
/** Parse "#rrggbb" → truecolor foreground fn. */
export function hex(color: string) {
  const n = parseInt(color.replace(/^#/, ""), 16);
  return rgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
}
export function bgHex(color: string) {
  const n = parseInt(color.replace(/^#/, ""), 16);
  return bgRgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

// eslint-disable-next-line no-control-regex
const ESC_SEQ = /\x1b\[[0-9;]*m|\x1b[_\]][^\x07]*\x07/g;

/** Strip SGR colors and OSC/APC sequences (incl. pi-tui's CURSOR_MARKER). */
export function stripAnsi(s: string): string {
  return s.replace(ESC_SEQ, "");
}

/** Visible length, ignoring color + control sequences (cursor marker is zero-width). */
export function visibleLen(s: string): number {
  return stripAnsi(s).length;
}

/** Pad a string to width based on visible length. */
export function padEnd(s: string, width: number): string {
  const len = visibleLen(s);
  return len >= width ? s : s + " ".repeat(width - len);
}

/** Truncate to width (visible), appending an ellipsis when cut. */
export function truncate(s: string, width: number): string {
  if (visibleLen(s) <= width) return s;
  const ell = UNICODE ? "…" : "...";
  return s.slice(0, Math.max(0, width - ell.length)) + ell;
}

/** Word-wrap plain text to a visible width (no ANSI inside expected). */
export function wordWrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if (line && visibleLen(line) + 1 + visibleLen(word) > width) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    out.push(line);
  }
  return out;
}
