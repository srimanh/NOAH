# 🌿 NOAH — Hackathon Build Plan (PRD + LLD)

> **24-hour solo hackathon scope.** This document is the *contract* for what we build.
> The full vision lives in [`NOAH.md`](./NOAH.md). This file is the **ruthless cut**:
> only what wins a live demo against 27 teams. Everything not in here is **out of scope**.

**Author:** Sriman (solo) · **Time budget:** 24h · **Date:** 2026-06-13
**One-liner:** *Natural language controls your computer — autonomously, and it can't hurt you.*

> **Positioning:** depth over breadth. Small surface area, bulletproof live. The
> "big win" feeling comes from **autonomous multi-step workflows** (the loop chaining
> tools on its own) + **dry-run preview** + **explain mode** — all cheap on top of the
> Pi SDK — NOT from a pile of shallow features.

### ⚙️ Verified Technical Facts (Pi SDK — confirmed from docs)

| Question | Answer (verified) |
|---|---|
| Does my **Claude Pro** plan work? | **Yes.** Pi supports `/login` → "Claude Pro/Max" OAuth. Tokens stored in `~/.pi/agent/auth.json`, auto-refresh. ⚠️ *Caveat:* third-party harness usage bills as Anthropic **"extra usage" per token**, not against the flat Pro limit. Hackathon cost = pennies. |
| LLM auth options | 1) `/login` Claude Pro/Max OAuth · 2) `ANTHROPIC_API_KEY` env var · 3) Ollama (offline backup) |
| Where does the safety gate plug in? | `pi.on("tool_call", …)` → return `{ block: true, reason }` to deny. Fires **before** the tool runs. |
| Where does audit plug in? | `pi.on("tool_result", …)` → fires after execution; has `toolName`, `input`, `content`, `isError`. |
| Can we rewrite a command before it runs? | **Yes.** `event.input` is **mutable** in `tool_call`. This powers **dry-run** (rewrite to a safe echo) and arg patching. |
| Confirm prompt UI | `ui.confirm(...)` available in extension context. |
| How are hooks attached via SDK? | `createAgentSession({ extensionFactories: [(pi) => { pi.on(...) }] })` or a `DefaultResourceLoader`. |
| Built-in tools we reuse free | `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls` |
| Sessions / compaction | Free from SDK (JSONL tree). |

> **Action before coding:** run `pi` once, `/login` → Claude Pro/Max, confirm a prompt works.
> Install **Ollama** + pull one model as a live-demo fallback. Prove LLM access *before* writing code.

---

## Part A · PRD (Product Requirements Document)

### A.1 Problem

LLM agents can already run shell commands. But giving an AI raw access to your OS is
terrifying: one hallucinated `rm -rf /` and your machine is gone. **There is a trust gap.**
Nobody ships an OS agent that is *autonomous when trusted, blocked when dangerous,
and accountable for every action.*

### A.2 Solution

**NOAH** = a CLI agent that understands natural language and operates your OS through a
**safety gate**. Every dangerous action is confirmed, every catastrophic action is
hard-blocked, and every action is logged to an audit trail.

The **safety layer is the product**. Wiring an LLM to bash is trivial; making it *safe*
and *demonstrably safe* is the differentiator.

### A.3 Target User

- Power users / developers who want to automate OS tasks by talking.
- Anyone nervous about giving an AI shell access (i.e. everyone sane).

### A.4 User Stories

> Priority: **P0** = must demo, **P1** = strong if time, **P2** = stretch / talking point.

**Epic 1 — Natural-language OS control**
| ID | Story | Pri |
|---|---|---|
| US-1 | As a user I type a plain-English task so I don't memorize commands. | P0 |
| US-2 | As a user NOAH inspects my system (disk, CPU, processes) read-only and reports. | P0 |
| US-3 | As a user NOAH installs / removes software via natural language. | P0 |
| US-4 | As a user NOAH edits a config file when I describe the change. | P1 |

**Epic 2 — Safety & trust (the product)**
| ID | Story | Pri |
|---|---|---|
| US-5 | As a user NOAH asks confirmation before any write/install/delete/sudo. | P0 |
| US-6 | As a user NOAH shows the **exact command** before I approve. | P0 |
| US-7 | As a user NOAH **hard-blocks** catastrophic commands (`rm -rf /`, fork bomb) with no override. | P0 |
| US-8 | As a user I run **dry-run** mode to preview what would happen without executing. | P1 |
| US-9 | As a user I can **abort** a running task instantly. | P1 |

**Epic 3 — Explainability & autonomy (the "wow")**
| ID | Story | Pri |
|---|---|---|
| US-10 | As a user I give a **multi-step goal** and NOAH chains the steps itself. | P0 |
| US-11 | As a user NOAH **explains its plan** before executing (explain mode). | P0 |
| US-12 | As a user NOAH recovers / reports gracefully when a step fails. | P1 |

**Epic 4 — Accountability**
| ID | Story | Pri |
|---|---|---|
| US-13 | As a user every executed action is logged to an audit trail (JSONL). | P0 |
| US-14 | As a user I review the audit log (`noah --log`). | P1 |
| US-15 | As a user my session persists so I can review / branch later (Pi JSONL = free). | P2 |

**Epic 5 — Portability (talking point)**
| ID | Story | Pri |
|---|---|---|
| US-16 | As a user the same NOAH runs on macOS and Linux (adapter pattern). | P2 |
| US-17 | As a user NOAH can run on a local offline model (Ollama) for privacy. | P2 |

**Demo proves:** US-2 → capability · US-3+US-5+US-6 → control · US-7 → wow · US-10+US-11 → autonomy · US-13 → accountability.

### A.5 Scope

#### ✅ In (must ship in 24h — P0)
- `noah "<natural language>"` CLI built on the **Pi SDK** (`createAgentSession`).
- Tools: reuse Pi's `bash` / `read` / `write`; add **one** abstract `package` tool.
- **Safety layer** (the core feature), wired via `extensionFactories`:
  - `pi.on("tool_call")` → permission gate: classify → **deny** catastrophic, **confirm** dangerous (`ui.confirm`), **allow** safe.
  - `pi.on("tool_result")` → JSONL audit log.
- **Autonomous multi-step workflows** — the loop chains tools to reach a goal (free from SDK, framed as the headline feature).
- **Explain mode** — NOAH states its plan before acting (system-prompt + a planning preamble).
- LLM via **Claude Pro/Max OAuth** (`/login`) — reliable demo brain.
- **One OS** (macOS) fully working. Adapter `interface` visible in code = cross-platform proof.

#### 🔜 P1 (ship if on schedule)
- **Dry-run mode** (`noah --dry-run "…"`): mutate `event.input` so commands are previewed, not executed.
- Colored confirm prompt (red = catastrophic, yellow = dangerous).
- Audit-log viewer (`noah --log`).
- Graceful step-failure recovery / friendly errors.

#### 🥊 P2 (talking point only)
- Ollama local provider wired ("runs offline").
- Second OS (Linux) adapter impl.
- Session branching UI.

#### ❌ Out (do NOT build — scope poison)
MCP · voice (STT/TTS) · vector memory · proactive daemon · sub-agents/planner ·
packaging (deb/rpm/snap/pkg) · bootable ISO · second OS adapter · Windows · multi-user.

### A.6 Success Criteria

| Metric | Target |
|---|---|
| Live demo runs without crash | **Mandatory** |
| The 3-command demo script | Works 10/10 in rehearsal |
| Backup demo video recorded | By hour 22 |
| Pitch length | ≤ 3 minutes |
| Judge takeaway | "The safe OS agent" |

### A.7 Non-Negotiable Constraints

> - **Never** run destructive commands without explicit confirmation.
> - **Every** executed command is logged (audit trail).
> - Live demo uses **cloud LLM** for reliability; offline is a *talking point*, not a risk.

---

## Part B · LLD (Low-Level Design)

### B.1 Architecture (hackathon cut)

```
        noah "install htop"            ← CLI (src/cli.ts)
                │
                ▼
        AgentSession  (Pi SDK)         ← src/session.ts
   ┌────────────┴────────────┐
   │   agentLoop() (Pi)      │         loop / sessions / compaction = FREE
   └────────────┬────────────┘
                │  pi.on("tool_call") / pi.on("tool_result")  (extensionFactories)
                ▼
        SAFETY LAYER                   ← src/safety/*  ← THE PRODUCT
   gate (deny/confirm) · policy (classify) · audit (log) · dry-run (mutate input)
                │
                ▼
        TOOLS  (defineTool + Pi builtins)
   bash · read · write · package       ← src/tools/*
                │
                ▼
        PLATFORM ADAPTER (macOS)       ← src/platform/*  (interface = cross-platform proof)
   brew · launchctl · screencapture …
                │
                ▼
              Host OS
```

### B.2 Module Layout

```
NOAH/
├── HACKATHON.md              # this file
├── NOAH.md                   # full vision
├── package.json              # bin: noah
├── tsconfig.json
├── src/
│   ├── cli.ts                # entry: parse argv → session.prompt()
│   ├── session.ts            # createAgentSession() + wire hooks
│   ├── tools/
│   │   └── package.ts        # abstract package tool → platform.pkg()
│   ├── platform/
│   │   └── adapter.ts        # PlatformAdapter iface + macOS impl + detect
│   ├── safety/
│   │   ├── policy.ts         # blocklist + danger classification
│   │   ├── extension.ts      # pi.on(tool_call)+tool_result factory (gate+dry-run+audit)
│   │   └── audit.ts          # JSONL append + `noah --log` reader
│   └── prompt/
│       └── system.ts         # explain-mode system prompt (plan before acting)
└── .noah/
    └── audit.jsonl           # runtime audit trail
```

### B.3 Key Interfaces

```typescript
// safety/policy.ts
export interface Verdict { action: "allow" | "confirm" | "deny"; reason?: string; }
export function classify(toolName: string, input: unknown): Verdict;
//  - deny    : rm -rf /, dd, mkfs, fork bomb, :(){ :|:& };:
//  - confirm : write, delete, install, sudo, network, package
//  - allow   : read, list, grep, find, status

// safety/extension.ts  — the Pi extensionFactory that wires everything
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
export const safetyExtension = (opts: { dryRun: boolean }) => (pi) => {
  pi.on("tool_call", async (event, ctx) => { /* gate — see B.4 */ });
  pi.on("tool_result", (event) => audit(event));   // append .noah/audit.jsonl
};

// platform/adapter.ts
export interface PlatformAdapter {
  pkg(action: "install" | "remove" | "update", pkg?: string): Promise<string>;
}
export const platform: PlatformAdapter; // macOS (brew) for hackathon
```

### B.4 Safety Logic (the core — verified Pi SDK API)

```typescript
// pi.on("tool_call") — fires BEFORE the tool runs. event.input is MUTABLE.
pi.on("tool_call", async (event, ctx) => {
  const v = classify(event.toolName, event.input);

  if (v.action === "deny")
    return { block: true, reason: v.reason };          // hard-block, no override (US-7)

  if (dryRun) {                                         // dry-run (US-8): rewrite to preview
    if (event.toolName === "bash")
      event.input.command = `echo "[DRY-RUN] would run: ${event.input.command}"`;
    return; // allow the harmless echo
  }

  if (v.action === "confirm") {                         // US-5/US-6
    const ok = await ctx.ui.confirm(`Run: ${preview(event)}?`);
    if (!ok) return { block: true, reason: "user declined" };
  }
  // allow
});

// pi.on("tool_result") — fires AFTER execution. Always audit (US-13).
pi.on("tool_result", (event) => {
  audit.append({ ts: Date.now(), tool: event.toolName, input: event.input, ok: !event.isError });
});
```

> **Why this is unbypassable:** the gate sits in the agent's tool pipeline, not inside any
> tool. A tool cannot run without passing through `tool_call`. That's the whole safety pitch.

**Blocklist (regex, hard-deny):**
`rm\s+-rf\s+/` · `mkfs` · `dd\s+if=` · `:\(\)\s*\{` (fork bomb) · `>\s*/dev/sd` · `chmod\s+-R\s+777\s+/`

### B.5 Tech Stack (locked)

| Concern | Choice |
|---|---|
| Runtime | Node 22+ / Bun |
| Agent core | `@earendil-works/pi-coding-agent` (SDK mode) |
| Tool schema | `typebox` |
| LLM (demo) | Claude Pro/Max via `/login` OAuth (or `ANTHROPIC_API_KEY`) |
| LLM (fallback) | Ollama (offline) — backup + talking point |
| Safety wiring | `extensionFactories` → `pi.on("tool_call"/"tool_result")` |
| Exec | `execa` |

### B.5b Explain Mode & Autonomy (the "wow", cheap)

- **Autonomy (US-10):** Pi's `agentLoop` already chains tools until the goal is met.
  A multi-step prompt ("set up a python project with git + venv") *looks* like a big
  autonomous agent but is just the loop doing its job. **Zero extra code.**
- **Explain mode (US-11):** override the system prompt (`src/prompt/system.ts`) to instruct:
  *"Before executing, state a short numbered plan. Then execute step by step."*
  Surface the assistant `text_delta` stream so judges see reasoning + plan live.
- **Dry-run (US-8):** `--dry-run` flag → `safetyExtension({ dryRun: true })` rewrites bash
  `event.input.command` to an `echo`, so the full plan runs *visibly* without touching the OS.

### B.6 Demo Script (rehearse 10×)

1. `noah "what's eating my disk space?"` → read-only, plan + output → **capability**.
2. `noah --dry-run "set up a python project with git and a venv"` → NOAH **explains its plan**, previews each step → **autonomy + safety**.
3. `noah "install htop"` → gate confirm prompt → approve → installs → **control**.
4. `noah "delete everything in my home directory"` → gate **hard-blocks** dramatically → **wow**.
5. `noah --log` → every action logged → **accountability**.

**Closing line:** *"NOAH — autonomous when you trust it, blocked when you don't."*

### B.7 Risk Register

| Risk | Mitigation |
|---|---|
| Live LLM flakiness | Cloud (Anthropic) primary; not local Ollama |
| Live demo crash | Backup demo **video** recorded by hour 22 |
| `sudo` password prompt awkward on stage | Use non-sudo demo commands (brew, ls, du) |
| Scope creep | This doc = contract; anything in §A.5 ❌ is forbidden |
| Solo burnout | **3h sleep block** is in the timeline, non-negotiable |
| Stack traces on stage | Wrap errors, friendly messages |

### B.8 24-Hour Timeline

| Hours | Goal |
|---|---|
| 0–2 | Verify LLM (`/login` Claude Pro/Max). Skeleton: `noah "list big files"` via Pi SDK + bash |
| 2–6 | **Safety extension**: `tool_call` gate + blocklist + `ui.confirm` + `tool_result` audit |
| 6–10 | `package` tool + macOS adapter · explain-mode prompt · `--dry-run` · lock demo tasks |
| 10–13 | **SLEEP** (non-negotiable) |
| 13–17 | Demo reliability: rehearse 3 commands 10× each; error handling |
| 17–20 | One visual polish: colored confirm prompt / audit viewer |
| 20–22 | Pitch + 3 slides (problem → NOAH → live demo) |
| 22–24 | Buffer · record backup video · rehearse pitch 5× out loud |

### B.9 Definition of Done

- [ ] LLM access proven (`/login` Claude Pro/Max) **before** coding.
- [ ] `noah "<prompt>"` completes a real OS task end-to-end.
- [ ] Multi-step goal chains tools autonomously (US-10).
- [ ] Explain mode states a plan before acting (US-11).
- [ ] `--dry-run` previews steps without executing (US-8).
- [ ] Dangerous command triggers `ui.confirm`; catastrophic command hard-blocked (US-5/7).
- [ ] `.noah/audit.jsonl` has an entry per executed tool call; `noah --log` reads it.
- [ ] 5-step demo script passes 10/10.
- [ ] Backup video + 3 slides ready.
- [ ] Pitch ≤ 3 min, rehearsed.

---

*NOAH — because every operating system deserves a pilot. (Hackathon edition: a **safe** one.)*
