/**
 * Playbooks — declarative, gated, reversible multi-step recipes.
 *
 * A playbook is a list of steps; each step is a tool action that flows through
 * the same safety gate and ops ledger as any other NOAH action. Because every
 * step records a reversible operation tagged with the playbook's turn, the whole
 * playbook can be rolled back as a unit via `rewindTo`.
 */

export type StepAction =
  | { tool: "package"; action: "install" | "remove" | "update"; pkg?: string }
  | { tool: "service"; action: string; name: string }
  | { tool: "file"; action: "write"; path: string; content: string };

export interface PlaybookStep {
  name: string; // human-readable description of the step
  action: StepAction;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  steps: PlaybookStep[];
}

export interface StepResult {
  name: string;
  ok: boolean;
  output?: string;
  error?: string;
}

export interface RunResult {
  ok: boolean;
  turn: number; // pass this to rewindTo(turn) to roll the whole playbook back
  steps: StepResult[];
}
