/**
 * NOAH space TUI components — cinematic, minimal, blue-on-black.
 * Built on the upstream TUI Component contract; none of its default chrome is used.
 */
import type { Component, Input } from "@earendil-works/pi-tui";
import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";
import { wordWrap, UNICODE } from "../../ui/ansi.js";
import { C, G, b, d } from "./theme.js";
import { renderMarkdown } from "./markdown.js";

/* ----------------------------------------------------------------- helpers */

// Use pi-tui's OWN width measure + truncation so our lines never exceed the
// renderer's width check (which throws otherwise).
const vw = (s: string) => visibleWidth(s);
const truncate = (s: string, w: number) => truncateToWidth(s, Math.max(0, w));
/** Truncate AND pad to exactly `w` visible columns. */
function fit(s: string, w: number): string {
  const t = truncate(s, w);
  const len = vw(t);
  return len < w ? t + " ".repeat(w - len) : t;
}
/** Clamp every line so it can never exceed `w` (defensive against long tokens). */
const clamp = (lines: string[], w: number) => lines.map((l) => (vw(l) > w ? truncate(l, w) : l));

function center(s: string, width: number): string {
  const len = vw(s);
  if (len >= width) return truncate(s, width);
  return " ".repeat(Math.floor((width - len) / 2)) + s;
}
const pad = (s: string, w: number) => fit(s, w);

/* -------------------------------------------------------------- hero logo */

const LOGO = [
  "███╗   ██╗  ██████╗   █████╗  ██╗  ██╗",
  "████╗  ██║ ██╔═══██╗ ██╔══██╗ ██║  ██║",
  "██╔██╗ ██║ ██║   ██║ ███████║ ███████║",
  "██║╚██╗██║ ██║   ██║ ██╔══██║ ██╔══██║",
  "██║ ╚████║ ╚██████╔╝ ██║  ██║ ██║  ██║",
  "╚═╝  ╚═══╝  ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝",
];
const LOGO_W = Math.max(...LOGO.map((l) => [...l].length));
// top-down "key light": ice-white crown fading into deep blue
const TINT = [C.hot, C.star, C.nebula, C.plasma, C.comet, C.comet];

/** The big NOAH wordmark, centered, cinematic gradient. */
export function heroLogo(width: number): string[] {
  if (!UNICODE || width < LOGO_W + 2) {
    return ["", center(b(C.hot("N O A H")), width), ""];
  }
  const lines = LOGO.map((row, i) => center(TINT[i](row), width));
  const glow = center(C.ghost("▔".repeat(Math.min(LOGO_W, width))), width);
  const tag = center(d(C.faint("Native Operating-system Agentic Harness")), width);
  return clamp(["", "", ...lines, glow, "", tag, ""], width);
}

/** Splash shown above the conversation. Tips appear only on a fresh session. */
export class Splash implements Component {
  constructor(private showTips: () => boolean) {}
  render(width: number): string[] {
    const out = heroLogo(width);
    if (this.showTips()) {
      const tips = [
        "Ask NOAH to install software, manage services, or inspect your system.",
        "Destructive actions ask first — every action is logged.",
        "Type / for commands · just describe what you want.",
      ];
      out.push("");
      for (const t of tips) out.push(`   ${C.comet(G.nodeOpen)}  ${C.text(truncate(t, Math.max(10, width - 7)))}`);
      out.push("");
    }
    return out;
  }
  invalidate(): void {}
}

/* --------------------------------------------------------------- chat blocks */

export class UserBlock implements Component {
  constructor(private text: string) {}
  render(width: number): string[] {
    const w = Math.max(10, width - 6);
    const body = wordWrap(this.text, w);
    return clamp(
      ["", ` ${C.plasma(G.prompt)}  ${b(C.star(body[0] ?? ""))}`, ...body.slice(1).map((l) => `    ${C.star(l)}`)],
      width,
    );
  }
  invalidate(): void {}
}

export class AssistantBlock implements Component {
  private text = "";
  append(delta: string): void {
    this.text += delta;
  }
  get value(): string {
    return this.text;
  }
  render(width: number): string[] {
    const w = Math.max(10, width - 6);
    // renderMarkdown already applies inline styles; keep lines as-is to avoid
    // ANSI reset bleed from an outer color wrap.
    const body = renderMarkdown(this.text || "…", w);
    return clamp(["", ` ${C.comet(G.node)}  ${b(C.nebula("NOAH"))}`, ...body.map((l) => `    ${l}`)], width);
  }
  invalidate(): void {}
}

export type ToolState = "running" | "ok" | "err";

export class ToolBlock implements Component {
  constructor(
    private name: string,
    private arg: string,
    private state: ToolState = "running",
  ) {}
  set(state: ToolState): void {
    this.state = state;
  }
  render(width: number): string[] {
    const glyph =
      this.state === "running" ? C.plasma(G.run) : this.state === "ok" ? C.good(G.check) : C.danger(G.cross);
    const arg = this.arg ? " " + C.text(truncate(this.arg, Math.max(8, width - this.name.length - 14))) : "";
    const tag =
      this.state === "running"
        ? d(C.faint(" · running"))
        : this.state === "ok"
          ? d(C.good(" · done"))
          : d(C.danger(" · failed"));
    return clamp([`    ${glyph} ${C.plasma(this.name)}${arg}${tag}`], width);
  }
  invalidate(): void {}
}

export class SystemBlock implements Component {
  constructor(
    private lines: string[],
    private kind: "info" | "warn" | "danger" = "info",
  ) {}
  render(width: number): string[] {
    const accent = this.kind === "danger" ? C.danger : this.kind === "warn" ? C.warn : C.comet;
    const w = Math.max(10, width - 6);
    const out: string[] = [""];
    for (const raw of this.lines) for (const l of wordWrap(raw, w)) out.push(`    ${accent(G.bar)} ${C.text(l)}`);
    return clamp(out, width);
  }
  invalidate(): void {}
}

/* ------------------------------------------------------------------ input box */

/** Rounded, cinematic input box framing pi-tui's Input (keeps the cursor marker). */
export class InputBox implements Component {
  focused = false;
  constructor(
    private input: Input,
    private getState: () => { busy: boolean },
  ) {}
  render(width: number): string[] {
    const inner = Math.max(8, width - 3); // interior between the rounded borders
    const textW = inner - 4; // ' ' glyph ' ' <text> ' '
    const busy = this.getState().busy;
    const accent = busy ? C.faint : C.comet;
    const top = ` ${accent("╭" + "─".repeat(inner) + "╮")}`;
    const bot = ` ${accent("╰" + "─".repeat(inner) + "╯")}`;
    const glyph = busy ? C.faint(G.run) : C.plasma(G.prompt);
    const line = this.input.render(textW)[0] ?? "";
    const mid = ` ${accent("│")} ${glyph} ${fit(line, textW)} ${accent("│")}`;
    return clamp([top, mid, bot], width);
  }
  invalidate(): void {
    this.input.invalidate();
  }
}

/* --------------------------------------------------------------------- footer */

export class Footer implements Component {
  // Note: the model is shown in the usage bar; the footer shows safety + hints only.
  constructor(private get: () => { safety: string; busy: boolean; caveman?: string }) {}
  render(width: number): string[] {
    const s = this.get();
    const cave = s.caveman && s.caveman !== "off" ? `  ${C.ghost(G.dot)}  ${C.nebula("caveman:" + s.caveman)}` : "";
    const left = `  ${C.comet(G.node)} ${C.faint("safety")} ${
      s.safety === "dry-run" ? C.warn(s.safety) : C.good(s.safety)
    }${cave}`;
    const right = s.busy
      ? `${d(C.faint("esc interrupt"))} `
      : `${d(C.faint("/ commands"))}  ${C.ghost(G.dot)}  ${d(C.faint("enter send"))} `;
    const gap = Math.max(1, width - vw(left) - vw(right));
    return [fit(left + " ".repeat(gap) + right, width)];
  }
  invalidate(): void {}
}

/* -------------------------------------------------------------------- palette */

export interface PaletteItem {
  name: string;
  desc: string;
}

export class Palette implements Component {
  visible = false;
  private items: PaletteItem[] = [];
  private selected = 0;
  set(items: PaletteItem[]): void {
    this.items = items;
    if (this.selected >= items.length) this.selected = Math.max(0, items.length - 1);
  }
  move(delta: number): void {
    if (this.items.length) this.selected = (this.selected + delta + this.items.length) % this.items.length;
  }
  current(): PaletteItem | undefined {
    return this.items[this.selected];
  }
  render(width: number): string[] {
    if (!this.visible || !this.items.length) return [];
    const rows = this.items.map((it, i) => {
      const on = i === this.selected;
      const mark = on ? C.plasma(G.caret) : " ";
      const name = (on ? (s: string) => b(C.star(s)) : C.plasma)(`/${it.name}`.padEnd(10));
      const row = `  ${mark} ${name} ${d(C.faint(it.desc))}`;
      return on ? hi(row, width) : truncate(row, width);
    });
    return clamp(["", ...rows], width);
  }
  invalidate(): void {}
}

/* ------------------------------------------------------------- model selector */

import { bgHex } from "../../ui/ansi.js";
const selBg = bgHex("#13213f");
function hi(s: string, width: number): string {
  return selBg(pad(truncate(s, width), width));
}

export interface SelectItem {
  id: string;
  label: string;
  hint?: string;
}

/** Generic arrow-navigable dropdown shown in place of the input box (model, login, …). */
export class Selector implements Component {
  private selected = 0;
  private top = 0;
  private readonly window = 10;
  constructor(
    private title: string,
    private items: SelectItem[],
  ) {}
  move(delta: number): void {
    if (!this.items.length) return;
    this.selected = Math.min(this.items.length - 1, Math.max(0, this.selected + delta));
    if (this.selected < this.top) this.top = this.selected;
    if (this.selected >= this.top + this.window) this.top = this.selected - this.window + 1;
  }
  current(): SelectItem | undefined {
    return this.items[this.selected];
  }
  render(width: number): string[] {
    const w = Math.min(width, Math.max(24, width)) - 2;
    const t = this.title.toUpperCase();
    const head = ` ${C.comet("╭")} ${b(C.nebula(t))} ${C.comet("─".repeat(Math.max(0, w - t.length - 4)))}${C.comet("╮")}`;
    const foot = ` ${C.comet("╰")} ${d(C.faint("↑↓ move  ·  enter select  ·  esc cancel"))} ${C.comet(
      "─".repeat(Math.max(0, w - 42)),
    )}${C.comet("╯")}`;
    const slice = this.items.slice(this.top, this.top + this.window);
    const rows = slice.map((m, i) => {
      const idx = this.top + i;
      const on = idx === this.selected;
      const mark = on ? C.plasma(G.caret) : " ";
      const label = (on ? (s: string) => b(C.star(s)) : C.text)(m.label);
      const hint = m.hint ? `  ${d(C.faint(m.hint))}` : "";
      const inner = ` ${mark} ${label}${hint}`;
      const body = on ? hi(inner, w - 2) : pad(truncate(inner, w - 2), w - 2);
      return ` ${C.comet("│")}${body}${C.comet("│")}`;
    });
    return clamp([head, ...rows, foot], width);
  }
  invalidate(): void {}
}
