/**
 * Terminal confirmation — the SAFETY REVIEW centerpiece.
 * Own readline (ctx.ui.confirm is a no-op in non-TUI CLI).
 */
import { createInterface } from "node:readline";
import * as ui from "../ui/render.js";

export interface ConfirmRequest {
  toolName: string;
  command: string;
  reason: string;
}

export async function confirmInTerminal(req: ConfirmRequest): Promise<boolean> {
  process.stdout.write("\n" + ui.safetyReview(req.command, req.reason, req.toolName) + "\n");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(ui.approvePrompt(), (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}
