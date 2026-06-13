import type { Component } from "@earendil-works/pi-tui";
import { bold, white, dim, cyan, green, wordWrap, UNICODE } from "../../ui/ansi.js";

const bar = UNICODE ? "│" : "|";
const dot = UNICODE ? "●" : "*";

/** Streams NOAH's response under a "● NOAH" header. */
export class ResponseViewComponent implements Component {
  private text = "";

  append(delta: string): void {
    this.text += delta;
  }

  render(width: number): string[] {
    const header = `${cyan(bold(dot))} ${bold(white("NOAH"))}`;
    const wrapWidth = Math.max(8, width - 2);
    const lines = wordWrap(this.text, wrapWidth).map((l) => `${dim(bar)} ${green(l)}`);
    return [header, ...lines];
  }

  invalidate(): void {}
}
