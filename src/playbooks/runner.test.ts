import { test } from "node:test";
import assert from "node:assert/strict";
import { previewSteps, runPlaybook } from "./runner.js";
import type { Playbook, PlaybookStep } from "./types.js";

const pb: Playbook = {
  id: "demo",
  title: "Demo",
  description: "d",
  steps: [
    { name: "Install fail2ban", action: { tool: "package", action: "install", pkg: "fail2ban" } },
    { name: "Enable fail2ban", action: { tool: "service", action: "enable", name: "fail2ban" } },
  ],
};

test("previewSteps: numbered, human-readable, no execution", () => {
  const lines = previewSteps(pb);
  assert.equal(lines.length, 2);
  assert.match(lines[0], /1\..*Install fail2ban/);
  assert.match(lines[1], /2\..*Enable fail2ban/);
});

test("runPlaybook: runs each step in order via the injected performer", async () => {
  const ran: string[] = [];
  const res = await runPlaybook(pb, {
    turn: 9,
    perform: async (step: PlaybookStep) => {
      ran.push(step.name);
      return `${step.name} ok`;
    },
  });
  assert.equal(res.ok, true);
  assert.equal(res.turn, 9);
  assert.deepEqual(ran, ["Install fail2ban", "Enable fail2ban"]);
  assert.equal(res.steps.length, 2);
  assert.ok(res.steps.every((s) => s.ok));
});

test("runPlaybook: stops on first failure by default and reports it", async () => {
  const ran: string[] = [];
  const res = await runPlaybook(pb, {
    turn: 1,
    perform: async (step) => {
      ran.push(step.name);
      if (step.name === "Install fail2ban") throw new Error("no network");
      return "ok";
    },
  });
  assert.equal(res.ok, false);
  assert.deepEqual(ran, ["Install fail2ban"], "did not continue past the failure");
  assert.equal(res.steps[0].ok, false);
  assert.match(res.steps[0].error!, /no network/);
});

test("runPlaybook: dry-run previews without performing", async () => {
  let called = 0;
  const res = await runPlaybook(pb, {
    turn: 1,
    dryRun: true,
    perform: async () => {
      called++;
      return "x";
    },
  });
  assert.equal(called, 0, "perform never called in dry-run");
  assert.equal(res.ok, true);
  assert.ok(res.steps.every((s) => /DRY-RUN/.test(s.output ?? "")));
});
