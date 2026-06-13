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
import { runNoahInteractive } from "./tui/app.js";
import { runNoahSpace } from "./tui/space/app.js";
import { runNoahRpc } from "./modes/rpc.js";
import { printAuditLog } from "./safety/audit.js";
import { classify } from "./safety/policy.js";
import { buildRegistry } from "./llm/registry.js";
import { formatModelList, type RegistryLike } from "./llm/resolve.js";
import * as ui from "./ui/render.js";

const BANNER = "NOAH — Native Operating-system Agentic Harness";

function usage(): void {
  console.log(`${BANNER}

Usage:
  noah                                  Launch the interactive TUI
  noah "install htop and start it"      TUI, sending your task first
  noah --print "show my biggest files"  Single-shot, no TUI (scripts/demos)
  noah --dry-run "set up a venv"         Preview steps; make no changes
  noah --log                            Print the audit trail

Flags:
  --print          Single-shot branded run; do not open the TUI
  --rpc            Headless JSON-RPC over stdin/stdout (embed NOAH)
  --classic        Use the classic (pi-style) interactive mode
  --caveman[=LVL]  Start in token-saver mode (off/lite/full/ultra/micro)
  --dry-run        Preview the plan; do not execute (side effects neutralised)
  --yes, -y        Auto-approve confirmation prompts
  --model REF      Pick the LLM as provider/id (e.g. ollama/llama3.1)
  --list-models    List available models (✓ = ready) and exit
  --check CMD      Show how NOAH's safety gate would classify a shell command
  --log            Print the audit trail and exit
  --help, -h       Show this help
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

  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    return;
  }

  if (argv.includes("--log")) {
    printAuditLog();
    return;
  }

  if (argv.includes("--list-models")) {
    const { modelRegistry } = await buildRegistry();
    console.log(ui.brand());
    console.log(formatModelList(modelRegistry as unknown as RegistryLike));
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
  const printMode = argv.includes("--print");
  const classicMode = argv.includes("--classic");
  const rpcMode = argv.includes("--rpc") || argv.includes("--mode=rpc");

  const modelIdx = argv.indexOf("--model");
  const model = modelIdx !== -1 ? argv[modelIdx + 1] : undefined;

  const caveArg = argv.find((a) => a === "--caveman" || a.startsWith("--caveman="));
  const caveman = caveArg ? ((caveArg.split("=")[1] as never) ?? "full") : undefined;

  const prompt = argv
    .filter((a, i) => !a.startsWith("-") && i !== modelIdx + 1)
    .join(" ")
    .trim();

  try {
    if (rpcMode) {
      await runNoahRpc({ dryRun, autoYes, model, caveman });
    } else if (printMode) {
      if (!prompt) {
        console.error("✗ --print needs a task.\n");
        usage();
        process.exitCode = 1;
        return;
      }
      await runNoah({ prompt, dryRun, autoYes, model });
    } else if (classicMode) {
      await runNoahInteractive({ initialMessage: prompt || undefined, dryRun, autoYes, model });
    } else {
      // Default: NOAH's bespoke space TUI.
      await runNoahSpace({ initialMessage: prompt || undefined, dryRun, autoYes, model, caveman });
    }
  } catch (err) {
    console.error(`\n✗ NOAH error: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

main();
