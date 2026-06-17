# 📖 The NOAH Story — from pain to a trustworthy AI operator

This is the narrative behind NOAH: the problem it attacks, the principle that
guides it, and the user stories — one per capability — that show *how* each pain
point was solved. If someone asks "what is NOAH and why does it exist?", read
this top to bottom.

---

## The pain

Operating a computer well is still hard, and it punishes you for not memorising it:

- You know *what* you want ("free up space", "harden SSH", "why is my machine
  slow?") but not the exact incantation — `apt`? `brew`? `systemctl`? `vm_stat`?
- The commands differ on every OS and distro.
- One wrong flag (`rm -rf /`, `mkfs`, a bad `dd`) and it's catastrophic.
- And the new wave of "AI agents" makes this *worse*: they happily run whatever
  they hallucinate, with no brakes, no record, and no way back.

So you're stuck between **"I don't remember the command"** and **"I don't trust
the robot to run it."**

## The thesis

> NOAH is an **AI System Administrator you can actually trust on a real machine.**

It behaves like a senior sysadmin: it **reads the machine** first, **explains the
impact**, **asks before anything dangerous**, **hard-blocks the catastrophic**,
**records everything**, and — crucially — **can take back what it did.**

That trust comes from one rule applied to every single feature:

> **Gated. Audited. Reversible.**

Everything below is that promise, told as user stories.

---

## The user stories (pain → solution)

### Foundation — "talk to my machine, safely"
- *As a developer, I want to describe what I want in plain English and have NOAH
  do it on Linux or macOS*, so I don't have to memorise package managers or
  service tools. → cross-platform tools + adapter.
- *As a nervous user, I want NOAH to refuse to run catastrophic commands and ask
  before anything risky*, so an AI never wrecks my machine. → the **safety gate**
  (`deny` / `confirm` / `allow`) + audit log.
- *As an operator, I want a health read-out without spending tokens*, so I can
  glance at my system anytime. → `noah doctor` + the live dashboard.

### ⏳ Time Machine — "let me take it back"
- *As a developer, when a request changed my system in a way I didn't want, I
  want to scroll back to that message, undo its effects, and edit it*, so a
  mistake costs me nothing. → `/rewind` + `/checkpoints`: rewinding a message
  rolls the **filesystem** back with it (no other agent does this).

### Reversibility — "anything you did, you can undo"
- *As an admin, I want a timeline of what NOAH changed and a one-word way to
  revert it*, so I'm never stuck cleaning up by hand. → `noah history` / `noah
  undo`; package/service changes store their inverse, file edits store a
  content-addressed snapshot.

### 📜 Playbooks — "do the whole routine, reversibly"
- *As a sysadmin, I want one command to harden SSH or set up a machine, previewed
  before it runs and undoable as a unit*, so routines are fast **and** safe. →
  `noah run harden-ssh` (safe-by-default preview; `--yes` applies; whole playbook
  rolls back together).

### 🧩 Marketplace — "share capabilities without sharing malware"
- *As a power user, I want to install capabilities other people built*, so I'm
  not reinventing recipes. → `noah skills install`.
- *As a security-conscious user, I want a community skill to be provably
  authentic and unable to exceed what it declared*, so a bad skill can't wreck my
  box. → ed25519 **signatures** + **permission scoping** (least privilege),
  enforced at install.

### 🧠 Recall — "know my machine like a teammate"
- *As a returning user, I want NOAH to remember my OS, package manager and the
  things I tell it*, so I stop repeating myself. → local **memory**, auto-captured
  from telemetry + `noah remember`, injected into context.
- *As a privacy-minded user, I want that memory local, inspectable, and
  wipeable*, so I stay in control. → `noah memory` / `noah memory forget`.

### 🩺 Sentinel — "warn me before it breaks"
- *As a server owner, I want to be told a disk is filling or a service died
  before it takes me down*, and **not** nagged every minute about the same thing.
  → `noah watch`: alerts only when a problem appears or clears.

### 🛰️ Fleet — "ask once, every machine answers"
- *As a DevOps lead, I want to health-check or query many machines from one
  place*, without standing up new infrastructure. → `noah fleet` over your
  existing SSH; concurrent fan-out, one broken host never blocks the rest, and
  the safety gate still refuses catastrophic commands fleet-wide.

### 📑 Black Box — "prove what happened"
- *As an engineer, I want to turn a session into a clean, signed postmortem*, so
  I have an audit-grade record. → `noah report` folds the audit log + ops ledger
  into a timeline; `--sign` makes it tamper-evident and `report verify` proves
  it.

### Trust as a feature — "don't even trust your own dependencies"
- *As a user installing an AI that controls my OS, I want to know a compromised
  upstream release can't reach me*, so supply-chain attacks are off the table. →
  the third-party runtime is exact-pinned, **bundled** into the tarball, and
  verified by `noah --verify-deps` (enforced at publish).

---

## The arc

NOAH grew from "reverse-engineer an agent runtime" to a stable **1.0** in eight
disciplined phases — each a named release, each built test-first, each obeying
the same trunk:

| Phase | Release | Pain it solved |
|---|---|---|
| Foundation | 0.1–0.2 | "I don't remember the command / I don't trust the robot" |
| Time Machine | 0.4 | "I want that change undone — and the conversation rewound" |
| Playbooks | 0.5 | "Do the whole routine for me, safely" |
| Marketplace | 0.6 | "Share capabilities without sharing malware" |
| Recall | 0.7 | "Know my machine like a teammate" |
| Sentinel | 0.8 | "Warn me before it breaks" |
| Fleet | 0.9 | "Ask once, every machine answers" |
| Black Box | 0.10 | "Prove exactly what happened" |
| **GA** | **1.0** | "I can depend on this" |

The result: **you stop memorising commands and start managing systems** — with an
operator that reads before it acts, asks before it harms, records everything, and
can undo anything.
