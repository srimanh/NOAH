import type { Component } from "@earendil-works/pi-tui";
import { bold, white, dim, gray, truncate, fg256, UNICODE } from "../../ui/ansi.js";
import { clamp } from "./util.js";

/** NOAH wordmark in ANSI Shadow block letters. */
const LOGO = [
  "███╗   ██╗ ██████╗  █████╗ ██╗  ██╗",
  "████╗  ██║██╔═══██╗██╔══██╗██║  ██║",
  "██╔██╗ ██║██║   ██║███████║███████║",
  "██║╚██╗██║██║   ██║██╔══██║██╔══██║",
  "██║ ╚████║╚██████╔╝██║  ██║██║  ██║",
  "╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝",
];

/** Dark→light blue gradient (256-color) applied per logo row for depth. */
const GRADIENT = [19, 20, 26, 27, 33, 39];

const LOGO_WIDTH = Math.max(...LOGO.map((l) => [...l].length));
const TAGLINE = "Native Operating-system Agentic Harness";

/**
 * NOAH header — ASCII-art logo (dark-blue gradient) plus tagline.
 * Falls back to a compact wordmark on narrow terminals or when Unicode is off.
 */
export class HeaderComponent implements Component {
  render(width: number): string[] {
    if (!UNICODE || width < LOGO_WIDTH) {
      const title = `${bold(fg256(39)("NOAH"))}  ${dim(TAGLINE)}`;
      const rule = gray((UNICODE ? "─" : "-").repeat(clamp(width, 10, 68)));
      return [truncate(title, width), rule];
    }

    const lines = LOGO.map((row, i) => fg256(GRADIENT[i])(row));
    const tagline = `${bold(fg256(45)("›"))} ${dim(white(TAGLINE))}`;
    const rule = fg256(24)((UNICODE ? "─" : "-").repeat(clamp(width, 10, 72)));
    return ["", ...lines, "", truncate(tagline, width), rule];
  }

  invalidate(): void {}
}
