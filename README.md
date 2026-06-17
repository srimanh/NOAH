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
[![NOAH CI/CD](https://github.com/srimanh/NOAH/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/srimanh/NOAH/actions/workflows/ci-cd.yml)
[![license](https://img.shields.io/npm/l/noah-agent.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/noah-agent.svg)](https://nodejs.org)
[![tests](https://img.shields.io/badge/tests-330%20passing-brightgreen.svg)](#-development)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](./CONTRIBUTING.md)

### 🌐 [**Visit the live site →**](https://srimanh.github.io/NOAH/)

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

Requires **Node ≥ 22**.

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
noah playbooks                    # list curated multi-step recipes
noah run harden-ssh               # preview a playbook (safe); add --yes to apply
noah history                      # what NOAH changed (reversible ops timeline)
noah undo                         # revert the last reversible change
noah update                       # upgrade to the latest published version
noah version                      # print version (and notify if an update exists)
```

NOAH checks for new releases once a day and shows a gentle banner when one is
available — just run `noah update` to upgrade.

**In-console commands**

| Command | Does |
|---------|------|
| `/doctor` | full machine health report |
| `/model` | pick a model (dropdown) |
| `/login` · `/logout` | connect / disconnect a provider |
| `/caveman` | token-saver terse mode |
| `/compact` | compress context to save tokens |
| `/history` · `/undo` | see/revert what NOAH changed |
| `/extensions` | list loaded extensions + health |
| `/audit` · `/clear` · `/help` · `/quit` | … |

---

## 💡 What it can do

- **"Install Docker"** → checks disk/memory/existing setup → recommends → installs → verifies.
- **"Why is my laptop slow?"** → root-cause from real top processes + memory pressure, with severity.
- **"Free up space"** → finds large files & stale caches → suggests **safe** cleanup → confirms.
- **"How healthy is my machine?"** → full report with prioritized actions.

---

## 📜 Playbooks

Playbooks are curated, multi-step recipes — each step runs through the same
safety gate and ops ledger as any other action, so the **whole playbook is
reversible**. They are **safe by default**: `noah run <id>` only *previews*;
add `--yes` to apply.

```bash
noah playbooks            # update-all · harden-ssh · setup-python
noah run harden-ssh       # preview the steps (no changes)
noah run harden-ssh --yes # apply — then `noah undo` reverts it step-by-step
```

Each step is recorded against the playbook's turn, so the entire run can be
rolled back as a unit. Author your own as a small JSON/YAML file (schema =
`id`, `title`, `description`, `steps[]` of `package`/`service`/`file` actions).

---

## 📑 Black Box (incident reports)

NOAH can turn everything it recorded — the audit log, the ops ledger, telemetry —
into a clean **incident report**: a chronological timeline plus a summary of what
changed and what's reversible. Sign it for a tamper-evident, verifiable record.

```bash
noah report                                  # Markdown report to stdout
noah report --out incident.md                # write it to a file
noah report --sign noah.key --out incident.json   # signed (ed25519)
noah report verify incident.json             # ✓ authentic and unaltered
```

---

## 🛰️ Fleet (many machines)

Drive a whole fleet from one NOAH. It uses **your existing SSH** (no new auth, no
daemon, no open ports) and fans a command out to every node concurrently — one
broken host never blocks the rest. The same safety gate applies fleet-wide: a
catastrophic command is refused before it reaches a single node.

```bash
noah fleet add web1 10.0.0.1 --user deploy   # register a node
noah fleet                                    # list nodes
noah fleet doctor                             # health-check every node
noah fleet run "uptime"                       # fan a command out (gated)
```

---

## 🩺 Sentinel (proactive health)

Sentinel watches your machine in the background and alerts you the moment a
problem **appears** — disk filling, memory pressure, a service that died — not
every tick while it lingers (anti-alert-fatigue by design). Alerts go to a native
desktop notification and `~/.noah/sentinel.log`.

```bash
noah watch                 # check every 60s; Ctrl-C to stop
noah watch --interval 10   # check every 10s
```

---

## 🧠 Memory (Recall)

NOAH remembers your machine and preferences — **locally** — and injects the most
relevant facts into its context, so it behaves like it already knows your setup.
Machine facts (OS, package manager) are auto-captured from telemetry; you teach it
the rest. It's fully inspectable and wipeable — privacy by design.

```bash
noah remember "I deploy with pm2 and use pnpm"   # teach a durable fact
noah memory                                       # see everything NOAH knows
noah memory forget <id>                           # delete one fact
noah memory forget all                            # wipe it all
```

---

## 🧩 Skills (marketplace)

Skills are shareable capability packages (bundled playbooks). Before NOAH runs
one, it passes **three trust gates**:

1. **Signature** — the author signs with an ed25519 key; a tampered or unsigned
   skill is rejected.
2. **Permissions** — the skill declares what it needs (`package`/`service`/`file`);
   if any step reaches for an undeclared tool, install is refused (least privilege).
3. **The trunk** — once installed, every action still flows through the safety
   gate + ops ledger, so it stays gated and **reversible**.

```bash
noah skills keygen .                       # author: make an ed25519 keypair
noah skills sign manifest.json noah-skill.key > my.skill.json
noah skills verify my.skill.json           # signature + permission check
noah skills install my.skill.json          # gated install → ~/.noah/skills
noah skills                                # list installed skills
noah run <skill-playbook>                  # run it (gated + reversible)
```

---

## 🔌 Extensions

NOAH ships built-in provider shims and auto-discovers your own extensions from
`~/.noah/extensions` (user) and `./extensions` (project). Each is a module with a
default-exported extension factory; a broken extension is **isolated** and never
blocks the others. Loaded extensions and their health show in `/extensions` and `noah doctor`.

```js
// ~/.noah/extensions/hello.mjs
export default function (noah) {
  noah.on("before_agent_start", (event) => ({ systemPrompt: event.systemPrompt }));
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

Under the hood NOAH runs on a battle-tested agentic runtime for the reasoning loop,
sessions, streaming, and multi-provider transport — then adds everything that makes
it NOAH: the OS tool layer, the telemetry/health engine, and the safety gate.

### 🔒 Safety classification

| Verdict | Examples | Behaviour |
|---|---|---|
| `deny` | `rm -rf /`, fork bomb, `mkfs`, `dd of=/dev/disk`, `shutdown` | Hard-blocked, no override |
| `confirm` | installs, `sudo`, deletes, writes, service/network changes | Asks first |
| `allow` | `ls`, `grep`, telemetry reads, redirects to `/dev/null` | Runs freely |

### 🔐 Supply-chain integrity

NOAH never inherits the release cadence — or any compromise — of its third-party
runtime:

- **Exact pins** — the core runtime is locked to one vetted version (no `^`/`~`).
- **Bundled** — that vetted runtime ships *inside* the npm tarball
  (`bundleDependencies`), so `npm i -g noah-agent` never re-downloads it from the
  registry. A malicious upstream release simply can't reach your machine.
- **Verified** — `npm run verify:deps` (and `noah --verify-deps`) walks the whole
  install tree and fails on any drifted or missing copy. It runs automatically in
  `prepublishOnly`, so a tampered tree can never be published.

```bash
noah --verify-deps   # ✓ core dependencies verified — all pinned versions intact.
```

### ↩️ Reversible by design

Every change NOAH makes is recorded as a **transaction** in an append-only ledger
(`~/.noah/ops.jsonl`). Command-style changes (package install/remove, service
enable/disable/start/stop) store their **inverse**; file changes (`write`/`edit`)
store a **content-addressed snapshot** of the original bytes. You never have to
remember what changed or how to undo it:

```bash
noah history   # timeline: [reversible] / [undone] / [not reversible]
noah undo      # replay the inverse of the last reversible op (gated)
noah undo <id> # revert a specific operation
```

**Time Machine** — in the console, every message is a checkpoint. `/rewind` (or
`/rewind <n>`) rolls the machine back to the state it was in before that message,
then restores the message text so you can edit and re-run it. `/checkpoints` lists
them. So if a request changed your system in a way you didn't want, you scroll
back, rewind, and the filesystem follows.

So if NOAH hardens your `sshd_config`, `noah undo` restores the *exact* prior file
— and a file NOAH created is removed again. Irreversible actions (e.g. `update`,
`restart`) are still recorded and clearly flagged “not reversible”, no surprises.

---

## 🧪 Development

```bash
git clone https://github.com/srimanh/NOAH
cd NOAH && npm install
npm run build
npm test            # full suite (330 tests, must stay green)
./scripts/smoke.sh  # end-to-end smoke check
npm run dev -- "how healthy is my machine?"   # run from source
```

Tests live next to the code they cover (`foo.ts` + `foo.test.ts`). Pure logic is
tested directly; I/O is made testable with **injectable** fs/fetch/ssh/clock —
unit tests never touch the real system or network.

---

## 🧭 Codebase map

New here? **[ARCHITECTURE.md](./ARCHITECTURE.md)** is the contributor's guide —
the mental model, the request lifecycle, and where everything lives. The short
version:

| Area | Path | What it does |
|---|---|---|
| Entry / wiring | `src/cli.ts` · `src/runtime.ts` | Route commands; assemble the agent (prompt + tools + extensions) |
| Safety | `src/safety/` | The gate (`deny`/`confirm`/`allow`), audit log, supply-chain guard |
| Reversibility | `src/ops/` | Ledger, inverses, snapshots, `undo`, `rewind` — the crown jewel |
| Tools | `src/tools/` | What the agent can do (package·service·network·system·logs) |
| Platform | `src/platform/` | The only place that knows apt/brew/systemd/launchd |
| Telemetry | `src/sys/` | Probe → health rules → `doctor` |
| Capabilities | `src/playbooks/` · `src/skills/` · `src/memory/` · `src/sentinel/` · `src/fleet/` · `src/report/` | Playbooks · Skills · Recall · Sentinel · Fleet · Black Box |
| Interface | `src/tui/` · `src/ui/` · `src/llm/` | The console, rendering, model providers |

> **The one rule:** every action is **gated**, **audited**, and **reversible**.
> If a change can't be, redesign it until it can — that's the trunk the whole
> codebase grows from.

---

## 🤝 Contributing

PRs welcome — and easy to start. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)**
(codebase tour) and **[CONTRIBUTING.md](./CONTRIBUTING.md)** (the TDD workflow),
then pick a first issue. Good starter areas: a new built-in **playbook**
(`src/playbooks/builtins.ts`) or a **health rule** (`src/sys/health.ts`) — both
are pure, easy-to-test additions.

Want the *why* behind NOAH? **[docs/STORY.md](./docs/STORY.md)** tells it as
user stories, from pain point to solution. By contributing you agree to our
[Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 🗺️ Roadmap

**Shipped (1.0)** — eight phases, each gated, audited, reversible:

- [x] Foundation — telemetry `doctor` · safety gate + audit · dry-run · cross-platform · extensions · benchmark · SDK · RPC · supply-chain hardening
- [x] **Time Machine** — `/rewind` a message to roll the machine back (`/checkpoints`)
- [x] **Reversibility** — `noah undo` / `noah history` + file snapshots
- [x] **Playbooks** — curated, gated, reversible recipes (`noah run`)
- [x] **Skills** — signed + permission-scoped capability packages (`noah skills`)
- [x] **Recall** — local memory injected into context (`noah memory`)
- [x] **Sentinel** — proactive health watch (`noah watch`)
- [x] **Fleet** — many machines over SSH (`noah fleet`)
- [x] **Black Box** — signed incident reports (`noah report`)
- [x] **GA 1.0** — CI · hardening · semver-1.0 stability contract 🎉

**Post-1.0 ideas** (contributions welcome):

- [ ] Conversation-memory fork on rewind (truncate model history, not just machine state)
- [ ] Remote skill registry (search/publish over the network)
- [ ] Fleet-wide playbooks with per-host approval
- [ ] Embeddings-based recall · Sentinel auto-remediation · Windows adapter

---

## 🔖 Stability (1.0)

NOAH follows [Semantic Versioning](https://semver.org). As of **1.0**, the CLI
commands, the safety verdicts (`deny`/`confirm`/`allow`), and the SDK surface
documented here are stable for the entire `1.x` line — breaking changes wait for
`2.0`. New capabilities arrive as minor releases; fixes as patches. See
[CHANGELOG.md](./CHANGELOG.md) for the journey and [SECURITY.md](./SECURITY.md)
for disclosure.

---

## 📄 License

[MIT](./LICENSE) © Sriman
