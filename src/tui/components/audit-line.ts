import type { Component } from "@earendil-works/pi-tui";
import { dim, green, red, cyan, truncate, UNICODE } from "../../ui/ansi.js";

/** A single audit-trail line. Degrades gracefully on narrow widths. */
export class AuditLineComponent implements Component {
  constructor(
    private tool: string,
    private command: string,
    private ok: boolean,
  ) {}

  render(width: number): string[] {
    const markCh = this.ok ? (UNICODE ? "✓" : "+") : (UNICODE ? "✗" : "x");
    const mark = this.ok ? green(markCh) : red(markCh);

    // Build progressively in plain units so the line never exceeds `width`.
    let used = 0;
    const out: string[] = [];
    const add = (plain: string, styled: string): void => {
      if (used + plain.length <= width) {
        out.push(styled);
        used += plain.length;
      }
    };
    add("AUDIT ", dim("AUDIT "));
    add(`${markCh} `, `${mark} `);
    if (width >= 50) {
      const ts = new Date().toLocaleTimeString();
      add(`${ts}  `, `${dim(ts)}  `);
    }
    add(`${this.tool.padEnd(6)} `, `${cyan(this.tool.padEnd(6))} `);

    const room = width - used;
    if (room > 1) out.push(dim(truncate(this.command, room)));
    return [out.join("")];
  }

  invalidate(): void {}
}
