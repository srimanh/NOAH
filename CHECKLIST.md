# ✅ NOAH — 5-Minute Pre-Demo Checklist

Run this start-to-finish right before you present. If anything fails, fix or fall back.

## T-5 min · Environment
- [ ] Laptop charged / plugged in. Wi-Fi connected (LLM needs network).
- [ ] **Do Not Disturb on** (no notification popups on screen-share).
- [ ] Terminal: dark theme, font **≥ 18pt**, window **wide** (≥ 100 cols).
- [ ] Close every other app/tab. One clean terminal, one notes screen.

## T-4 min · Build & health
```bash
cd ~/Developer/Projects/NOAH/NOAH
npm run build && ./scripts/smoke.sh      # must print: 8 passed, 0 failed ✅
```
- [ ] Smoke = **8/8**. (If not — do **not** demo live; play the backup video.)

## T-3 min · LLM auth is live
```bash
pi          # send one message, confirm a reply, then quit
```
- [ ] Got a reply → Claude login valid. (If expired: `/login` → Claude Pro/Max.)

## T-2 min · Visual sanity
```bash
npm run preview        # all panels render crisp, colors correct, no wrapping
```
- [ ] Panels look clean. ⛔ SAFETY BLOCK panel is sharp.

## T-1 min · Clean stage
```bash
cd /tmp && rm -rf noah-stage && mkdir noah-stage && cd noah-stage && clear
```
- [ ] Fresh empty dir, screen cleared.
- [ ] `DEMO.md` command sequence open on second screen.
- [ ] Backup video file open in a tab (safety net).

## During demo — guardrails
- [ ] Run commands **from the `DEMO.md` sequence only**. Don't improvise.
- [ ] Type slowly. Pause ~2s on the ⛔ SAFETY BLOCK panel.
- [ ] Close with the line: *"Autonomous when you trust it, blocked when you don't."*

## If it breaks live
- LLM hangs/errors → pivot to `noah --check "rm -rf /"` + `noah --log` (no network needed).
- Anything worse → **play the backup video**. Keep talking over it.

---
**One-line readiness gate:** smoke 8/8 + `pi` replies + preview clean = **go**.
