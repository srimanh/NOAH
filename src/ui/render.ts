/**
 * NOAH panels — the high-level rendering API the app calls.
 * Pure string builders (easy to preview); session wiring prints them.
 */
import { bold, dim, white, red, yellow, gray, cyan, green, fg256, truncate, wordWrap, UNICODE } from "./ansi.js";
import { drawBox, rule } from "./box.js";
import { badge, badgeLabel, type Status } from "./badge.js";

const WIDTH = 64;
const orange = fg256(208);
const bar = UNICODE ? "│" : "|";
const dot = UNICODE ? "●" : "*";

/** Clean NOAH wordmark — no emoji. */
export function brand(): string {
  const mark = bold(white("NOAH"));
  const sub = dim("Native Operating-system Agentic Harness");
  return `\n  ${mark}  ${sub}\n  ${gray((UNICODE ? "─" : "-").repeat(68))}\n`;
}

/** The user's request. */
export function requestPanel(text: string): string {
  return (
    "\n" +
    drawBox([truncate(text, WIDTH)], {
      title: bold(cyan("REQUEST")),
      style: "round",
      accent: cyan,
      width: WIDTH,
    })
  );
}

/** Section header with a status badge (used for PLAN / RESULT streams). */
export function sectionHeader(label: string, status: Status): string {
  return `\n  ${badge(status)}  ${dim(label)}`;
}

/** A text block under a left bar (Pi-style), word-wrapped to panel width. */
export function barLines(text: string, paint: (s: string) => string = dim): string {
  return wordWrap(text, WIDTH)
    .map((l) => `  ${dim(bar)} ${paint(l)}`)
    .join("\n");
}

/** The interactive approval prompt line (printed after SAFETY REVIEW). */
export function approvePrompt(): string {
  return `  ${bold(yellow("Approve?"))} ${dim("[y/N]")} `;
}

/** Tool execution card. */
export function toolCard(
  name: string,
  command: string,
  status: Status,
  output?: string[],
): string {
  const body: string[] = [];
  if (command) body.push(dim("$ ") + truncate(command, WIDTH - 2));
  if (output && output.length) {
    for (const line of output.slice(0, 6)) body.push(dim(truncate(line, WIDTH)));
  }
  if (body.length === 0) body.push(dim("(no output)"));
  const accent = status === "success" ? green : status === "blocked" ? red : orange;
  return (
    "\n" +
    drawBox(body, {
      title: bold(white(`TOOL ${dim("·")} ${name}`)),
      status: badgeLabel(status),
      style: "round",
      accent,
      width: WIDTH,
    })
  );
}

/** SAFETY REVIEW — the confirmation centerpiece (heavy box). */
export function safetyReview(command: string, reason: string, toolName: string): string {
  const body = [
    white("NOAH wants to run a state-changing command:"),
    "",
    bold(yellow(truncate(command || toolName, WIDTH))),
    "",
    dim(`reason: ${reason}  ${UNICODE ? "·" : "-"}  tool: ${toolName}`),
  ];
  return (
    "\n" +
    drawBox(body, {
      title: bold(yellow("SAFETY REVIEW")),
      status: badgeLabel("warning"),
      style: "heavy",
      accent: yellow,
      width: WIDTH,
    })
  );
}

/** SAFETY BLOCK — the catastrophic-deny centerpiece (block panel). */
export function safetyBlock(command: string, reason: string): string {
  const shield = UNICODE ? "⛔  " : "[X] ";
  const cleanReason = reason.replace(/^blocked:\s*/i, "");
  const body = [
    bold(white(truncate(command, WIDTH))),
    "",
    bold(white(`BLOCKED ${UNICODE ? "—" : "-"} ${cleanReason}`)),
    white("Catastrophic. Cannot be overridden."),
  ];
  return (
    "\n" +
    drawBox(body, {
      title: bold(white(`${shield}SAFETY BLOCK`)),
      style: "block",
      accent: red,
      width: WIDTH,
    })
  );
}

/** A single audit-trail line. */
export function auditLine(tool: string, command: string, ok: boolean): string {
  const mark = ok ? green(UNICODE ? "✓" : "+") : red(UNICODE ? "✗" : "x");
  const ts = dim(new Date().toLocaleTimeString());
  return `  ${dim("AUDIT")} ${mark} ${ts}  ${cyan(tool.padEnd(6))} ${dim(truncate(command, WIDTH))}`;
}

/** Final result panel. */
export function resultPanel(text: string): string {
  return (
    "\n" +
    rule() +
    "\n  " +
    badge("success") +
    "\n" +
    barLines(text, (s) => green(s)) +
    "\n"
  );
}

/** Inline gate verdict for `--check` (allow / confirm). */
export function checkVerdict(command: string, action: "allow" | "confirm", reason: string): string {
  const status: Status = action;
  const note =
    action === "confirm"
      ? "\n  " + dim("NOAH would ask for your approval before running this.")
      : "";
  return `\n  ${badge(status)}  ${white(truncate(command, WIDTH))}\n  ${dim(`${UNICODE ? "→" : "->"} ${reason}`)}${note}`;
}

/** Small status note line. */
export function note(text: string, status: Status = "info"): string {
  return `  ${badge(status)}  ${dim(text)}`;
}

export { dot };
