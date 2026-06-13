/**
 * Caveman mode — token saver.
 *
 * Faithful port of the `pi-caveman` extension's prompt strategy: append terse
 * output rules via the `before_agent_start` hook so the model keeps full
 * technical accuracy while cutting ~75% of output tokens. NOAH ships it inbuilt.
 *
 * Levels: off · lite · full · ultra · micro.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const CAVEMAN_LEVELS = ["lite", "full", "ultra", "micro"] as const;
export type CavemanLevel = (typeof CAVEMAN_LEVELS)[number] | "off";

export function isCavemanLevel(s: string): s is CavemanLevel {
  return s === "off" || (CAVEMAN_LEVELS as readonly string[]).includes(s);
}

const BASE = `IMPORTANT: You are in CAVEMAN MODE. Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:
- Drop articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries, hedging
- Fragments OK. Short synonyms preferred. Technical terms exact
- Code blocks unchanged. Errors quoted exact
- Pattern: [thing] [action] [reason]. [next step].`;

const SAFETY = `Auto-clarity: drop caveman for security warnings, irreversible action confirmations, or when the user is confused. Resume after.
Boundaries: only compress explanations, never code. "stop caveman" or "normal mode" reverts.`;

const INTENSITY: Record<Exclude<CavemanLevel, "off" | "micro">, string> = {
  lite: `No filler/hedging. Keep articles + full sentences. Professional but tight.`,
  full: `Drop articles, fragments OK, short synonyms.`,
  ultra: `Abbreviate (DB/auth/config/req/res/fn/impl), strip conjunctions, arrows for causality (X → Y).`,
};

const MICRO = `# Token efficiency
Respond like smart caveman. Cut all filler, keep technical substance.
- Drop articles (a, an, the), filler (just, really, basically, actually).
- Drop pleasantries. No hedging. Fragments fine. Short synonyms.
- Technical terms exact. Code blocks unchanged.
- Pattern: [thing] [action] [reason]. [next step].`;

/** The system-prompt fragment for a level ("" when off). */
export function cavemanInstruction(level: CavemanLevel): string {
  if (level === "off") return "";
  if (level === "micro") return MICRO;
  return `${BASE}\n\n${INTENSITY[level]}\n\n${SAFETY}`;
}

/**
 * Extension that appends the caveman rules to each run's system prompt.
 * `getLevel` is read at agent-start time so the level can be toggled live.
 */
export const cavemanExtension =
  (getLevel: () => CavemanLevel) =>
  (pi: ExtensionAPI): void => {
    pi.on("before_agent_start", (event) => {
      const frag = cavemanInstruction(getLevel());
      if (!frag) return undefined;
      return { systemPrompt: `${event.systemPrompt}\n\n${frag}` };
    });
  };
