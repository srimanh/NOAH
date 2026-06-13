import type { Component } from "@earendil-works/pi-tui";
import { drawBox } from "../../ui/box.js";
import { bold, white, dim, green, red, fg256, truncate } from "../../ui/ansi.js";
import { badgeLabel, type Status } from "../../ui/badge.js";
import { clamp } from "./util.js";

const orange = fg256(208);

/** Tool execution card. Status and output are mutable for live updates. */
export class ToolCardComponent implements Component {
  constructor(
    private name: string,
    private command: string,
    private status: Status = "running",
    private output: string[] = [],
  ) {}

  setStatus(status: Status): void {
    this.status = status;
  }
  setOutput(output: string[]): void {
    this.output = output;
  }

  render(width: number): string[] {
    const inner = clamp(width - 4, 8, 72);
    const prefix = this.name === "bash" ? dim("$ ") : "";
    const body: string[] = [];
    if (this.command) body.push(prefix + truncate(this.command, inner - 2));
    for (const line of this.output.slice(0, 6)) body.push(dim(truncate(line, inner)));
    if (body.length === 0) body.push(dim("(no output)"));

    const accent = this.status === "success" ? green : this.status === "blocked" ? red : orange;
    return drawBox(body, {
      title: bold(white(`TOOL ${dim("·")} ${this.name}`)),
      status: badgeLabel(this.status),
      style: "round",
      accent,
      width: inner,
      indent: 0,
    }).split("\n");
  }

  invalidate(): void {}
}
