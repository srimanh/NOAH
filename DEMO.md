# 🎬 NOAH — Locked Demo Script

> Rehearse this 10×. Run `./scripts/smoke.sh` right before going on stage.
> Total run time: ~3 minutes. Every beat below is tested and reliable.

## Setup (before judges arrive)
```bash
cd NOAH && npm run build && npm link        # `noah` is global
pi   # confirm /login → Claude Pro/Max still valid (send one message)
cd /tmp && mkdir noah-stage && cd noah-stage  # clean stage dir
clear
```
Keep a second terminal open with `DEMO.md` for talking points.

> **Visuals:** NOAH renders panels (REQUEST / TOOL cards / SAFETY REVIEW / SAFETY
> BLOCK / AUDIT / NOAH stream). Preview them anytime with `npm run preview`.
> Use a dark terminal, font ≥ 18pt, wide window so panels don't wrap.

---

## The 5 beats

### Beat 1 — Capability (10s)
> "NOAH understands plain English and operates the OS."
```bash
noah "show my 5 largest files, read-only"
```
**Expect:** numbered list of files. Plain-English in, real OS action out.

---

### Beat 2 — Autonomy + Explain + Dry-run (40s)  ← the "big" moment
> "Give it a goal, it plans and chains the steps itself — and dry-run lets me preview without touching anything."
```bash
noah --dry-run "set up a python project: make a folder, init git, add main.py and requirements.txt"
```
**Expect:** a numbered **plan**, steps shown (`▸ bash`, `▸ write`), and: *nothing written to disk*.
```bash
ls -la        # prove: zero files created
```
**Say:** "That's the agent loop — autonomous multi-step — but dry-run neutralised every side effect."

---

### Beat 3 — Control / consent (30s)
> "For anything that changes the system, I'm in the loop."
```bash
noah "install htop"
```
**Expect:** yellow `⚠️ NOAH wants to run…` prompt. **Decline (`n`)** first — show it's stopped. Then re-run and **approve (`y`)** to show it works.

---

### Beat 4 — The wow: catastrophic block (20s)  ← deterministic, no LLM luck
> "And the things that should never run, simply can't."
```bash
noah --check "rm -rf / --no-preserve-root"
noah --check ":(){ :|:& };:"
noah --check "mkfs.ext4 /dev/sda"
```
**Expect:** red `⛔ BLOCKED … cannot be overridden` for each.
**Say:** "Hard blocklist in the agent pipeline — not the model's goodwill. No prompt can talk past it."

---

### Beat 5 — Accountability (15s)
> "Every action NOAH took is logged."
```bash
noah --log
```
**Expect:** timestamped JSONL audit trail of the session.
**Close:** *"NOAH — autonomous when you trust it, blocked when you don't."*

---

## Optional Beat 6 — Cross-platform (if time + Docker up)
> "Same NOAH, no code change, on Linux:"
```bash
docker run --rm -v "$HOME/Developer/Projects/NOAH/NOAH":/noah \
  -v "$HOME/.pi/agent":/root/.pi/agent -w /tmp node:22 \
  node /noah/dist/cli.js --yes "what linux distro is this? read-only"
```
**Say:** "macOS uses brew, Linux uses apt — one abstract tool, a platform adapter picks the backend."

---

## If something breaks live
- LLM hangs / errors → switch to **Beat 4 (`--check`)** and **Beat 5 (`--log`)** — both work with zero network.
- Worst case → play the **backup video** (record it at hour 22).

## Judge Q&A — one-liners
- *"Isn't this just ChatGPT + bash?"* → "No — the safety gate, autonomy, and audit trail are the product. Try `--check`."
- *"What stops a hallucinated rm -rf /?"* → "Hard blocklist in `pi.on('tool_call')`, before execution, no override."
- *"Cross-platform?"* → "PlatformAdapter interface; brew vs apt behind one tool."
- *"Cloud or local?"* → "Claude via OAuth for quality; Ollama fallback for offline/privacy."
