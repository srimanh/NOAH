# 🏗️ NOAH Architecture — a contributor's guide

New here? This document gets you productive fast: the mental model, how a request
flows, where every piece of code lives, and how to add your own feature.

> **Read this once and you'll know where to put almost anything.**

---

## 1. The one idea: the trunk

NOAH has a single design rule that every feature obeys:

> **Every action is _gated_ (safety), _audited_ (accountability), and _reversible_ (undo).**

If a capability can't be gated, audited, and undone, we redesign it until it can.
This "trunk" is why NOAH is trustworthy on real machines — and it's the first
thing to check in any PR.

```
 natural language ─▶ Agent loop ─▶ tool call
                                     │
                            ┌────────▼─────────┐
                            │  SAFETY GATE     │  deny / confirm / allow   (src/safety)
                            └────────┬─────────┘
                                     │ allowed
                            ┌────────▼─────────┐
                            │  TOOL EXECUTES   │  bash·files·package·service·…  (src/tools)
                            └────────┬─────────┘
                       ┌─────────────┼──────────────┐
                       ▼             ▼              ▼
                   AUDIT LOG     OPS LEDGER      SNAPSHOTS      (accountability + undo)
                  audit.jsonl    ops.jsonl       snapshots/     (src/safety, src/ops)
```

Both the gate and the recorders are **extensions in the agent pipeline**
(`pi.on("tool_call")` / `pi.on("tool_result")`), so *no tool can run without
passing through them* — the guarantee can't be bypassed by any single tool.

---

## 2. Request lifecycle (follow one message through the system)

1. **Entry** — `src/cli.ts` parses argv. Interactive → `src/tui/space/app.ts`;
   single-shot → `src/session.ts`; embedded → `src/modes/rpc.ts`.
2. **Wiring** — `src/runtime.ts` is the single source of truth for how a NOAH
   agent is assembled: system prompt, tools, and the extension stack
   (safety + snapshot + caveman + user extensions).
3. **Model** — `src/llm/` resolves which model to use (flag → env → last-used →
   first available) across providers (cloud + Ollama).
4. **Turn** — the TUI calls `session.prompt(text)`; `src/ops/context.ts` marks
   the current turn so any changes are tagged to this message.
5. **Tool call** — the model calls a tool. `src/safety/extension.ts` classifies
   it (`src/safety/policy.ts`): **deny** → blocked; **confirm** → asks; **allow**
   → runs. The snapshot extension snapshots files about to change.
6. **Execute & record** — the tool runs through the `PlatformAdapter`
   (`src/platform/`); on success it records a reversible op
   (`src/ops/engine.ts`) and an audit entry (`src/safety/audit.ts`).
7. **Recover** — later, `noah undo` / `/rewind` replay inverses or restore
   snapshots; `noah report` folds the audit + ledger into a timeline.

---

## 3. Directory map

Everything in `src/`. Each folder is a subsystem with its own tests next to it.

| Path | What it is | Start file |
|---|---|---|
| `src/cli.ts` | Command-line entry; routes subcommands & flags | `cli.ts` |
| `src/runtime.ts` | **How a NOAH agent is wired** (prompt + tools + extensions) | `runtime.ts` |
| `src/session.ts` | Single-shot (`--print`) run | `session.ts` |
| `src/sdk.ts` | Public SDK surface for embedding NOAH | `sdk.ts` |
| `src/llm/` | Provider abstraction, model registry, resolution, Ollama | `resolve.ts` |
| `src/platform/` | Cross-platform adapter (apt/dnf/pacman/zypper/brew, systemd/launchd) | `adapter.ts` |
| `src/tools/` | The tools the agent can call (package·service·network·system·logs) | `package.ts` |
| `src/safety/` | **The gate**: policy, confirm, audit, deps integrity, extension | `policy.ts` |
| `src/ops/` | **Reversible Operations Engine**: ledger, inverse, snapshots, undo, rewind | `engine.ts` |
| `src/sys/` | Telemetry probe, health rules, doctor report | `probe.ts` |
| `src/playbooks/` | Curated, gated, reversible multi-step recipes | `runner.ts` |
| `src/skills/` | Signed (ed25519) + permission-scoped capability packages | `store.ts` |
| `src/memory/` | Local recall — store, scoring, telemetry capture | `recall.ts` |
| `src/sentinel/` | Proactive health watch (diff + alerts + loop + notify) | `watch.ts` |
| `src/fleet/` | Many machines over SSH (inventory + transport + fan-out) | `coordinator.ts` |
| `src/report/` | Signed incident reports (timeline + render + sign) | `incident.ts` |
| `src/prompt/` | The system prompt + tool prompts (NOAH's doctrine) | `system.ts` |
| `src/agent/` | Login/OAuth, caveman mode, auth gate, config, update checks | `login.ts` |
| `src/tui/` | The terminal UI; `space/` is NOAH's custom cinematic console | `space/app.ts` |
| `src/ui/` | ANSI/render helpers for plain-CLI output | `render.ts` |
| `src/bench/` | Benchmark harness (`noah benchmark`) | `runner.ts` |
| `src/modes/` | RPC + benchmark run modes | `rpc.ts` |
| `src/ext/` | Extension loader + built-in shims | `loader.ts` |

Other top-level: `web/` (the landing page, its own Vite app), `themes/`,
`scripts/smoke.sh`, `dist/` (compiled, gitignored).

---

## 4. Core subsystems, a little deeper

- **Safety (`src/safety/`)** — `policy.ts` is a pure classifier:
  `(toolName, input) → { action: deny|confirm|allow, reason }`. `extension.ts`
  wires it into the pipeline and also neutralises side effects in `--dry-run`.
  `deps.ts` is the supply-chain guard (`noah --verify-deps`).
- **Ops (`src/ops/`)** — the crown jewel. `ledger.ts` is an append-only event
  log; `inverse.ts` synthesises the opposite of an action; `snapshot.ts`
  content-addresses file backups; `engine.ts` records ops and runs `undo` /
  `rewindTo`. Everything else (playbooks, skills, rewind) composes on top.
- **Platform (`src/platform/`)** — the only place that knows about specific OS
  tools. Add OS behaviour here behind `PlatformAdapter`, never in a tool.
- **LLM (`src/llm/`)** — providers + a registry; `resolve.ts` decides the model.

---

## 5. How to add things (recipes)

**A new tool** → add `src/tools/<name>.ts` with `defineTool`, classify it in
`src/safety/policy.ts`, register it in `runtime.ts` (`NOAH_TOOLS`), and if it
mutates, make it record a reversible op (see `package.ts`). Test the pure parts.

**A new CLI command** → add an `argv[0] === "<name>"` branch in `src/cli.ts` and
a usage line; keep the logic in a tested module under `src/<area>/`.

**OS-specific behaviour** → extend `PlatformAdapter` and add mappings in
`linux.ts` / `macos.ts`; test both.

**A reversible action** → produce a `ToolAction` whose `inverseOf()` is non-null,
or attach a snapshot; then it's automatically undoable and rewindable.

---

## 6. Testing philosophy

- **TDD, always** — Red → Green → Refactor. Test first.
- **Pure cores, injected edges** — parsers, policy, scoring, diffs, fan-out are
  pure functions tested directly. I/O (fs, network, ssh, clock) is passed in as
  a parameter so tests use fakes — **never hit the real system or network**.
- **Tests live next to code** (`foo.ts` + `foo.test.ts`).
- Run: `npm test` (full suite) · `node --import tsx --test src/ops/engine.test.ts`
  (one file) · `./scripts/smoke.sh` (end-to-end).

---

## 7. Where to start as a contributor

- **Easiest wins:** a new built-in **playbook** (`src/playbooks/builtins.ts`) or
  health rule (`src/sys/health.ts`) — pure data/logic, easy to test.
- **Medium:** a new **tool** or a **platform** mapping.
- **Deep:** the **ops engine** (extend reversibility, e.g. more file ops) or the
  TUI (`src/tui/space/`).

Open an issue describing the change, write the failing test first, and send a
focused PR. See [CONTRIBUTING.md](./CONTRIBUTING.md). Welcome aboard. 🛰️
