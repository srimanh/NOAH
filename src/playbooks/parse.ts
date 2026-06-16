/** Validate/parse a playbook from an untrusted object (file or built-in). */
import type { Playbook, PlaybookStep, StepAction } from "./types.js";

export type ParseResult =
  | { ok: true; playbook: Playbook }
  | { ok: false; errors: string[] };

function validateAction(a: unknown, i: number, errors: string[]): a is StepAction {
  if (!a || typeof a !== "object") {
    errors.push(`step ${i}: action must be an object`);
    return false;
  }
  const act = a as Record<string, unknown>;
  switch (act.tool) {
    case "package": {
      if (!["install", "remove", "update"].includes(act.action as string)) {
        errors.push(`step ${i}: package action must be install/remove/update`);
        return false;
      }
      if (act.action !== "update" && typeof act.pkg !== "string") {
        errors.push(`step ${i}: package ${act.action} needs a pkg`);
        return false;
      }
      return true;
    }
    case "service": {
      if (typeof act.action !== "string" || typeof act.name !== "string") {
        errors.push(`step ${i}: service step needs action + name`);
        return false;
      }
      return true;
    }
    case "file": {
      if (act.action !== "write" || typeof act.path !== "string" || typeof act.content !== "string") {
        errors.push(`step ${i}: file step needs action:"write", path, content`);
        return false;
      }
      return true;
    }
    default:
      errors.push(`step ${i}: unknown tool "${String(act.tool)}"`);
      return false;
  }
}

export function parsePlaybook(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["playbook must be an object"] };
  const o = input as Record<string, unknown>;

  for (const key of ["id", "title", "description"]) {
    if (typeof o[key] !== "string" || !(o[key] as string).trim()) errors.push(`missing "${key}"`);
  }
  if (!Array.isArray(o.steps) || o.steps.length === 0) {
    errors.push("playbook must have at least one step");
  }

  const steps: PlaybookStep[] = [];
  if (Array.isArray(o.steps)) {
    o.steps.forEach((s, i) => {
      const step = s as Record<string, unknown>;
      if (typeof step?.name !== "string") errors.push(`step ${i}: missing name`);
      if (validateAction(step?.action, i, errors)) {
        steps.push({ name: step.name as string, action: step.action as StepAction });
      }
    });
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    playbook: {
      id: o.id as string,
      title: o.title as string,
      description: o.description as string,
      steps,
    },
  };
}
