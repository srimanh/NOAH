import type { Component } from "@earendil-works/pi-tui";
import { drawBox } from "../../ui/box.js";
import { bold, white, red, truncate, UNICODE } from "../../ui/ansi.js";
import { clamp } from "./util.js";

/** SAFETY BLOCK — the catastrophic-deny centerpiece (block panel). */
export class SafetyBlockComponent implements Component {
  constructor(
    private command: string,
    private reason: string,
  ) {}

  render(width: number): string[] {
    const inner = clamp(width - 8, 8, 64);
    const shield = UNICODE ? "⛔  " : "[X] ";
    const cleanReason = this.reason.replace(/^blocked:\s*/i, "");
    const body = [
      bold(white(truncate(this.command, inner))),
      "",
      bold(white(truncate(`BLOCKED ${UNICODE ? "—" : "-"} ${cleanReason}`, inner))),
      white(truncate("Catastrophic. Cannot be overridden.", inner)),
    ];
    return drawBox(body, {
      title: bold(white(`${shield}SAFETY BLOCK`)),
      style: "block",
      accent: red,
      width: inner,
      indent: 0,
    }).split("\n");
  }

  invalidate(): void {}
}
