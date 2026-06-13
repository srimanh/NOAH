/**
 * Safety extension — wires the gate + audit into Pi's tool pipeline.
 *
 * pi.on("tool_call")   → fires BEFORE execution. Returns { block } to deny.
 * pi.on("tool_result") → fires AFTER execution. Appends to the audit log.
 *
 * Because the gate sits in the agent pipeline (not inside any tool), no tool
 * can run without passing through it. That is the unbypassable safety guarantee.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { classify } from "./policy.js";
import { confirmInTerminal, denyBanner } from "./confirm.js";
import { appendAudit } from "./audit.js";

export interface SafetyOptions {
  dryRun: boolean;
  autoYes: boolean;
}

function commandOf(input: unknown): string {
  if (input && typeof input === "object" && "command" in input) {
    return String((input as { command: unknown }).command ?? "");
  }
  return "";
}

export const safetyExtension =
  (opts: SafetyOptions) =>
  (pi: ExtensionAPI): void => {
    pi.on("tool_call", async (event) => {
      const command = commandOf(event.input);
      const verdict = classify(event.toolName, event.input);

      // 1) Catastrophic → hard block, no override.
      if (verdict.action === "deny") {
        denyBanner(command || event.toolName, verdict.reason);
        return { block: true, reason: verdict.reason };
      }

      // 2) Dry-run → neutralise side effects, let the plan run visibly.
      if (opts.dryRun) {
        if (event.toolName === "bash" && command) {
          const safe = command.replace(/"/g, '\\"');
          (event.input as { command: string }).command = `echo "[DRY-RUN] would run: ${safe}"`;
        }
        return undefined; // allowed (neutralised)
      }

      // 3) Dangerous → require explicit confirmation.
      if (verdict.action === "confirm" && !opts.autoYes) {
        const ok = await confirmInTerminal({
          toolName: event.toolName,
          command,
          reason: verdict.reason,
        });
        if (!ok) return { block: true, reason: "user declined" };
      }

      return undefined; // allow
    });

    pi.on("tool_result", (event) => {
      appendAudit({
        ts: new Date().toISOString(),
        tool: event.toolName,
        input: event.input,
        ok: !event.isError,
      });
    });
  };
