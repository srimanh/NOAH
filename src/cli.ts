#!/usr/bin/env node
/**
 * NOAH CLI — `noah "<natural language task>"`
 *
 * Flags:
 *   --dry-run   preview steps without executing (neutralises side effects)
 *   --yes, -y   auto-approve confirmations (non-interactive demo / scripts)
 *   --log       print the audit log and exit
 *   --help, -h  usage
 */
import { runNoah } from "./session.js";
import { printAuditLog } from "./safety/audit.js";
import { classify } from "./safety/policy.js";
import * as ui from "./ui/render.js";

const BANNER = "NOAH — Native Operating-system Agentic Harness";

function usage(): void {
  console.log(`${BANNER}

Usage:
  noah "install htop and start it"
  noah --dry-run "set up a python project with git and a venv"
  noah --yes "show my biggest files"
  noah --log

Flags:
  --dry-run     Preview the plan; do not execute (side effects neutralised)
  --yes, -y     Auto-approve confirmation prompts
  --check CMD   Show how NOAH's safety gate would classify a shell command
  --log         Print the audit trail and exit
  --help, -h    Show this help
`);
}

function checkCommand(command: string): void {
  const v = classify("bash", { command });
  if (v.action === "deny") {
    console.log(ui.safetyBlock(command, v.reason));
    return;
  }
  console.log(ui.checkVerdict(command, v.action, v.reason));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    return;
  }

  if (argv.includes("--log")) {
    printAuditLog();
    return;
  }

  const checkIdx = argv.indexOf("--check");
  if (checkIdx !== -1) {
    const command = argv.slice(checkIdx + 1).join(" ").trim();
    if (!command) {
      console.error('✗ --check needs a command, e.g. noah --check "rm -rf /"');
      process.exitCode = 1;
      return;
    }
    console.log(ui.brand());
    checkCommand(command);
    return;
  }

  const dryRun = argv.includes("--dry-run");
  const autoYes = argv.includes("--yes") || argv.includes("-y");

  const prompt = argv
    .filter((a) => !a.startsWith("-"))
    .join(" ")
    .trim();

  if (!prompt) {
    console.error("✗ No task given.\n");
    usage();
    process.exitCode = 1;
    return;
  }

  try {
    await runNoah({ prompt, dryRun, autoYes });
  } catch (err) {
    console.error(`\n✗ NOAH error: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

main();
