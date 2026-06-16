/**
 * Capability-based security for skills.
 *
 * A skill declares the permissions it needs. We derive the permissions its
 * playbooks actually use and reject the skill if any step reaches for a tool
 * that wasn't declared — enforcing least privilege. A skill that says "I only
 * manage packages" provably cannot touch your files.
 */
import type { SkillManifest, SkillPermission } from "./manifest.js";

/** The set of tool permissions a manifest's playbook steps actually require. */
export function requiredPermissions(manifest: SkillManifest): Set<SkillPermission> {
  const reqs = new Set<SkillPermission>();
  for (const pb of manifest.playbooks) {
    for (const step of pb.steps) {
      reqs.add(step.action.tool as SkillPermission);
    }
  }
  return reqs;
}

/**
 * Returns a list of violations: each tool used by a step but NOT in the skill's
 * declared permissions. Empty array ⇒ the skill stays within its declared scope.
 */
export function checkPermissions(manifest: SkillManifest): string[] {
  const declared = new Set(manifest.permissions);
  const violations: string[] = [];
  for (const tool of requiredPermissions(manifest)) {
    if (!declared.has(tool)) {
      violations.push(`uses "${tool}" but did not declare the "${tool}" permission`);
    }
  }
  return violations;
}
