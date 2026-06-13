import type { Component } from "@earendil-works/pi-tui";
import { bold, dim, italic, gray, fg256, wordWrap, UNICODE } from "../../ui/ansi.js";

const purple = fg256(141);
const bar = UNICODE ? "│" : "|";
const dot = UNICODE ? "◐" : "*";

/** Streams the model's reasoning under a dim "● THINKING" header. */
export class ThinkingViewComponent implements Component {
  private text = "";
  private done = false;

  append(delta: string): void {
    this.text += delta;
  }
  finish(): void {
    this.done = true;
  }

  render(width: number): string[] {
    const header = `${purple(bold(dot))} ${dim("THINKING")}`;
    const wrapWidth = Math.max(8, width - 2);
    const lines = wordWrap(this.text, wrapWidth).map((l) => `${gray(bar)} ${dim(italic(l))}`);
    return [header, ...lines];
  }

  invalidate(): void {}
}
