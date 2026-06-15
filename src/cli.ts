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
import { collectSnapshot } from "./sys/probe.js";
import { assessHealth } from "./sys/health.js";
import { formatDoctor } from "./sys/report.js";
import { runNoahBenchmark } from "./modes/benchmark.js";
import { loadExtensions } from "./ext/loader.js";
import { printAuditLog } from "./safety/audit.js";
import { classify } from "./safety/policy.js";
import { verifyPinnedDeps, formatViolations } from "./safety/deps.js";
import { checkForUpdate, currentVersion } from "./agent/update.js";
import { resolve as resolvePath } from "node:path";
import { spawnSync } from "node:child_process";
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
  noah doctor                           Full machine health report (no LLM)
  noah benchmark                        Run the task benchmark; export md + json
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
  --verify-deps    Verify the pinned core runtime tree is intact (supply-chain guard)
  update           Upgrade NOAH to the latest published version
  version, -v      Print the version (and any available update)
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

  if (argv[0] === "update" || argv.includes("--update")) {
    console.log(ui.brand());
    console.log(`Updating NOAH (current ${currentVersion()}) → latest…\n`);
    const r = spawnSync("npm", ["install", "-g", "noah-agent@latest"], { stdio: "inherit" });
    if (r.status === 0) console.log("\n✓ NOAH updated. Run  noah  to start.");
    else console.error("\n✗ Update failed. Try:  npm install -g noah-agent@latest");
    process.exitCode = r.status ?? 1;
    return;
  }

  if (argv[0] === "version" || argv.includes("--version") || argv.includes("-v")) {
    console.log(`noah-agent ${currentVersion()}`);
    const info = await checkForUpdate({ current: currentVersion() }).catch(() => null);
    if (info) console.log(info.banner);
    return;
  }

  if (argv[0] === "doctor" || argv.includes("--doctor")) {
    console.log(ui.brand());
    const [snap, exts] = await Promise.all([collectSnapshot(), loadExtensions()]);
    console.log(formatDoctor(snap, assessHealth(snap), exts).join("\n"));
    return;
  }

  if (argv[0] === "benchmark" || argv.includes("--benchmark")) {
    const mIdx = argv.indexOf("--model");
    await runNoahBenchmark({ model: mIdx !== -1 ? argv[mIdx + 1] : undefined });
    return;
  }

  if (argv.includes("--verify-deps")) {
    const root = resolvePath(new URL("..", import.meta.url).pathname, "node_modules");
    const violations = verifyPinnedDeps(root);
    console.log(formatViolations(violations));
    if (violations.length > 0) process.exitCode = 1;
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
