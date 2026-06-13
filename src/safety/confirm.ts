/**
 * Terminal confirmation — own readline (ctx.ui.confirm is a no-op in non-TUI CLI).
 */
import { createInterface } from "node:readline";

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

export interface ConfirmRequest {
  toolName: string;
  command: string;
  reason: string;
}

export async function confirmInTerminal(req: ConfirmRequest): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const cmd = req.command || `${req.toolName} call`;
  process.stdout.write(
    `\n${YELLOW}${BOLD}⚠️  NOAH wants to run a ${req.reason}:${RESET}\n` +
      `   ${BOLD}${cmd}${RESET}\n` +
      `${DIM}   tool: ${req.toolName}${RESET}\n`,
  );
  return new Promise((resolve) => {
    rl.question(`${YELLOW}   Approve? [y/N] ${RESET}`, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

export function denyBanner(command: string, reason: string): void {
  process.stdout.write(
    `\n${RED}${BOLD}⛔ BLOCKED${RESET} ${RED}— ${reason}${RESET}\n` +
      `${DIM}   refused command: ${command}${RESET}\n` +
      `${RED}   This action is catastrophic and cannot be overridden.${RESET}\n`,
  );
}
