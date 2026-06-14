<div align="center">

```
                ███╗   ██╗  ██████╗   █████╗  ██╗  ██╗
                ████╗  ██║ ██╔═══██╗ ██╔══██╗ ██║  ██║
                ██╔██╗ ██║ ██║   ██║ ███████║ ███████║
                ██║╚██╗██║ ██║   ██║ ██╔══██║ ██╔══██║
                ██║ ╚████║ ╚██████╔╝ ██║  ██║ ██║  ██║
                ╚═╝  ╚═══╝  ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝
```

# 🛰️ NOAH

### Native Operating-system Agentic Harness — *an AI System Administrator for your terminal*

[![npm version](https://img.shields.io/npm/v/noah-agent.svg)](https://www.npmjs.com/package/noah-agent)
[![license](https://img.shields.io/npm/l/noah-agent.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/noah-agent.svg)](https://nodejs.org)
[![tests](https://img.shields.io/badge/tests-177%20passing-brightgreen.svg)](#-development)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](./CONTRIBUTING.md)

> Tell your machine what you want in plain English. NOAH **reads the machine**,
> **analyzes the impact**, **recommends** the best action, and only then
> **executes — with your approval, and a full audit trail.**

</div>

---

NOAH is not another agent that blindly runs commands. It behaves like a senior
sysadmin: it inspects real telemetry (disk, memory, processes, services, logs)
**before** it acts, explains what will change, **asks before anything dangerous**,
and **hard-blocks the catastrophic**. Cross-platform — Linux & macOS.

```
 🛰️ SYSTEM  macOS 14.5  ·  WARN
   memory  ██████████████░░░░ 82%  (13.1 GB / 16.0 GB)
   disk    █████████████████░ 86%  (70 GB free on /)
 🔧 recommendations
   ▸ Disk filling up       / at 86%
   ▸ 3 updates available   Run a system update to stay current
 ╭──────────────────────────────────────────────────────────╮
 │ › how healthy is my machine?                             │
 ╰──────────────────────────────────────────────────────────╯
  ◆ claude-sonnet-4-5  ·  safety on  ·  in 1.2k · out 340 · ctx 7%
```

---

## ✨ Features

- 🧠 **Machine-aware** — grounds every answer in live telemetry, not guesses.
- 🩺 **Analyze → recommend → approve** — impact + severity before it touches anything.
- 🛡️ **Safety gate** — confirms dangerous ops, **hard-blocks** `rm -rf /`, `mkfs`, fork bombs.
- 📓 **Audited** — every action appended to `.noah/audit.jsonl`.
- 🖥️ **Cross-platform** — one tool, auto-routed (`apt`/`dnf`/`pacman`/`zypper`/`brew`, `systemd`/`launchd`).
- 📊 **Live dashboard + `noah doctor`** — health, storage, updates, prioritized fixes.
- 🔌 **Extensible** — built-in shims + your own extensions from `~/.noah/extensions` & `./extensions`.
- 🧪 **Benchmark suite** — `noah benchmark` exports markdown + JSON reports.
- 🦙 **Local or cloud** — Ollama offline, or Claude / Copilot / Codex via `/login`.
- 🪶 **Token-saver** — built-in caveman mode + context compaction.

---

## 🚀 Install

```bash
npm install -g noah-agent
noah                 # launch the interactive console
```

Authenticate once from inside NOAH (or run a local model with [Ollama](https://ollama.com)):

```
/login               # Anthropic (Claude Pro/Max) · GitHub Copilot · ChatGPT/Codex
```

Requires **Node ≥ 20.6**.

---

## 🕹️ Usage

```bash
noah                              # interactive AI-SysAdmin console (TUI)
noah "install docker and verify"  # send a task on startup
noah doctor                       # full machine health report (no LLM)
noah benchmark                    # run the task suite → md + json reports
noah --dry-run "free up space"    # preview; make no changes
noah --print "show big files"     # single-shot, no TUI
noah --rpc                        # headless JSON-RPC (embed NOAH)
noah --list-models                # available models (✓ = ready)
noah --check "rm -rf /"           # see how the safety gate classifies a command
noah --log                        # print the audit trail
```

**In-console commands**

| Command | Does |
|---------|------|
| `/doctor` | full machine health report |
| `/model` | pick a model (dropdown) |
| `/login` · `/logout` | connect / disconnect a provider |
| `/caveman` | token-saver terse mode |
| `/compact` | compress context to save tokens |
| `/extensions` | list loaded extensions + health |
| `/audit` · `/clear` · `/help` · `/quit` | … |

---

## 💡 What it can do

- **"Install Docker"** → checks disk/memory/existing setup → recommends → installs → verifies.
- **"Why is my laptop slow?"** → root-cause from real top processes + memory pressure, with severity.
- **"Free up space"** → finds large files & stale caches → suggests **safe** cleanup → confirms.
- **"How healthy is my machine?"** → full report with prioritized actions.

---

## 🔌 Extensions

NOAH ships built-in provider shims and auto-discovers your own extensions from
`~/.noah/extensions` (user) and `./extensions` (project). Each is a module with a
default-exported pi extension factory; a broken extension is **isolated** and never
blocks the others. Loaded extensions and their health show in `/extensions` and `noah doctor`.

```js
// ~/.noah/extensions/hello.mjs
export default function (pi) {
  pi.on("before_agent_start", (event) => ({ systemPrompt: event.systemPrompt }));
}
```

---

## 🧩 Embed it (SDK)

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

Also exported: `classify` (safety policy) · `platform` (OS adapter) ·
`collectSnapshot` / `assessHealth` (telemetry) · `buildNoahRuntime` (RPC).

---

## 🏗️ How it works

```
  Your request ── reads telemetry (system · logs) ── analyzes impact
        │
        ▼
  🛡️ SAFETY GATE     classify → deny / confirm / allow   + audit trail
        │
        ▼
  🧰 TOOLS  bash · files · package · service · network · system · logs
        │
        ▼
  🖥️ PLATFORM ADAPTER  Linux (apt/dnf/pacman/zypper · systemd) · macOS (brew · launchd)
        │
        ▼
       Host OS
```

Built on the [Pi](https://pi.dev) agent SDK for the loop, sessions, streaming, and
multi-provider transport; NOAH adds the OS tool layer, the telemetry/health engine,
and the safety gate.

### 🔒 Safety classification

| Verdict | Examples | Behaviour |
|---|---|---|
| `deny` | `rm -rf /`, fork bomb, `mkfs`, `dd of=/dev/disk`, `shutdown` | Hard-blocked, no override |
| `confirm` | installs, `sudo`, deletes, writes, service/network changes | Asks first |
| `allow` | `ls`, `grep`, telemetry reads, redirects to `/dev/null` | Runs freely |

---

## 🧪 Development

```bash
git clone https://github.com/srimanh/NOAH
cd NOAH && npm install
npm run build
npm test          # full suite (177 tests)
npm run dev -- "how healthy is my machine?"
```

---

## 🤝 Contributing

PRs welcome! NOAH is built with strict **Red → Green → Refactor** TDD — see
[CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 🗺️ Roadmap

- [x] Telemetry-grounded analysis · dashboard · `doctor`
- [x] Safety gate + audit · dry-run · cross-platform adapters
- [x] Extensions · benchmark · SDK · RPC
- [ ] Undo / rollback of changes
- [ ] Playbooks (`/onboard-mac`, `/harden-ssh`)
- [ ] Proactive health daemon · fleet mode over RPC
- [ ] Validated Linux GA

---

## 📄 License

[MIT](./LICENSE) © Sriman
