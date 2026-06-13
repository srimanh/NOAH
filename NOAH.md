# 🌿 NOAH
## Native Operating-system Agentic Harness

> A cross-platform, LLM-integrated agent layer for Unix-like systems (Linux distros + macOS) that understands natural language and operates the OS — shell, files, packages, services, desktop — **safely and autonomously**.

This plan reverse-engineers the architecture of `pi.dev` (`@earendil-works/pi`) and adapts it for OS control. Like Pi, NOAH runs anywhere Node/Bun runs — **Linux and macOS first-class, Windows later**.

---

## 📌 Table of Contents

1. [Why Copy Pi's Architecture](#why-copy-pis-architecture)
2. [Vision](#vision)
3. [Pi's Architecture (Reverse-Engineered)](#pis-architecture-reverse-engineered)
4. [Our Scope](#our-scope)
5. [Tech Stack](#tech-stack)
6. [System Architecture](#system-architecture)
7. [Safety Design](#safety-design)
8. [Roadmap](#roadmap)
9. [Key Concepts to Learn](#key-concepts-to-learn)

---

## 1 · Why Copy Pi's Architecture

Pi is a production coding agent built by Mario Zechner (`earendil-works`), MIT licensed, TypeScript. It already solves the hard problems we need:

- ✅ The agent loop
- ✅ Multi-provider LLM transport
- ✅ Tool calling & streaming
- ✅ Sessions & compaction
- ✅ A clean extension model

We reuse its proven layering and adapt the tools from *"edit code"* → *"operate the OS"*.

### Two Build Strategies

| Strategy | Description | Trade-off |
|---|---|---|
| **A. Build on Pi's SDK** | `createAgentSession({ customTools })` | Fastest. Loop, sessions, compaction, multi-provider for free. |
| **B. Reimplement Pi's layering** | Own code, same architecture | More learning, full control, no dependency. |

> **Recommendation:** Start with **A** to learn by using it; graduate to **B** where we need OS-specific control (sandboxing, privilege separation).

---

## 2 · Vision

A Pi-like agent for the **whole OS**. Instead of editing code, the agent controls the machine: installs software, manages services, edits config, automates the desktop, watches the system, talks back — local or cloud LLM.

### Cross-Platform Tool Mapping

| Abstract Tool | Linux | macOS |
|---|---|---|
| Package management | `apt` / `dnf` / `pacman` / `zypper` | `brew` / `mas` |
| Service management | `systemd` (`systemctl`) | `launchd` (`launchctl`) |
| Notifications | `notify-send` / `dbus` | `osascript` / `UNNotif.` |
| GUI automation | `ydotool` / `xdotool` | `AppleScript` / `cliclick` |
| Screenshot | `grim` / `scrot` / `import` | `screencapture` |
| Clipboard | `wl-clipboard` / `xclip` | `pbcopy` / `pbpaste` |
| Logs | `journalctl` | `log show` / `log stream` |

### End Artifact

Distributable packages per platform:
- **npm** + single binary (Linux + macOS)
- `.deb` / `.rpm` / `snap` (Linux)
- Homebrew formula + `.pkg` (macOS)
- Bootable Linux **"NOAH OS" ISO** *(stretch goal)*

---

## 3 · Pi's Architecture (Reverse-Engineered)

### 3.1 Monorepo — 3 Layers + Assembler

```
@earendil-works/pi-ai           ← LLM transport (provider-agnostic)
        ↑
@earendil-works/pi-agent-core   ← agent loop + state + tools + sessions
        ↑
@earendil-works/pi-tui          ← terminal UI rendering
        ↑
@earendil-works/pi-coding-agent ← assembler: CLI + 4 run modes + SDK
```

**Stack:** TypeScript + Node 22+. Single binary via `bun build --compile`. Schema validation: `typebox`. License: MIT.

---

### 3.2 Layer 1 — `pi-ai` (Transport)

- Provider abstraction: Anthropic, OpenAI, Bedrock, custom.
- Normalizes every provider to a common `Message[]` + streaming `EventStream` (`text_delta`, `thinking_delta`).
- Key types: `Transport`, `StreamFn`, `EventStream`.

> 💡 **Lesson:** Never couple your LLM provider to anything above it.

---

### 3.3 Layer 2 — `pi-agent-core` (The Brain)

The heart is `agentLoop()` in `agent-loop.ts`:

```typescript
agentLoop(prompts, context, config, signal, streamFn): EventStream<AgentEvent, AgentMessage[]>
// also: agentLoopContinue(...) for retries
```

**Loop flow:** `prompt → LLM stream → tool calls → execute → feed results back → repeat until no tool calls remain`

Works on `AgentMessage` internally; converts to provider `Message[]` **only** at the call boundary via `convertToLlm`. Clean decoupling.

| Component | Description |
|---|---|
| `Agent` class | Stateful wrapper. Owns transcript, lifecycle events, tool execution, retry, abort, `waitForIdle`. |
| `steer()` | Inject message after current turn. |
| `followUp()` | Inject when agent would stop. |
| `beforeToolCall` / `afterToolCall` | **👈 This is exactly where our permission gate + audit log plug in.** |
| `defineTool(...)` | `{ name, parameters: Type.Object(...), execute }`. Typebox schema fed to LLM as function-calling spec. |
| Built-in tools | `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls` |
| Sessions | JSONL files, tree structure (`id`/`parentId`) → enables branch / fork / navigate in place. |
| Compaction | Auto-summarize old context near token limit (`shouldCompact`, `compact`, `findCutPoint`). |

---

### 3.4 Layer 3 — `pi-tui`

Terminal rendering only. Subscribes to agent events and renders. Themes are JSON. **Fully decoupled from the brain.**

---

### 3.5 Assembler — `pi-coding-agent`

Wires it all. Entry: `dist/cli.js`.

| Module | Purpose |
|---|---|
| `AgentSession` (`core/agent-session.ts`) | High-level API: `prompt`, `steer`, `followUp`, `subscribe`. |
| `AgentSessionRuntime` | Session replacement (new / fork / switch / import). |
| `ResourceLoader` | Discovers extensions, skills, prompts, themes, and context files. |
| `AuthStorage` + `ModelRegistry` | Credentials + model resolution. |
| `SettingsManager` | Merges global + project settings. |

**4 Run Modes (one core, many frontends):**

| Mode | Description |
|---|---|
| `interactive` | Full TUI. |
| `print` | Single-shot, exit. |
| `rpc` | JSON-RPC over stdin/stdout (language-agnostic). |
| `sdk` | Embed in your app via `createAgentSession()`. |

---

### 3.6 Extensibility (Pi's Philosophy)

Minimal core, no sub-agents/plan-mode built in. Extend **without forking**:

- **Extensions (TS):** `pi.registerTool()`, `pi.on(event)`, commands.
- **Skills:** Markdown instructions loaded on demand.
- **Prompt templates:** `.md` slash commands.
- **Themes:** JSON.
- **Pi Packages:** Bundle the above, share via npm/git.
- **Event bus:** Extensions talk to each other.

---

### 3.7 Architecture → Agentic OS Mapping

| Pi Concept | Agentic OS Equivalent |
|---|---|
| `pi-ai` transport | LLM provider layer (Ollama + cloud) |
| `agentLoop()` | OS agent loop |
| `defineTool` (bash/edit) | OS tools (`apt` / `systemctl` / gui / …) |
| `beforeToolCall` hook | Permission gate (safety insertion) |
| `afterToolCall` hook | Audit log insertion |
| Sessions (JSONL tree) | Audit trail + branchable memory |
| Extensions / packages | Pluggable OS tool ecosystem |
| RPC mode | Desktop applet / voice frontend → core |
| Compaction | Long-running OS session context mgmt |
| `ResourceLoader` / skills | OS playbooks ("how to set up docker") |

---

## 4 · Our Scope

### ✅ In Scope — v1

- CLI agent: `noah "do X"`
- Cross-platform: Linux + macOS first-class (Unix-like, like Pi)
- Pi-style agent loop (via SDK first, own impl later)
- Pluggable LLM: Ollama (local) + Anthropic/OpenAI (cloud)
- Core OS tools (platform-abstracted): `run_bash`, file r/w/edit, `package` (apt/brew/…), `service` (systemd/launchd)
- Platform-adapter layer: detect OS, route abstract intents to the right backend
- Safety layer in `beforeToolCall`/`afterToolCall`: permission gate, allow/block list, dry-run, audit log
- Session memory (reuse Pi's JSONL tree)
- Desktop: screenshot+vision, GUI automation, clipboard, notifications

### 🔜 In Scope — Later

- MCP client (plug external tool ecosystem)
- Voice: whisper (STT) + piper (TTS)
- Vector long-term memory
- Proactive daemon (journald / log stream watch, system monitor) via RPC mode
- Sub-agents / task planner (Pi leaves this to extensions — so do we)
- Packaging: single binary, `.deb`/`.rpm`/`snap` (Linux), Homebrew + `.pkg` (macOS), bootable Linux ISO

### ❌ Out of Scope (Now)

Custom kernel/init, replacing desktop env, multi-user SaaS, mobile, native Windows *(PowerShell adapter is a later stretch; WSL works today)*.

### 🔒 Non-Negotiable Constraints

> - **Never** run destructive commands without explicit confirmation.
> - Every executed command **logged** (audit trail).
> - Core OS stays **deterministic**; LLM is an optional layer.

---

## 5 · Tech Stack

*(Mirrors Pi)*

| Layer | Choice | Why |
|---|---|---|
| Language / runtime | TypeScript + Node 22+ / Bun | Same as Pi |
| Agent core | `@earendil-works/pi-coding-agent` SDK | Reuse loop / sessions / compaction |
| LLM (local) | Ollama (`qwen2.5-coder`, `llama3.1`) | Offline, free, good tool calling |
| LLM (cloud) | Anthropic / OpenAI via Pi's providers | Quality fallback |
| Tool schemas | `typebox` (Pi uses it) | Function-calling specs |
| Tool ecosystem | `@modelcontextprotocol/sdk` | Plug external tools |
| Process exec | `execa` / `cross-spawn` | Safer `child_process` |
| Memory / vector | `chromadb` / `qdrant` | Long-term recall |
| Packaging | `bun build --compile`, `fpm`, `snapcraft`, Homebrew, `pkgbuild` | Binary + deb/rpm/snap + brew/pkg |
| Platform detect | `process.platform` + adapter registry | Route per-OS backends |

**Target OSes:** Linux (Ubuntu/Debian, Fedora, Arch, openSUSE) and macOS (Apple Silicon + Intel) as first-class. Windows via WSL now, native later. Same TypeScript runs everywhere Node/Bun does — just like Pi.

---

## 6 · System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       Frontends                          │
│  CLI │ Desktop applet │ Voice (STT/TTS) │ TUI            │
│  (talk to core via SDK in-process OR RPC subprocess)     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│        Agent Core  (Pi SDK: AgentSession)                │
│   ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│   │ LLM        │  │ agentLoop()  │  │ Sessions /     │  │
│   │ transport  │◄►│ (Pi brain)   │◄►│ compaction     │  │
│   │ Ollama+API │  └──────┬───────┘  │ (JSONL tree)   │  │
│   └────────────┘         │          └────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │  beforeToolCall / afterToolCall hooks
┌──────────────────────────▼──────────────────────────────┐
│          Safety Layer (in Pi's tool hooks)               │
│   permission gate │ allow/block list │ dry-run │ audit   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│   Abstract OS Tools  (defineTool + MCP)                  │
│  run_bash │ files │ package │ service │ network │ gui    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│   Platform Adapter Layer  (detect OS → route backend)    │
│  Linux: apt/dnf/pacman, systemd, journalctl, ydotool     │
│  macOS: brew/mas, launchd, log stream, AppleScript       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│      Host OS  (Linux: systemd/dbus | macOS: launchd)     │
└──────────────────────────────────────────────────────────┘
```

---

### The Loop + Cross-Platform Tool

```typescript
// Pi gives us the loop. We supply ONE abstract tool whose execute()
// dispatches through the platform adapter — same tool on Linux + macOS.
import { createAgentSession, defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { platform } from "./platform/adapter"; // detects + routes per-OS

const packageTool = defineTool({
  name: "package",
  label: "Package manager",
  description: "Install/remove/update OS packages (apt/dnf/pacman/brew)",
  parameters: Type.Object({
    action: Type.Union([
      Type.Literal("install"),
      Type.Literal("remove"),
      Type.Literal("update")
    ]),
    pkg: Type.Optional(Type.String()),
  }),
  execute: async (_id, p) => {
    // adapter picks apt | dnf | pacman | brew based on process.platform + probe
    const out = await platform.pkg(p.action, p.pkg);
    return { content: [{ type: "text", text: out }], details: {} };
  },
});

const { session } = await createAgentSession({
  customTools: [packageTool /*, bashTool, serviceTool, ... */],
  // safety + audit attach via agent hooks (see §6)
});

await session.prompt("install docker and start it"); // works on Linux + macOS
```

---

### Platform Adapter

```typescript
// src/platform/adapter.ts
import { execa } from "execa";

interface PlatformAdapter {
  pkg(action: string, pkg?: string): Promise<string>;
  service(name: string, action: string): Promise<string>;
  notify(msg: string): Promise<void>;
  screenshot(path: string): Promise<void>;
  logs(unit?: string): Promise<string>;
}

const linuxApt: PlatformAdapter = {
  pkg:        (a, p) => sh(`sudo apt ${a} -y ${p ?? ""}`),
  service:    (n, a) => sh(`sudo systemctl ${a} ${n}`),
  notify:     (m)    => sh(`notify-send "${m}"`).then(() => {}),
  screenshot: (f)    => sh(`grim ${f}`).then(() => {}),
  logs:       (u)    => sh(`journalctl ${u ? "-u " + u : ""} -n 200 --no-pager`),
};

const macos: PlatformAdapter = {
  pkg:        (a, p) => sh(`brew ${a === "update" ? "upgrade" : a} ${p ?? ""}`),
  service:    (n, a) => sh(`launchctl ${a === "start" ? "load" : "unload"} ${n}`),
  notify:     (m)    => sh(`osascript -e 'display notification "${m}"'`).then(() => {}),
  screenshot: (f)    => sh(`screencapture ${f}`).then(() => {}),
  logs:       (u)    => sh(`log show --last 5m ${u ? `--predicate 'process == "${u}"'` : ""}`),
};

export const platform: PlatformAdapter =
  process.platform === "darwin" ? macos
  : /* probe apt/dnf/pacman/zypper */ linuxApt;
```

---

### Module Layout

```
noah/
├── package.json              # bin: noah
├── src/
│   ├── cli.ts                # entry, arg parsing
│   ├── session.ts            # wraps createAgentSession()
│   ├── llm/
│   │   └── ollama-provider.ts  # register local model into Pi registry
│   ├── platform/             # CROSS-PLATFORM core
│   │   ├── adapter.ts        # PlatformAdapter interface + detection
│   │   ├── linux.ts          # apt/dnf/pacman/zypper, systemd, journalctl
│   │   └── macos.ts          # brew/mas, launchd, log stream, osascript
│   ├── tools/                # ABSTRACT OS tools as defineTool()
│   │   ├── bash.ts
│   │   ├── files.ts          # (or reuse Pi's read/edit/write)
│   │   ├── package.ts        # → platform.pkg()
│   │   ├── service.ts        # → platform.service()
│   │   ├── network.ts
│   │   └── desktop.ts        # screenshot/gui (later)
│   ├── safety/
│   │   ├── gate.ts           # beforeToolCall: confirm dangerous ops
│   │   ├── policy.ts         # allow/block list, dry-run
│   │   └── audit.ts          # afterToolCall: log every action
│   ├── mcp/
│   │   └── client.ts         # connect MCP servers (later)
│   └── memory/
│       └── vector.ts         # long-term recall (later)
└── tests/
```

---

## 7 · Safety Design

Mapped onto Pi's hooks. Pi's `Agent` exposes `beforeToolCall(context)` and `afterToolCall(context)`. We put **ALL safety there** — clean, central, can't be bypassed by a tool.

```typescript
// beforeToolCall — permission gate + policy
beforeToolCall: async (ctx) => {
  if (policy.isBlocked(ctx.toolName, ctx.args))     // rm -rf /, dd, fork bombs
    return { action: "deny", reason: "blocked by policy" };

  if (policy.isDangerous(ctx.toolName, ctx.args))   // write/delete/install/net/sudo
    if (!(await confirmWithUser(ctx)))               // show exact command first
      return { action: "deny", reason: "user declined" };

  return undefined; // allow
},

// afterToolCall — audit log
afterToolCall: async (ctx) => {
  audit.append({ ts: Date.now(), tool: ctx.toolName, args: ctx.args, result: ctx.result });
  return undefined;
},
```

### Risk Matrix

| Risk | Mitigation | Where |
|---|---|---|
| Destructive command | Confirm gate | `beforeToolCall` |
| Hallucinated `rm -rf /` | Hard blocklist | `policy.ts` |
| Privilege escalation | Separate sudo confirmation | `gate.ts` |
| Data exfiltration | Network tool gated + audited | `gate.ts` + `audit.ts` |
| Runaway autonomy | Step limit, dry-run default, `abort()` | `session.ts` |
| No accountability | `afterToolCall` audit log, JSONL session | `audit.ts` |

> **Default mode** = ask before any write / delete / install / network / sudo operation.

---

## 8 · Roadmap

### Phase 0 — Study Pi *(Week 1)*
- Install Pi (`npm i -g @earendil-works/pi`), use it, read its docs.
- Read source: `agent-loop.ts`, `agent.ts`, `core/tools/bash.ts`, `core/agent-session.ts`, SDK examples (`examples/sdk/`).
- Run SDK example 05 (custom tools) and 06 (extensions).

**Outcome:** Understand loop, tools, hooks, sessions firsthand.

---

### Phase 1 — Minimal Cross-Platform Agent on Pi SDK *(Weeks 2–3)*
- `createAgentSession({ customTools: [bashTool] })`.
- `platform/adapter.ts`: detect Linux vs macOS, stub `pkg`/`service`.
- Add `beforeToolCall` confirm gate + `afterToolCall` audit log.
- Register Ollama as a provider/model.
- CLI: `noah "show big files in home"`. Test on Linux **AND** macOS.

**Outcome:** Working single-tool OS agent with safety, both OSes.

---

### Phase 2 — Core Tools + Adapters + Policy *(Weeks 4–5)*
- Abstract tools: `package`, `service`, `network`, `files` (reuse Pi's).
- Full Linux adapter (apt/dnf/pacman/zypper, systemd) + macOS adapter (brew/mas, launchd).
- `policy.ts`: blocklist + dry-run + privilege gate (sudo / osascript).
- Cloud provider fallback.

**Outcome:** Real multi-tool OS tasks, safe, Linux + macOS.

---

### Phase 3 — Distribution *(Week 6)*
- `bun build --compile` → single binary per OS (same as Pi ships).
- Linux: `fpm` → `.deb` + `.rpm`; `snapcraft` → `snap`.
- macOS: Homebrew formula/tap + `pkgbuild` → `.pkg`.
- npm package works on both.

**Outcome:** Installable on Linux + macOS.

---

### Phase 4 — Extensions / MCP / RPC *(Weeks 7–9)*
- Expose tools as Pi extensions / MCP servers.
- Use Pi's RPC mode so desktop applet + voice talk to one core.

**Outcome:** Extensible, multi-frontend.

---

### Phase 5 — Multimodal *(Weeks 10–12)*
- Desktop tools via adapter: screenshot (`grim`/`screencapture`), GUI automate (`ydotool`/`xdotool` | AppleScript/`cliclick`), clipboard (`wl-clipboard`/`xclip` | `pbcopy`/`pbpaste`), notifications.
- Voice: whisper (STT) + piper (TTS) frontends over RPC.

**Outcome:** Feels like an "AI OS" on both platforms.

---

### Phase 6 — Proactive + Memory *(Week 13+)*
- Background daemon (systemd service on Linux / launchd agent on macOS): watch logs + system monitor; suggest/act.
- Vector long-term memory + user profile (Pi context files / skills).

**Outcome:** OS that knows you and acts ahead.

---

### Phase 7 — The Distro *(Stretch, Linux only)*
- `live-build`/Cubic Ubuntu remaster; preinstall NOAH + Ollama + model + systemd service.

**Outcome:** Bootable "NOAH OS" ISO. *(macOS stays an installable app.)*

---

## 9 · Key Concepts to Learn

| Concept | Details |
|---|---|
| **Pi's agent loop** | `agentLoop` / `agentLoopContinue`, the `Agent` class |
| **Tool definition** | `defineTool` + typebox schemas |
| **Tool hooks** | `beforeToolCall` / `afterToolCall` — our safety home |
| **Multi-provider transport** | Pi `pi-ai`, registering Ollama |
| **Sessions as JSONL trees** | Branching, compaction |
| **Run modes** | SDK vs RPC vs print vs interactive |
| **Extensions & packages** | Extend without forking |
| **Cross-platform OS internals** | Linux: systemd, dbus, deb/rpm/snap, live-build; macOS: launchd, Homebrew, osascript, `.pkg`, code-signing & notarization |
| **Platform adapter pattern** | `process.platform` detection, capability probing, graceful fallback when a backend is missing |

---

*NOAH — because every operating system deserves a pilot.*