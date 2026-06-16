# Security Policy

NOAH operates real operating systems, so we take security seriously — and we
build for it: every action is classified by a safety gate, audited, and (where
possible) reversible.

## Supported versions

The latest published `noah-agent` release on npm receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately via GitHub Security Advisories:
<https://github.com/srimanh/NOAH/security/advisories/new>

Or email the maintainer (see `author` in `package.json`). Please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal proof of concept if possible),
- the NOAH version (`noah version`) and your OS.

We aim to acknowledge reports within 72 hours and to ship a fix or mitigation as
quickly as the severity warrants. We're happy to credit you in the release notes
unless you prefer to remain anonymous.

## Design safeguards

- **Safety gate** — catastrophic commands (`rm -rf /`, `mkfs`, fork bombs, …) are
  hard-blocked; mutating actions require confirmation. The gate sits in the agent
  pipeline, so no tool runs without passing through it.
- **Audit log** — every executed tool call is appended to `~/.noah/audit.jsonl`.
- **Reversibility** — package/service changes and file edits are recorded with
  their inverse/snapshot, so `noah undo` can revert them.
- **Supply-chain hardening** — the third-party runtime is pinned to an exact
  vetted version, bundled into the published tarball, and verified by
  `noah --verify-deps` (also enforced at publish time).
- **Skills** — community skills are ed25519-signed and permission-scoped; an
  unsigned, tampered, or over-reaching skill is rejected at install.
