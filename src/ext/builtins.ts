/**
 * Built-in NOAH extensions — provider-identity shims (ported from pi's
 * anthropic-subscription-fix / github-copilot-fix). They run on
 * `before_agent_start` and strip any leaked upstream "coding agent" identity so
 * subscription auth (Claude Pro/Max, GitHub Copilot) sees a clean NOAH prompt.
 */
import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";

/** Phrases that must never leak into NOAH's system prompt. */
const PI_LEAKS: [RegExp, string][] = [
  [/operating inside pi, a coding agent harness\.\s*/i, ""],
  [/\binside pi\b/gi, "in NOAH"],
  [/a coding agent harness/gi, "an OS agent"],
];

/** Remove leaked upstream identity from a system prompt (idempotent). */
export function stripPiIdentity(prompt: string): string {
  let out = prompt;
  for (const [re, rep] of PI_LEAKS) out = out.replace(re, rep);
  return out;
}

function identityFix(provider: string) {
  return (pi: ExtensionAPI): void => {
    pi.on("before_agent_start", (event, ctx) => {
      if ((ctx as { model?: { provider?: string } })?.model?.provider !== provider) return undefined;
      const cleaned = stripPiIdentity(event.systemPrompt);
      return cleaned === event.systemPrompt ? undefined : { systemPrompt: cleaned };
    });
  };
}

export const anthropicSubscriptionFix: ExtensionFactory = identityFix("anthropic");
export const githubCopilotFix: ExtensionFactory = identityFix("github-copilot");

export interface BuiltinExtension {
  name: string;
  factory: ExtensionFactory;
}

export const BUILTIN_EXTENSIONS: BuiltinExtension[] = [
  { name: "anthropic-subscription-fix", factory: anthropicSubscriptionFix },
  { name: "github-copilot-fix", factory: githubCopilotFix },
];
