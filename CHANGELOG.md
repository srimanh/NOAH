# Changelog

All notable changes to **NOAH** (`noah-agent`). This project follows
[Semantic Versioning](https://semver.org). Each minor release below ships a
named capability built strictly with Red → Green → Refactor TDD, on a single
trunk: every action is **gated**, **audited**, and **reversible**.

## 1.0.0 — GA

The finish line: production hardening, not new features.

- CI pipeline (Linux + macOS, Node 20/22): build + full test suite + supply-chain
  integrity check on every push and PR.
- `SECURITY.md` disclosure policy; issue/PR templates; semver-1.0 stability
  contract.
- Release-guard tests assert the published package is correct (exact pins,
  `overrides`, `bundleDependencies`, publish gate).
- **Stability promise:** the CLI commands, safety verdicts, and SDK surface
  documented in the README are stable for the 1.x line.

## 0.10.0 — Black Box

- **Incident reports** — fold the audit log + ops ledger + telemetry into a
  chronological, Markdown incident report. `noah report`, `--out`, `--sign`
  (ed25519), and `noah report verify` for tamper-evident, reproducible records.

## 0.9.0 — Fleet

- **Multi-machine over SSH** — `noah fleet add/remove/list/doctor/run`. Concurrent,
  bounded fan-out with per-node timeout + error isolation; reuses your existing
  SSH (no new auth/daemon/ports). The safety gate refuses to fan a catastrophic
  command across the fleet.

## 0.8.0 — Sentinel

- **Proactive health watch** — `noah watch` periodically probes health and alerts
  only when a problem *appears* or *clears* (anti-alert-fatigue), via native
  desktop notifications and `~/.noah/sentinel.log`.

## 0.7.0 — Recall

- **Local memory** — NOAH remembers your machine (auto-captured from telemetry)
  and what you teach it (`noah remember`), and injects the most relevant facts
  into context. Fully inspectable and wipeable (`noah memory [forget]`).

## 0.6.0 — Marketplace

- **Skills** — shareable capability packages. Three trust gates before anything
  runs: ed25519 **signature**, declared **permissions** (least privilege), and the
  existing gate + ledger. `noah skills keygen/sign/verify/install/list`.

## 0.5.0 — Playbooks

- **Curated, gated, reversible recipes** — `noah playbooks`, `noah run <id>`
  (safe-by-default preview; `--yes` applies). Every step records a reversible op
  tagged to the playbook's turn, so the whole run rolls back as a unit.

## 0.4.0 — Time Machine

- **Conversation rewind + filesystem time-travel** — `/rewind` a message in the
  console to roll the machine back to the state before it, then edit and re-run.
  `/checkpoints` lists restore points. (Conversation-memory fork is tracked.)

## 0.3.0 / 0.3.1 — Reversible Operations Engine

- **`noah undo` / `noah history`** — package/service changes record their inverse;
  file edits/creates snapshot the originals (content-addressed). Append-only,
  tamper-evident ops ledger.

## 0.2.x — Hardening & polish

- Supply-chain hardening: exact-pinned, `overrides`, and **bundled** third-party
  runtime; `noah --verify-deps` integrity guard enforced at publish.
- Update notifications (`noah update` / `noah version`).
- Fixes: real disk-usage math, single model display, last-used-model memory,
  login-first.

## 0.1.0 — First release

- AI System Administrator over natural language: provider abstraction (cloud +
  Ollama), Linux/macOS adapters, tools (bash/files/package/service/network/
  system/logs), the **safety gate** + audit + dry-run, telemetry `doctor`,
  benchmark harness, extensions, custom cinematic TUI, SDK + RPC modes.
