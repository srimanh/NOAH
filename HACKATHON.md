# 🌿 NOAH — Hackathon Build Plan (PRD + LLD)

> **24-hour solo hackathon scope.** This document is the *contract* for what we build.
> The full vision lives in [`NOAH.md`](./NOAH.md). This file is the **ruthless cut**:
> only what wins a live demo against 27 teams. Everything not in here is **out of scope**.

**Author:** Sriman (solo) · **Time budget:** 24h · **Date:** 2026-06-13
**One-liner:** *Natural language controls your computer — and it can't hurt you.*

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

### A.4 Demo-Critical User Stories

| # | As a user I can… | Proves |
|---|---|---|
| 1 | Ask NOAH to inspect my system in plain English | Capability |
| 2 | Ask it to install software — and approve before it runs | Safety + control |
| 3 | Watch it **refuse** a catastrophic command | The "wow" moment |
| 4 | See a log of everything it did | Accountability |

### A.5 Scope

#### ✅ In (must ship in 24h)
- `noah "<natural language>"` CLI built on the **Pi SDK** (`createAgentSession`).
- Tools: reuse Pi's `bash` / `read` / `write`; add **one** abstract `package` tool.
- **Safety layer** (the core feature):
  - `beforeToolCall` → permission gate (confirm dangerous ops, hard-block catastrophic).
  - `afterToolCall` → JSONL audit log.
- Cloud LLM (Anthropic) as the **reliable demo brain**.
- **One OS** (developer's machine — macOS) fully working. Adapter pattern visible in code.

#### 🔜 Nice-to-have (only if ahead of schedule)
- Pretty TUI / colored confirm prompt (red = dangerous).
- Audit-log viewer command (`noah --log`).
- Ollama local provider wired (mention "runs offline").

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
                │  beforeToolCall / afterToolCall hooks
                ▼
        SAFETY LAYER                   ← src/safety/*  ← THE PRODUCT
   gate (confirm) · policy (block) · audit (log)
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
│   └── safety/
│       ├── policy.ts         # blocklist + danger classification
│       ├── gate.ts           # beforeToolCall: confirm / deny
│       └── audit.ts          # afterToolCall: JSONL append
└── .noah/
    └── audit.jsonl           # runtime audit trail
```

### B.3 Key Interfaces

```typescript
// safety/policy.ts
export interface Verdict { action: "allow" | "confirm" | "deny"; reason?: string; }
export function classify(toolName: string, args: unknown): Verdict;
//  - deny    : rm -rf /, dd, mkfs, fork bomb, :(){ :|:& };:
//  - confirm : write, delete, install, sudo, network, package
//  - allow   : read, list, grep, find, status

// safety/gate.ts  (wired to Agent.beforeToolCall)
export async function gate(ctx: ToolCallContext): Promise<HookResult>;

// safety/audit.ts (wired to Agent.afterToolCall)
export function audit(ctx: ToolCallContext): void; // append .noah/audit.jsonl

// platform/adapter.ts
export interface PlatformAdapter {
  pkg(action: "install" | "remove" | "update", pkg?: string): Promise<string>;
}
export const platform: PlatformAdapter; // macOS (brew) for hackathon
```

### B.4 Safety Logic (the core)

```typescript
// pseudo — beforeToolCall
const v = classify(ctx.toolName, ctx.args);
if (v.action === "deny")    return { action: "deny", reason: v.reason };
if (v.action === "confirm")
  return (await confirmInTerminal(ctx)) ? undefined : { action: "deny", reason: "user declined" };
return undefined; // allow

// afterToolCall — always
audit.append({ ts: Date.now(), tool: ctx.toolName, args: ctx.args, ok: !ctx.error });
```

**Blocklist (regex, hard-deny):**
`rm\s+-rf\s+/` · `mkfs` · `dd\s+if=` · `:\(\)\s*\{` (fork bomb) · `>\s*/dev/sd` · `chmod\s+-R\s+777\s+/`

### B.5 Tech Stack (locked)

| Concern | Choice |
|---|---|
| Runtime | Node 22+ / Bun |
| Agent core | `@earendil-works/pi-coding-agent` (SDK mode) |
| Tool schema | `typebox` |
| LLM (demo) | Anthropic (cloud, reliable) |
| LLM (talk-point) | Ollama (offline) — only if time |
| Exec | `execa` |

### B.6 Demo Script (rehearse 10×)

1. `noah "what's eating my disk space?"` → read-only, runs clean → **capability**.
2. `noah "install htop"` → gate confirm prompt → approve → installs → **control**.
3. `noah "delete everything in my home directory"` → gate **blocks** dramatically → **wow**.
4. `cat .noah/audit.jsonl` (or `noah --log`) → every action logged → **accountability**.

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
| 0–2 | Skeleton: `noah "list big files"` runs via Pi SDK + bash tool |
| 2–6 | **Safety layer**: gate + blocklist + audit (the money feature) |
| 6–10 | `package` tool + macOS adapter; lock 3 demo tasks that work 100% |
| 10–13 | **SLEEP** (non-negotiable) |
| 13–17 | Demo reliability: rehearse 3 commands 10× each; error handling |
| 17–20 | One visual polish: colored confirm prompt / audit viewer |
| 20–22 | Pitch + 3 slides (problem → NOAH → live demo) |
| 22–24 | Buffer · record backup video · rehearse pitch 5× out loud |

### B.9 Definition of Done

- [ ] `noah "<prompt>"` completes a real OS task end-to-end.
- [ ] Dangerous command triggers confirm; catastrophic command auto-denied.
- [ ] `.noah/audit.jsonl` has an entry per executed tool call.
- [ ] 3-command demo script passes 10/10.
- [ ] Backup video + 3 slides ready.
- [ ] Pitch ≤ 3 min, rehearsed.

---

*NOAH — because every operating system deserves a pilot. (Hackathon edition: a **safe** one.)*
