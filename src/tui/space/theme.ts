/**
 * NOAH visual language — cinematic "blue & black" (Nolan-grade): deep blacks,
 * cold steel blues, ice-white highlights. Minimal, high-contrast, spacious.
 * Truecolor; degrades to plain text without color.
 */
import { hex, bold, dim as dimStyle } from "../../ui/ansi.js";

export const C = {
  hot: hex("#eaf2ff"), // ice-white highlight (logo crown, emphasis)
  star: hex("#dce8ff"), // bright text
  text: hex("#aebfd9"), // body text (cool grey-blue)
  faint: hex("#62719a"), // secondary
  ghost: hex("#26365c"), // borders / hairlines (deep steel)
  comet: hex("#3b82f6"), // core blue
  plasma: hex("#5b9dff"), // azure accent (primary)
  nebula: hex("#9ec5ff"), // glacier (logo light / secondary)
  pulse: hex("#7fb0ff"),
  good: hex("#57d9a3"),
  warn: hex("#ffce6b"),
  danger: hex("#ff6b81"),
} as const;

export const BG = {
  panel: hex("#0a1020"),
  sel: hex("#13213f"),
} as const;

/** Minimal, modern glyph set. */
export const G = {
  prompt: "›",
  node: "◆",
  nodeOpen: "◇",
  dot: "·",
  arrow: "→",
  check: "✓",
  cross: "✕",
  run: "◐",
  bar: "▏",
  caret: "▸",
} as const;

export const b = bold;
export const d = dimStyle;
