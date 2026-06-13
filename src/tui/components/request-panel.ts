import type { Component } from "@earendil-works/pi-tui";
import { drawBox } from "../../ui/box.js";
import { bold, cyan, truncate } from "../../ui/ansi.js";

/**
 * REQUEST panel as a pi-tui Component. Responsive: the inner width is derived
 * from the viewport so every rendered line fits within `width`.
 */
export class RequestPanelComponent implements Component {
  constructor(private text: string) {}

  render(width: number): string[] {
    const inner = Math.max(8, Math.min(72, width - 4));
    return drawBox([truncate(this.text, inner)], {
      title: bold(cyan("REQUEST")),
      style: "round",
      accent: cyan,
      width: inner,
      indent: 0,
    }).split("\n");
  }

  invalidate(): void {}
}
