# NOAH

### An AI System Administrator for your terminal

> Tell your machine what you want in plain English. NOAH **reads the machine**,
> **analyzes the impact**, **recommends** the best action, and only then
> **executes — with your approval, and a full audit trail.**

NOAH is not another agent that blindly runs commands. It behaves like a senior
sysadmin: it inspects real telemetry (disk, memory, processes, services, logs)
*before* it acts, explains what will change, asks before anything dangerous, and
**hard-blocks** the catastrophic. Cross-platform — Linux and macOS.

```
                ███╗   ██╗  ██████╗   █████╗  ██╗  ██╗
                ████╗  ██║ ██╔═══██╗ ██╔══██╗ ██║  ██║
                ██╔██╗ ██║ ██║   ██║ ███████║ ███████║
                ██║╚██╗██║ ██║   ██║ ██╔══██║ ██╔══██║
                ██║ ╚████║ ╚██████╔╝ ██║  ██║ ██║  ██║
                ╚═╝  ╚═══╝  ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝
            Native Operating-system Agentic Harness

 ◆ SYSTEM  macOS 14.5  ·  WARN
   memory  ██████████████░░░░ 82%  (13.1 GB / 16.0 GB)
   disk    █████████████████░ 86%  (70 GB free on /)
 ◆ recommendations
   ▸ Disk filling up       / at 86%
   ▸ 3 updates available   Run a system update to stay current
 ╭──────────────────────────────────────────────────────────╮
 │ › how healthy is my machine?                             │
 ╰──────────────────────────────────────────────────────────╯
  ◆ claude-sonnet-4-5  ·  safety on        / commands · enter send
```

---

## Why NOAH

A coding copilot edits files in a repo. **NOAH operates the machine.** The
difference is trust and awareness:

| | Coding copilots | **NOAH** |
|---|---|---|
| Knows the machine | guesses | **reads live telemetry first** |
| Destructive ops | runs them | **blocklist + confirm + dry-run** |
| Accountability | none | **every action → `.noah/audit.jsonl`** |
| Cross-platform | shells out, guesses apt/brew | **one tool, auto-routed per OS** |
| Runs offline | rarely | **local Ollama, nothing leaves the box** |

**Examples**
- *"Install Docker"* → checks disk/memory/existing setup → recommends → installs → verifies.
- *"Why is my laptop slow?"* → root-cause from real top processes + memory pressure, with severity.
- *"Free up space"* → finds large files, stale caches → suggests **safe** cleanup → confirms.
- *"How healthy is my machine?"* → full report with prioritized actions.

---

## Install

```bash
npm install -g noah-agent
noah            # launch the interactive console
```

Authenticate once (Claude Pro/Max or an API key) from inside NOAH:

```
/login          # pick Anthropic · GitHub Copilot · ChatGPT/Codex
```

Or run a **local** model with [Ollama](https://ollama.com) (`ollama pull qwen2.5-coder`).

---

## Usage

```bash
noah                              # interactive AI-SysAdmin console (TUI)
noah "install docker and verify"  # send a task on startup
noah doctor                       # full machine health report (no LLM)
noah benchmark                    # run the task suite; export md + json reports
noah --dry-run "free up space"    # preview; make no changes
noah --print "show big files"     # single-shot, no TUI
noah --rpc                        # headless JSON-RPC (embed NOAH)
noah --list-models                # available models (✓ = ready)
noah --check "rm -rf /"           # see how the safety gate classifies a command
noah --log                        # print the audit trail
```

**In-console commands:** `/doctor` · `/model` · `/login` · `/logout` ·
`/caveman` (token saver) · `/compact` · `/audit` · `/help` · `/clear` · `/quit`.

---

## Safety

The gate lives in the **agent pipeline, not inside any tool** — nothing runs
without passing through it.

| Verdict | Examples | Behaviour |
|---|---|---|
| `deny` | `rm -rf /`, fork bomb, `mkfs`, `dd of=/dev/disk`, `shutdown` | Hard-blocked, no override |
| `confirm` | installs, `sudo`, deletes, writes, service/network changes | Asks before running |
| `allow` | `ls`, `grep`, telemetry reads, redirects to `/dev/null` | Runs freely |

Dry-run neutralizes side effects. Every executed action is appended to
`.noah/audit.jsonl`.

---

## Embed it (SDK)

```ts
import { createNoahSession } from "noah-agent/sdk";

const { session } = await createNoahSession({ dryRun: false, autoYes: false });
session.subscribe((e) => {
  if (e.type === "message_update" && e.assistantMessageEvent.type === "text_delta")
    process.stdout.write(e.assistantMessageEvent.delta);
});
await session.prompt("install htop and start it");
session.dispose();
```

Also exported: `classify` (safety policy), `platform` (OS adapter),
`collectSnapshot`/`assessHealth` (telemetry), `buildNoahRuntime` (for RPC).

---

## Extensions

NOAH ships built-in provider shims and auto-discovers your own extensions from
`~/.noah/extensions` (user) and `./extensions` (project). Each is a module with a
default-exported pi extension factory; a broken extension is isolated and never
blocks the others. Loaded extensions and their health appear in `/extensions`
and the `noah doctor` report.

```js
// ~/.noah/extensions/hello.mjs
export default function (pi) {
  pi.on("before_agent_start", (event) => ({ systemPrompt: event.systemPrompt }));
}
```

---

## How it works

```
  Your request ── reads telemetry (system · logs) ── analyzes impact
        │
        ▼
  SAFETY GATE        classify → deny / confirm / allow   + audit trail
        │
        ▼
  TOOLS  bash · files · package · service · network · system · logs
        │
        ▼
  PLATFORM ADAPTER   Linux (apt/dnf/pacman/zypper · systemd) · macOS (brew · launchd)
        │
        ▼
      Host OS
```

Built on the [Pi](https://pi.dev) agent SDK (`@earendil-works/pi-coding-agent`)
for the loop, sessions, streaming, and multi-provider transport; NOAH adds the
OS tool layer, the telemetry/health engine, and the safety gate.

---

## Development

```bash
git clone https://github.com/srimanh/NOAH
cd NOAH && npm install
npm run build
npm test          # full suite
npm run dev -- "how healthy is my machine?"
```

Requires Node ≥ 20.6.

---

## License

[MIT](./LICENSE) © Sriman
