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
import { undo as undoOp } from "./ops/engine.js";
import { history as opHistory } from "./ops/ledger.js";
import { restoreSnapshot } from "./ops/snapshot.js";
import { formatHistory, formatUndoResult } from "./ops/report.js";
import { platform } from "./platform/adapter.js";
import type { ToolAction } from "./ops/types.js";
import { listBuiltins, getBuiltin } from "./playbooks/builtins.js";
import { previewSteps, runPlaybook } from "./playbooks/runner.js";
import { performStep } from "./playbooks/perform.js";
import { nextTurn } from "./ops/context.js";
import { installSkill, listSkills, getSkillPlaybook } from "./skills/store.js";
import { verifySkill, signManifest, type SignedSkill } from "./skills/signing.js";
import { parseManifest } from "./skills/manifest.js";
import { checkPermissions } from "./skills/permissions.js";
import { readFileSync as readFile, writeFileSync as writeFile } from "node:fs";
import { generateKeyPairSync } from "node:crypto";
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
  playbooks        List built-in playbooks (curated multi-step recipes)
  run <id> [--yes] Preview a playbook; --yes applies it (reversible via undo)
  skills           List installed skills (community capability packages)
  skills install <f> · verify <f> · sign <manifest> <key> · keygen [dir]
  history          Show recorded operations (what NOAH changed)
  undo [id]        Revert the last reversible operation (or a specific id)
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

function readJson(path: string): unknown {
  return JSON.parse(readFile(path, "utf8"));
}

async function runSkillsCommand(args: string[]): Promise<void> {
  const sub = args[0];
  // `sign` emits pure JSON to stdout; every other subcommand is human-facing.
  if (sub !== "sign") console.log(ui.brand());

  // keygen: create an ed25519 keypair for authoring skills
  if (sub === "keygen") {
    const dir = args[1] || ".";
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    writeFile(`${dir}/noah-skill.key`, privateKey.export({ type: "pkcs8", format: "pem" }).toString());
    writeFile(`${dir}/noah-skill.pub`, publicKey.export({ type: "spki", format: "pem" }).toString());
    console.log(`✓ wrote ${dir}/noah-skill.key (keep secret) and ${dir}/noah-skill.pub`);
    return;
  }

  // sign: turn a manifest + private key into a signed skill on stdout
  if (sub === "sign") {
    const [, manifestPath, keyPath] = args;
    if (!manifestPath || !keyPath) {
      console.error("usage: noah skills sign <manifest.json> <key.pem>");
      process.exitCode = 1;
      return;
    }
    const parsed = parseManifest(readJson(manifestPath));
    if (!parsed.ok) {
      console.error(`✗ invalid manifest:\n${parsed.errors.map((e) => "  - " + e).join("\n")}`);
      process.exitCode = 1;
      return;
    }
    const priv = readFile(keyPath, "utf8");
    const pub = readFile(keyPath.replace(/\.key$/, ".pub"), "utf8");
    const signed = signManifest(parsed.manifest, priv, pub);
    console.log(JSON.stringify(signed, null, 2));
    return;
  }

  // verify: check signature + permissions without installing
  if (sub === "verify") {
    const file = args[1];
    if (!file) {
      console.error("usage: noah skills verify <skill.json>");
      process.exitCode = 1;
      return;
    }
    const signed = readJson(file) as SignedSkill;
    const v = verifySkill(signed);
    const parsed = parseManifest(signed.manifest);
    const perms = parsed.ok ? checkPermissions(parsed.manifest) : ["manifest invalid"];
    if (v.ok && perms.length === 0) console.log(`✓ ${signed.manifest?.id}: signature valid, permissions in scope`);
    else {
      if (!v.ok) console.error(`✗ ${v.reason}`);
      for (const p of perms) console.error(`✗ ${p}`);
      process.exitCode = 1;
    }
    return;
  }

  // install: verify + permission-check, then persist
  if (sub === "install") {
    const file = args[1];
    if (!file) {
      console.error("usage: noah skills install <skill.json>");
      process.exitCode = 1;
      return;
    }
    const r = installSkill(readJson(file) as SignedSkill);
    if (r.ok) console.log(`✓ installed skill "${r.manifest.id}" v${r.manifest.version} by ${r.manifest.author}`);
    else {
      console.error(`✗ install rejected:\n${r.errors.map((e) => "  - " + e).join("\n")}`);
      process.exitCode = 1;
    }
    return;
  }

  // default: list installed skills
  const skills = listSkills();
  if (!skills.length) {
    console.log("No skills installed. Install one with:  noah skills install <skill.json>");
    return;
  }
  console.log("Installed skills:\n");
  for (const s of skills) {
    console.log(`  ${s.id.padEnd(16)} v${s.version}  by ${s.author}  — ${s.description}`);
    console.log(`  ${" ".repeat(16)} permissions: [${s.permissions.join(", ")}]  playbooks: ${s.playbooks.map((p) => p.id).join(", ")}`);
  }
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

  if (argv[0] === "playbooks") {
    console.log(ui.brand());
    console.log("Available playbooks (run with:  noah run <id> --yes):\n");
    for (const p of listBuiltins()) console.log(`  ${p.id.padEnd(14)} ${p.title} — ${p.description}`);
    return;
  }

  if (argv[0] === "skills") {
    await runSkillsCommand(argv.slice(1));
    return;
  }

  if (argv[0] === "run") {
    const id = argv[1];
    console.log(ui.brand());
    const builtin = id ? getBuiltin(id) : undefined;
    let pb;
    if (builtin && builtin.ok) pb = builtin.playbook;
    else if (id) pb = getSkillPlaybook(id)?.playbook;
    if (!pb) {
      if (builtin && !builtin.ok) {
        console.error(`✗ playbook "${id}" is invalid:\n${builtin.errors.map((e) => "  - " + e).join("\n")}`);
      } else {
        console.error(`✗ unknown playbook "${id ?? ""}". See:  noah playbooks  /  noah skills`);
      }
      process.exitCode = 1;
      return;
    }
    const apply = argv.includes("--yes") || argv.includes("-y");
    console.log(`${pb.title} — ${pb.description}\n`);
    console.log(previewSteps(pb).join("\n"));
    console.log("");
    const turn = nextTurn();
    const res = await runPlaybook(pb, { turn, perform: performStep, dryRun: !apply });
    for (const s of res.steps) {
      console.log(`  ${s.ok ? "✓" : "✗"} ${s.name}${s.error ? ` — ${s.error}` : ""}`);
    }
    if (!apply) {
      console.log("\nPreview only. Re-run with  --yes  to apply. Every step is reversible (noah undo).");
    } else if (res.ok) {
      console.log("\n✓ Playbook complete. Roll it all back step-by-step with:  noah undo");
    } else {
      console.log("\n✗ Stopped at a failed step. Applied steps were recorded — revert with:  noah undo");
      process.exitCode = 1;
    }
    return;
  }

  if (argv[0] === "history") {
    console.log(ui.brand());
    console.log(formatHistory(opHistory()));
    return;
  }

  if (argv[0] === "undo") {
    console.log(ui.brand());
    const runInverse = async (a: ToolAction): Promise<string> => {
      if (a.tool === "package") return await platform.pkg(a.action, a.pkg);
      if (a.tool === "service") return await platform.service(a.name, a.action as never);
      return ""; // file ops are reversed via restore, not a command
    };
    const res = await undoOp({
      id: argv[1],
      run: runInverse,
      restore: async (ref) => restoreSnapshot(ref),
    });
    console.log(formatUndoResult(res));
    process.exitCode = res.ok ? 0 : 1;
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
