NOAH: Native Operating-system Agentic Harness: Project Plan 
A cross-platform, LLM-integrated agent layer for Unix-like systems (Linux distros + macOS) that understands natural language and operates the OS (shell, files, packages, services, desktop) safely and autonomously.
This plan reverse-engineers the architecture of pi.dev (@earendil-works/pi) and adapts it for OS control. Like Pi, NOAH runs anywhere Node/Bun runs — Linux and macOS first-class, Windows later.

0. Why Copy Pi's Architecture
Pi is a production coding agent built by Mario Zechner (earendil-works), MIT licensed, TypeScript. It already solves the hard problems we need: the agent loop, multi-provider LLM transport, tool calling, streaming, sessions, compaction, and a clean extension model. We reuse its proven layering and adapt the tools from "edit code" to "operate the OS".
Two strategies (we pick per phase):
A. Build on Pi's SDK — createAgentSession({ customTools }). Fastest. Get loop, sessions, compaction, and multi-provider for free.
B. Reimplement Pi's layering — own code, same architecture. More learning, full control, no dependency.
Recommendation: Start with A to learn by using it; graduate to B where we need OS-specific control (sandboxing, privilege separation).

1. Vision
A Pi-like agent for the whole OS. Instead of editing code, the agent controls the machine: installs software, manages services, edits config, automates the desktop, watches the system, talks back — local or cloud LLM.
Cross-platform like Pi. One agent core, one tool interface, with a thin platform-adapter layer that maps abstract intents ("install package", "manage service") to the right backend per OS:
Abstract tool
Linux
macOS
package mgmt
apt/dnf/pacman/zypper
brew/mas
service mgmt
systemd (systemctl)
launchd (launchctl)
notifications
notify-send/dbus
osascript/UNNotif.
gui automate
ydotool/xdotool
AppleScript/cliclick
screenshot
grim/scrot/import
screencapture
clipboard
wl-clipboard/xclip
pbcopy/pbpaste
logs
journalctl
log show/log stream

End artifact: distributable package per platform — npm + single binary (Linux + macOS), then .deb/.rpm/snap (Linux), Homebrew formula + .pkg (macOS), and a bootable Linux "NOAH OS" ISO as a stretch goal.

2. Pi's Architecture (reverse-engineered)
2.1 Monorepo, 3-layered packages + assembler
@earendil-works/pi-ai           ← LLM transport (provider-agnostic)
        ↑
@earendil-works/pi-agent-core   ← agent loop + state + tools + sessions
        ↑
@earendil-works/pi-tui          ← terminal UI rendering
        ↑
@earendil-works/pi-coding-agent ← assembler: CLI + 4 run modes + SDK

Stack: TypeScript + Node 22+. Single binary via bun build --compile. Schema validation: typebox. License: MIT.
2.2 Layer 1 — pi-ai (transport)
Provider abstraction: Anthropic, OpenAI, Bedrock, custom.
Normalizes every provider to a common Message[] + streaming EventStream (text_delta, thinking_delta).
Key types: Transport, StreamFn, EventStream.
Lesson: never couple your LLM provider to anything above it.
2.3 Layer 2 — pi-agent-core (the brain)
The heart is agentLoop() (agent-loop.ts):
agentLoop(prompts, context, config, signal, streamFn)
  : EventStream<AgentEvent, AgentMessage[]>
// also: agentLoopContinue(...) for retries

Loop: prompt → LLM stream → tool calls → execute → feed results back → repeat until no tool calls remain.
Works on AgentMessage internally; converts to provider Message[] ONLY at the call boundary via convertToLlm. Decoupling.
Agent class = stateful wrapper. Owns transcript, lifecycle events (subscribe), tool execution, retry, abort, waitForIdle.
Queues: steer() (inject after current turn) and followUp() (inject when agent would stop).
Hooks: beforeToolCall / afterToolCall → THIS is exactly where our permission gate + audit log plug in.
Tools: defineTool({ name, parameters: Type.Object(...), execute }). Typebox schema fed to LLM as function-calling spec. Built-ins: read, bash, edit, write, grep, find, ls.
Sessions: JSONL files, tree structure (id/parentId) → enables branch / fork / navigate in place. jsonl-repo, memory-repo.
Compaction: auto-summarize old context near token limit (shouldCompact, compact, findCutPoint).
2.4 Layer 3 — pi-tui
Terminal rendering only. Subscribes to agent events, renders. Themes are JSON. Fully decoupled from the brain.
2.5 Assembler — pi-coding-agent
Wires it all. Entry dist/cli.js. Key modules:
AgentSession (core/agent-session.ts) — high-level API: prompt, steer, followUp, subscribe.
AgentSessionRuntime — session replacement (new/fork/switch/import).
ResourceLoader — discovers extensions, skills, prompts, themes, and context files.
AuthStorage + ModelRegistry — credentials + model resolution.
SettingsManager — merges global + project settings.
4 run modes (one core, many frontends):
interactive — full TUI.
print — single-shot, exit.
rpc — JSON-RPC over stdin/stdout (language-agnostic).
sdk — embed in your app via createAgentSession().
2.6 Extensibility (Pi's philosophy)
Minimal core, no sub-agents/plan-mode built in. Extend WITHOUT forking:
Extensions (TS): pi.registerTool(), pi.on(event), commands.
Skills: markdown instructions loaded on demand.
Prompt templates: .md slash commands.
Themes: JSON.
Pi Packages: bundle the above, share via npm/git.
Event bus: extensions talk to each other.
2.7 Architecture → Agentic OS mapping
Pi concept
Agentic OS equivalent
pi-ai transport
LLM provider layer (Ollama + cloud)
agentLoop()
OS agent loop
defineTool (bash/edit)
OS tools (apt/systemctl/gui/...)
beforeToolCall hook
permission gate (safety insertion)
afterToolCall hook
audit log insertion
sessions (JSONL tree)
audit trail + branchable memory
extensions / packages
pluggable OS tool ecosystem
RPC mode
desktop applet / voice frontend → core
compaction
long-running OS session context mgmt
ResourceLoader/skills
OS playbooks ("how to set up docker")


3. Our Scope
In scope (v1)
CLI agent: noah "do X".
Cross-platform: Linux + macOS first-class (Unix-like, like Pi).
Pi-style agent loop (via SDK first, own impl later).
Pluggable LLM: Ollama (local) + Anthropic/OpenAI (cloud).
Core OS tools (platform-abstracted): run_bash, file r/w/edit, package (apt/brew/...), service (systemd/launchd).
Platform-adapter layer: detect OS, route abstract intents to the right backend.
Safety layer in beforeToolCall/afterToolCall: permission gate, allow/block list, dry-run, audit log.
Session memory (reuse Pi's JSONL tree).
Desktop: screenshot+vision, GUI automation, clipboard, notifications.
In scope (later)
MCP client (plug external tool ecosystem).
Voice: whisper (STT) + piper (TTS).
Vector long-term memory.
Proactive daemon (journald / log stream watch, system monitor) via RPC mode.
Sub-agents / task planner (Pi leaves this to extensions — so do we).
Packaging per platform: single binary, .deb/.rpm/snap (Linux), Homebrew + .pkg (macOS), bootable Linux ISO.
Out of scope (now)
Custom kernel/init, replacing desktop env, multi-user SaaS, mobile, native Windows (PowerShell adapter is a later stretch; WSL works today).
Non-negotiable constraints
Never run destructive commands without explicit confirmation.
Every executed command logged (audit trail).
Core OS stays deterministic; LLM is an optional layer.

4. Tech Stack (mirrors Pi)
Layer
Choice
Why
Language/runtime
TypeScript + Node 22+ / Bun
Same as Pi
Agent core
@earendil-works/pi-coding-agent SDK
Reuse loop/sessions/compaction
LLM (local)
Ollama (qwen2.5-coder, llama3.1)
Offline, free, good tool calling
LLM (cloud)
Anthropic / OpenAI via Pi's providers
Quality fallback
Tool schema
typebox (Pi uses it)
Function-calling specs
Tool ecosystem
@modelcontextprotocol/sdk
Plug external tools
Process exec
execa / cross-spawn
Safer child_process
Memory/vectors
chromadb / qdrant
Long-term recall
Packaging
bun build --compile, fpm, snapcraft, Homebrew, pkgbuild
binary + deb/rpm/snap + brew/pkg
Platform detect
process.platform + adapter registry
route per-OS backends

Target OSes: Linux (Ubuntu/Debian, Fedora, Arch, openSUSE) and macOS (Apple Silicon + Intel) as first-class. Windows via WSL now, native later. Same TypeScript runs everywhere Node/Bun does — just like Pi.

5. System Architecture (our build, Pi-shaped)
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


The loop + cross-platform tool (we get the loop from Pi)
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
    action: Type.Union([Type.Literal("install"), Type.Literal("remove"), Type.Literal("update")]),
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


Platform adapter (the cross-platform core)
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
  pkg: (a, p) => sh(`sudo apt ${a} -y ${p ?? ""}`),
  service: (n, a) => sh(`sudo systemctl ${a} ${n}`),
  notify: (m) => sh(`notify-send "${m}"`).then(() => {}),
  screenshot: (f) => sh(`grim ${f}`).then(() => {}),
  logs: (u) => sh(`journalctl ${u ? "-u " + u : ""} -n 200 --no-pager`),
};

const macos: PlatformAdapter = {
  pkg: (a, p) => sh(`brew ${a === "update" ? "upgrade" : a} ${p ?? ""}`),
  service: (n, a) => sh(`launchctl ${a === "start" ? "load" : "unload"} ${n}`),
  notify: (m) => sh(`osascript -e 'display notification "${m}"'`).then(() => {}),
  screenshot: (f) => sh(`screencapture ${f}`).then(() => {}),
  logs: (u) => sh(`log show --last 5m ${u ? "--predicate 'process == \"" + u + "\"'" : ""}`),
};

export const platform: PlatformAdapter =
  process.platform === "darwin" ? macos
  : /* probe apt/dnf/pacman/zypper */ linuxApt;


Our module layout (own code where we diverge from Pi)
noah/
├── package.json              # bin: noah
├── src/
│   ├── cli.ts                # entry, arg parsing
│   ├── session.ts            # wraps createAgentSession()
│   ├── llm/
│   │   └── ollama-provider.ts# register local model into Pi registry
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



6. Safety Design (mapped onto Pi's hooks)
Pi's Agent exposes beforeToolCall(context) and afterToolCall(context). We put ALL safety there — clean, central, can't be bypassed by a tool.
// beforeToolCall — permission gate + policy
beforeToolCall: async (ctx) => {
  if (policy.isBlocked(ctx.toolName, ctx.args))   // rm -rf /, dd, fork bombs
    return { action: "deny", reason: "blocked by policy" };
  if (policy.isDangerous(ctx.toolName, ctx.args)) // write/delete/install/net/sudo
    if (!(await confirmWithUser(ctx)))            // show exact command first
      return { action: "deny", reason: "user declined" };
  return undefined; // allow
},

// afterToolCall — audit log
afterToolCall: async (ctx) => {
  audit.append({ ts: Date.now(), tool: ctx.toolName, args: ctx.args, result: ctx.result });
  return undefined;
},


Risk
Mitigation (where)
Destructive command
confirm gate in beforeToolCall
Hallucinated rm -rf /
hard blocklist in policy.ts
Privilege escalation
separate sudo confirmation
Data exfiltration
network tool gated + audited
Runaway autonomy
step limit, dry-run default, abort()
No accountability
afterToolCall audit log, JSONL session

Default mode = ask before any write/delete/install/network/sudo op.

7. Roadmap (phased) - LLM generated  no need to read this now : ) 
Phase 0 — Study Pi (week 1)
Install Pi (npm i -g @earendil-works/pi), use it, read its docs.
Read source: agent-loop.ts, agent.ts, core/tools/bash.ts, core/agent-session.ts, SDK examples (examples/sdk/).
Run SDK example 05 (custom tools) and 06 (extensions).
Outcome: understand loop, tools, hooks, sessions firsthand.
Phase 1 — Minimal cross-platform agent on Pi SDK (week 2-3)
createAgentSession({ customTools: [bashTool] }).
platform/adapter.ts: detect Linux vs macOS, stub pkg/service.
Add beforeToolCall confirm gate + afterToolCall audit log.
Register Ollama as a provider/model.
CLI: noah "show big files in home". Test on Linux AND macOS.
Outcome: working single-tool OS agent with safety, both OSes.
Phase 2 — Core tools + adapters + policy (week 4-5)
Abstract tools: package, service, network, files (reuse Pi's).
Full Linux adapter (apt/dnf/pacman/zypper, systemd) + macOS adapter (brew/mas, launchd).
policy.ts: blocklist + dry-run + privilege gate (sudo / osascript).
Cloud provider fallback.
Outcome: real multi-tool OS tasks, safe, Linux + macOS.
Phase 3 — Distribution (week 6)
bun build --compile → single binary per OS (same as Pi ships).
Linux: fpm → .deb + .rpm; snapcraft → snap.
macOS: Homebrew formula/tap + pkgbuild → .pkg.
npm package works on both.
Outcome: installable on Linux + macOS.
Phase 4 — Extensions / MCP / RPC (week 7-9)
Expose tools as Pi extensions / MCP servers.
Use Pi's RPC mode so desktop applet + voice talk to one core.
Outcome: extensible, multi-frontend.
Phase 5 — Multimodal (week 10-12)
Desktop tools via adapter: screenshot (grim/screencapture), GUI automate (ydotool/xdotool | AppleScript/cliclick), clipboard (wl-clipboard/xclip | pbcopy/pbpaste), notifications.
Voice: whisper (STT) + piper (TTS) frontends over RPC.
Outcome: feels like an "AI OS" on both platforms.
Phase 6 — Proactive + memory (week 13+)
Background daemon (systemd service on Linux / launchd agent on macOS): watch logs + system monitor; suggest/act.
Vector long-term memory + user profile (Pi context files / skills).
Outcome: OS that knows you and acts ahead.
Phase 7 — The distro (stretch, Linux only)
live-build/cubic Ubuntu remaster; preinstall NOAH + Ollama + model + systemd service.
Outcome: bootable "NOAH OS" ISO. (macOS stays an installable app.)

8. Key Concepts to Learn
Pi's agent loop — agentLoop / agentLoopContinue, the Agent class.
Tool definition — defineTool + typebox schemas.
Tool hooks — beforeToolCall / afterToolCall (our safety home).
Multi-provider transport — Pi pi-ai, registering Ollama.
Sessions as JSONL trees — branching, compaction.
Run modes — SDK vs RPC vs print vs interactive.
Extensions & packages — extend without forking.
Cross-platform OS internals — Linux: systemd, dbus, deb/rpm/snap, live-build; macOS: launchd, Homebrew, osascript, .pkg, code-signing
notarization.
Platform adapter pattern — process.platform detection, capability probing, graceful fallback when a backend is missing.


