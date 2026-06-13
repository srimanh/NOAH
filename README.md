# 🌿 NOAH

### Native Operating-system Agentic Harness

> Natural language controls your computer — **autonomously, and it can't hurt you.**

NOAH is a CLI agent that understands plain English and operates your OS — shell, files,
packages — through a **safety gate**. Every dangerous action is confirmed, every
catastrophic action is hard-blocked, and every action is logged to an audit trail.

Built on the [Pi](https://pi.dev) agent SDK (`@earendil-works/pi-coding-agent`).

---

## Why NOAH

Wiring an LLM to a shell is trivial. Making it **safe** — and *demonstrably* safe — is not.
That safety layer is the product:

- **Autonomous** — give a multi-step goal, NOAH plans and chains the steps itself.
- **Explain-first** — states its plan before acting.
- **Gated** — confirms writes/installs/deletes; **hard-blocks** `rm -rf /`, fork bombs, `mkfs`, …
- **Accountable** — every executed action appended to `.noah/audit.jsonl`.
- **Dry-run** — preview the whole plan without touching your system.
- **Cross-platform by design** — one abstract tool, per-OS adapters (macOS today, Linux next).

---

## Quick Start

```bash
# 1. Auth: log in once with your Claude Pro/Max (or set ANTHROPIC_API_KEY)
npx @earendil-works/pi   # then: /login → Claude Pro/Max

# 2. Install NOAH
npm install
npm run build
npm link        # optional: makes `noah` global

# 3. Use it
noah "show my 5 biggest files"
noah --dry-run "set up a python project with git and a venv"
noah "install htop"            # asks before running
noah --log                     # view the audit trail
```

Without `npm link`, run via `node dist/cli.js "..."` or `npm run dev -- "..."`.

---

## Usage

```
noah "<natural language task>"

Flags:
  --dry-run     Preview the plan; do not execute (side effects neutralised)
  --yes, -y     Auto-approve confirmation prompts
  --log         Print the audit trail and exit
  --help, -h    Show this help
```

---

## How it works

```
noah "install htop"
        │
        ▼
  AgentSession (Pi SDK)      loop · sessions · compaction = free
        │  pi.on("tool_call") / pi.on("tool_result")
        ▼
  SAFETY GATE                classify → deny / confirm / allow  + audit
        │
        ▼
  TOOLS  read · bash · edit · write · grep · find · ls · package
        │
        ▼
  PLATFORM ADAPTER           macOS (brew) · Linux (apt) — same abstract tool
        │
        ▼
      Host OS
```

The gate lives in the **agent pipeline, not inside any tool** — so no tool can run
without passing through it. That is the unbypassable safety guarantee.

### Safety classification

| Verdict | Examples | Behaviour |
|---|---|---|
| `deny` | `rm -rf /`, fork bomb, `mkfs`, `dd of=/dev/disk`, `shutdown` | Hard-blocked, no override |
| `confirm` | any create/delete/write (`rm`, `rmdir`, `unlink`, `touch`, `mkdir`, `cp`, `mv`, `>` redirects, `find -delete`, …), `sudo`, install/remove, `curl`, write/edit, `package` | Asks before running |
| `allow` | `ls`, `cat`, `grep`, `find`, `df`, redirects to `/dev/null`, read | Runs freely |

---

## Project layout

```
src/
├── cli.ts                # entry: parse argv + flags
├── session.ts            # createAgentSession() + wiring
├── tools/package.ts      # abstract package tool → platform adapter
├── platform/adapter.ts   # PlatformAdapter interface + macOS/Linux impl
├── prompt/system.ts      # explain-mode guidance
└── safety/
    ├── policy.ts         # classify() — deny / confirm / allow
    ├── extension.ts      # pi.on(tool_call) gate + pi.on(tool_result) audit
    ├── confirm.ts        # terminal confirmation prompt
    └── audit.ts          # JSONL audit log + reader
```

See [`HACKATHON.md`](./HACKATHON.md) for the PRD + LLD and [`NOAH.md`](./NOAH.md) for the full vision.

---

## License

MIT
