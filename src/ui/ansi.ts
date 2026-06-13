/**
 * ANSI primitives — TTY + NO_COLOR aware. Zero dependencies.
 *
 * When stdout is not a TTY (piped, smoke test) or NO_COLOR is set, colors and
 * heavy box characters degrade gracefully so plain-text assertions still match.
 */

const noColorEnv = "NO_COLOR" in process.env && process.env.NO_COLOR !== "";
export const COLOR = process.stdout.isTTY === true && !noColorEnv;
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

/** Visible length, ignoring ANSI escape sequences. */
export function visibleLen(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
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
