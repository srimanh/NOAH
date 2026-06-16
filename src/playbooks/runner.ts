/**
 * Playbook runner — executes steps in order through an injected performer.
 *
 * The performer is what actually does the work (and records a reversible op);
 * the CLI wires it to the platform adapter + ops engine, tests pass a fake.
 * All ops are tagged with `turn`, so `rewindTo(turn)` rolls the whole playbook
 * back as a unit.
 */
import { describeAction } from "../ops/inverse.js";
import type { Playbook, PlaybookStep, RunResult, StepResult } from "./types.js";

export function previewSteps(pb: Playbook): string[] {
  return pb.steps.map((s, i) => `  ${i + 1}. ${s.name}  ·  ${describeAction(s.action as never)}`);
}

export interface RunOptions {
  /** Conversation turn to tag this playbook's ops with (for group rollback). */
  turn: number;
  /** Performs a single step and returns its output; throws on failure. */
  perform: (step: PlaybookStep, turn: number) => Promise<string>;
  /** Preview only — never calls `perform`. */
  dryRun?: boolean;
  /** Keep going after a failed step (default: stop). */
  continueOnError?: boolean;
}

export async function runPlaybook(pb: Playbook, opts: RunOptions): Promise<RunResult> {
  const steps: StepResult[] = [];
  let ok = true;

  for (const step of pb.steps) {
    if (opts.dryRun) {
      steps.push({ name: step.name, ok: true, output: `[DRY-RUN] would: ${step.name}` });
      continue;
    }
    try {
      const output = await opts.perform(step, opts.turn);
      steps.push({ name: step.name, ok: true, output });
    } catch (err) {
      ok = false;
      steps.push({ name: step.name, ok: false, error: err instanceof Error ? err.message : String(err) });
      if (!opts.continueOnError) break;
    }
  }

  return { ok, turn: opts.turn, steps };
}
