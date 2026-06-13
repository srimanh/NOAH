import type { Component } from "@earendil-works/pi-tui";
import { drawBox } from "../../ui/box.js";
import { bold, white, dim, yellow, truncate, wordWrap, UNICODE } from "../../ui/ansi.js";
import { badgeLabel } from "../../ui/badge.js";
import { clamp } from "./util.js";

/** SAFETY REVIEW — the confirmation centerpiece (heavy box). */
export class SafetyReviewComponent implements Component {
  constructor(
    private command: string,
    private reason: string,
    private toolName: string,
  ) {}

  render(width: number): string[] {
    const inner = clamp(width - 4, 8, 72);
    const intro = wordWrap("NOAH wants to run a state-changing command:", inner).map((l) => white(l));
    const reason = truncate(`reason: ${this.reason}  ${UNICODE ? "·" : "-"}  tool: ${this.toolName}`, inner);
    const body = [
      ...intro,
      "",
      bold(yellow(truncate(this.command || this.toolName, inner))),
      "",
      dim(reason),
    ];
    return drawBox(body, {
      title: bold(yellow("SAFETY REVIEW")),
      status: badgeLabel("warning"),
      style: "heavy",
      accent: yellow,
      width: inner,
      indent: 0,
    }).split("\n");
  }

  invalidate(): void {}
}
