# 🧠 NOAH — Judge Q&A Sheet

Likely questions + tight, confident answers. Read aloud until they're reflex.
Keep answers ~2 sentences. Offer to *show* it (`--check`, `--log`) when relevant.

---

## Product / positioning

**Q: Isn't this just ChatGPT wired to a shell?**
> The LLM + shell part is trivial. The product is the **safety layer**: a gate that
> hard-blocks catastrophic commands, confirms anything that changes the system, and
> logs every action. NOAH is autonomous when you trust it, blocked when you don't.

**Q: Who is this for?**
> Developers and power users who want to operate their OS in plain English without
> memorizing commands — and anyone nervous about giving an AI shell access.

**Q: What's the one thing that makes it different?**
> The safety gate lives in the agent pipeline, not inside any tool — so no command
> runs without passing through it. I can prove it deterministically: `noah --check`.

---

## Architecture / system design

**Q: Walk me through how it works end to end.**
> Plain-English prompt → the agent loop calls the LLM → the model emits tool calls →
> each call passes the safety gate → tools execute through a platform adapter → results
> feed back to the model → it loops until the goal is met. Every step is audited.

**Q: Why build on the Pi SDK instead of from scratch?**
> Pi gives us a proven agent loop, sessions, compaction, and multi-provider transport.
> I focused my time on the actual product — the safety layer and the OS tooling —
> instead of re-solving the loop.

**Q: Where exactly does the safety gate plug in?**
> Pi exposes a `tool_call` hook that fires *before* execution; returning `{ block: true }`
> denies it. A `tool_result` hook fires after, where I write the audit log. The tool
> can't run without going through `tool_call` first.

**Q: How is it cross-platform?**
> A `PlatformAdapter` interface with per-OS backends — brew on macOS, apt on Linux.
> The abstract `package` tool calls the adapter, so the same tool works on both. I
> tested the Linux path in a Debian container.

**Q: What about context length on long sessions?**
> Pi auto-compacts: it summarizes old context near the token limit, so long-running
> sessions keep working.

---

## Safety / security (they'll push hardest here)

**Q: What stops a hallucinated `rm -rf /`?**
> A hard blocklist in the gate — `rm -rf /`, fork bombs, `mkfs`, `dd` to a raw disk,
> `shutdown`, and more. It returns deny with no override. Want me to show it? `noah --check "rm -rf /"`.

**Q: Can a clever prompt talk it past the gate?**
> The block is code in the tool pipeline, not an instruction to the model. No prompt
> changes what `classify()` returns, so prompt injection can't unlock a blocked command.

**Q: What's your threat model?**
> Three risks: a hallucinated destructive command, prompt injection from file/tool
> output, and privilege escalation. Mitigations: hard blocklist, confirm-on-mutate,
> full audit trail, dry-run preview, and sudo treated as dangerous.

**Q: How do I know it's not lying about what it ran?**
> Every executed tool call is appended to `.noah/audit.jsonl` from the `tool_result`
> hook — independent of the model's narration. `noah --log` shows it.

**Q: What if classify() misses a dangerous command?**
> Two layers: catastrophic patterns hard-deny, and *anything* that creates, deletes,
> or writes — including redirects — requires confirmation, so an unknown mutation still
> stops for human approval rather than running silently.

**Q: Is there a sandbox?**
> Not yet — it runs with the user's permissions, like any local dev tool. The gate +
> audit are the current safety model; OS-level sandboxing is on the roadmap.

---

## Implementation / engineering

**Q: What's the stack?**
> TypeScript on Node 22, the Pi coding-agent SDK, typebox for tool schemas. Built-in
> tools handle shell/file ops; our `package` tool shells out through the platform adapter.
> The terminal UI is a small zero-dependency ANSI renderer — no framework.

**Q: Why no Ink/React for the UI?**
> Our CLI is single-shot streaming, not a full-screen app. A re-rendering framework
> would have meant rewriting the output layer and risking a working demo. An ANSI panel
> renderer fit the streaming model, stayed dependency-free, and couldn't break the core.

**Q: How do you handle a command that hangs or errors?**
> Commands run with a timeout; tool errors are captured and fed back to the model, which
> reports them rather than crashing. The audit line marks failures with a red ✗, and the
> user can abort the session at any time.

**Q: How would you distribute it?**
> npm package today; a single binary via `bun build --compile`, plus `.deb`/`.rpm` and
> a Homebrew formula are the packaging path.

---

## Curveballs

**Q: What would you do with one more week?**
> OS-level sandboxing, an MCP client to plug in external tools, and a proactive daemon
> that watches logs and suggests actions.

**Q: What broke during the build?**
> The safety policy initially missed create/delete variants like `rmdir` and `>` redirects,
> and dry-run leaked files via the write tool. I caught both with tests and fixed the
> classification and the dry-run gate. That's why there's a smoke test now.

**Q: Cloud or local LLM?**
> Both. Claude via subscription OAuth for demo quality; Ollama as an offline fallback for
> privacy. The provider is decoupled, so swapping is a config change.
