import type { Component } from "@earendil-works/pi-tui";
import { bold, white, dim, gray, truncate, UNICODE } from "../../ui/ansi.js";
import { clamp } from "./util.js";

/** Clean NOAH wordmark header — no emoji. */
export class HeaderComponent implements Component {
  render(width: number): string[] {
    const title = `${bold(white("NOAH"))}  ${dim("Native Operating-system Agentic Harness")}`;
    const rule = gray((UNICODE ? "─" : "-").repeat(clamp(width, 10, 68)));
    return [truncate(title, width), rule];
  }
  invalidate(): void {}
}
