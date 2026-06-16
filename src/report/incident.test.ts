import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIncident } from "./incident.js";
import { renderMarkdown } from "./render.js";
import type { AuditEntry } from "../safety/audit.js";
import type { HistoryItem } from "../ops/types.js";

const audit: AuditEntry[] = [
  { ts: "2026-01-01T10:00:00.000Z", tool: "bash", input: { command: "ls" }, ok: true },
  { ts: "2026-01-01T10:00:30.000Z", tool: "package", input: { command: "install htop" }, ok: false },
];

const ledger: HistoryItem[] = [
  {
    id: "1",
    at: Date.parse("2026-01-01T10:00:20.000Z"),
    action: { tool: "package", action: "install", pkg: "htop" },
    inverse: { tool: "package", action: "remove", pkg: "htop" },
    reversible: true,
    desc: "package install htop",
    undone: true,
  },
];

test("buildIncident: computes summary counts", () => {
  const r = buildIncident({ audit, history: ledger, host: "macOS 26", now: 1000 });
  assert.equal(r.summary.actions, 2);
  assert.equal(r.summary.failures, 1);
  assert.equal(r.summary.changes, 1);
  assert.equal(r.summary.undone, 1);
  assert.equal(r.summary.reversible, 0, "the only change was undone");
  assert.equal(r.host, "macOS 26");
  assert.equal(r.timeline.length, 3);
});

test("renderMarkdown: contains headings, summary, and timeline entries", () => {
  const r = buildIncident({ audit, history: ledger, host: "macOS 26", now: 1000 });
  const md = renderMarkdown(r);
  assert.match(md, /# NOAH Incident Report/);
  assert.match(md, /macOS 26/);
  assert.match(md, /Actions/i);
  assert.match(md, /htop/);
  assert.match(md, /## Timeline/);
});

test("buildIncident: empty logs → zeroed summary, still renders", () => {
  const r = buildIncident({ audit: [], history: [], host: "linux", now: 0 });
  assert.equal(r.summary.actions, 0);
  assert.match(renderMarkdown(r), /NOAH Incident Report/);
});
