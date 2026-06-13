# 🎤 NOAH — Pitch, Slides & Backup Video

Everything you need to present and to record the safety-net video.
Order to lock: **(1) Slides → (2) Pitch script → (3) Record video → (4) Rehearse.**

---

## 1 · Slides (3 only)

Keep them sparse. You talk; slides anchor. Big text, one idea each.

### Slide 1 — The Problem
> **Title:** "We gave AI agents a shell. Should we trust them?"
- AI agents can already run OS commands.
- One hallucinated `rm -rf /` and the machine is gone.
- **The trust gap:** nobody ships an OS agent that's *autonomous, safe, and accountable*.

*(Visual: a terminal with a scary command + a red ⛔.)*

### Slide 2 — NOAH
> **Title:** NOAH — Native Operating-system Agentic Harness
> *Natural language controls your computer — autonomously, and it can't hurt you.*
- **Autonomous** — give a goal, it plans + chains the steps.
- **Gated** — confirms changes, **hard-blocks** the catastrophic.
- **Accountable** — every action logged.
- Built on the Pi agent SDK · Claude via your subscription · runs macOS + Linux.

*(Visual: the architecture box diagram from README — loop → safety gate → tools → adapter → OS.)*

### Slide 3 — Live Demo
> **Title:** "Let me show you." → switch to terminal.
- (After demo, leave this up for Q&A.)
- One line: *"Autonomous when you trust it. Blocked when you don't."*

---

## 2 · Pitch Script (~3 min, say it out loud)

> **[0:00 – 0:25] Hook**
> "Everyone's wiring LLMs to the shell right now. It's easy — and terrifying. One
> wrong command from a confident model and your machine is gone. The thing nobody's
> solved is *trust*. That's what I built."

> **[0:25 – 0:45] What it is**
> "This is NOAH — an agent that operates your operating system from plain English.
> But the product isn't 'AI runs commands.' The product is the **safety layer**:
> NOAH is autonomous when you trust it, and blocked when you don't. Let me show you."

> **[0:45 – 2:30] Live demo** — run `DEMO.md` beats 1–5:
> 1. *(biggest files)* "Plain English in, real OS action out."
> 2. *(dry-run python setup)* "Give it a goal — it plans and chains the steps itself.
>    Dry-run previews everything and touches nothing." → `ls`, zero files.
> 3. *(install htop)* "Anything that changes the system asks me first." → decline, then approve.
> 4. *(`--check` rm -rf / + fork bomb)* "And the catastrophic simply can't run —
>    that's a hard block in the agent pipeline, not the model's goodwill."
> 5. *(`--log`)* "Every action is logged. Full accountability."

> **[2:30 – 3:00] Close**
> "Same NOAH runs on macOS and Linux — one abstract tool, a platform adapter picks
> brew or apt. It's open source, built on the Pi SDK, using my Claude subscription.
> NOAH: autonomous when you trust it, blocked when you don't. Thank you."

**Delivery notes:** slow down. Pause after the ⛔ block. Make eye contact on the close line.

---

## 3 · Backup Video (record before stage — your safety net)

Record a clean ~3-min screen capture so a live failure never sinks you.

**Tools (mac):** QuickTime → File → New Screen Recording (or `Cmd+Shift+5`). Record terminal + voice.

**Make the panels look their best**
- Dark terminal theme, font **≥ 18pt**, window **wide** (≥ 100 cols) so panels never wrap.
- True-color terminal (iTerm2 / Warp / modern Terminal) for the badge colors.
- Run `npm run preview` once on camera-off to confirm the panels render crisp.

**Pre-record checklist**
- [ ] `./scripts/smoke.sh` → 8/8.
- [ ] `pi` → confirm Claude login valid (send one message).
- [ ] Fresh terminal, ≥18pt, wide, dark theme, `cd /tmp && mkdir noah-vid && cd noah-vid`.
- [ ] `rm -rf .noah` so the audit log starts clean.
- [ ] Close notifications (Do Not Disturb).

**Shot list (record in this exact order, narrate each):**
1. `clear`, then type slowly:
   `noah "show my 5 largest files, read-only"` → REQUEST panel → TOOL card → ● NOAH result.
2. `noah --dry-run "set up a python project: folder, git init, main.py, requirements.txt"`
   → shows the PLAN + tool cards, then `ls -la` (nothing created). Narrate: "dry-run touched nothing."
3. `noah "install htop"` → **SAFETY REVIEW** panel appears → type `n` (declined). Re-run, type `y`.
4. `noah --check "rm -rf / --no-preserve-root"` → big ⛔ **SAFETY BLOCK** panel.
   Then `noah --check ":(){ :|:& };:"` → ⛔ again. (Pause on this shot — it's the money frame.)
5. `noah --log` → the audit trail.
6. *(optional)* the Docker Linux one-liner from `DEMO.md` Beat 6.

> Tip: the ⛔ SAFETY BLOCK panel is the single most memorable frame — hold on it for ~2s.

**After recording:** watch it once. If any beat stutters, re-record just that take. Keep final ≤ 3:30.
Save as `noah-demo.mp4`. Have it open in a tab at the venue.

---

## 4 · Rehearsal Plan

- Run the **verbal pitch out loud 10×** (not in your head — out loud).
- Do **3 full dry-runs** of the live demo with a timer; target ≤ 3 min.
- Practice the **failure pivot:** if the LLM hangs, jump to `--check` + `--log` (both work offline).
- Memorize the 4 Q&A one-liners in `DEMO.md`.

> The demo is built and green. From here, **winning is rehearsal, not code.**
