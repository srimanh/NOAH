/**
 * Skill store — installs verified skills into ~/.noah/skills and resolves their
 * playbooks. Install is the trust checkpoint: a skill must (1) parse, (2) pass
 * signature verification, and (3) stay within its declared permissions before a
 * single byte is written to disk.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseManifest, type SkillManifest } from "./manifest.js";
import { checkPermissions } from "./permissions.js";
import { verifySkill, type SignedSkill } from "./signing.js";
import type { Playbook } from "../playbooks/types.js";

export function defaultSkillsDir(): string {
  return process.env.NOAH_SKILLS_DIR || join(homedir(), ".noah", "skills");
}

export type InstallResult = { ok: true; manifest: SkillManifest } | { ok: false; errors: string[] };

export function installSkill(signed: SignedSkill, dir: string = defaultSkillsDir()): InstallResult {
  // 1) structural validation (defensive — input may be untrusted JSON)
  const parsed = parseManifest(signed.manifest);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  // 2) authenticity + integrity
  const v = verifySkill(signed);
  if (!v.ok) return { ok: false, errors: [v.reason] };

  // 3) least privilege
  const violations = checkPermissions(parsed.manifest);
  if (violations.length) return { ok: false, errors: violations.map((x) => `permission: ${x}`) };

  // 4) persist
  try {
    const skillDir = join(dir, parsed.manifest.id);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "skill.json"), JSON.stringify(signed, null, 2));
  } catch (err) {
    return { ok: false, errors: [`write failed: ${err instanceof Error ? err.message : err}`] };
  }
  return { ok: true, manifest: parsed.manifest };
}

export interface InstalledSkill extends SkillManifest {}

export function listSkills(dir: string = defaultSkillsDir()): InstalledSkill[] {
  if (!existsSync(dir)) return [];
  const out: InstalledSkill[] = [];
  for (const entry of readdirSync(dir)) {
    const file = join(dir, entry, "skill.json");
    if (!existsSync(file)) continue;
    try {
      const signed = JSON.parse(readFileSync(file, "utf8")) as SignedSkill;
      const parsed = parseManifest(signed.manifest);
      if (parsed.ok) out.push(parsed.manifest);
    } catch {
      /* skip corrupt skill */
    }
  }
  return out;
}

/** Find an installed skill's playbook by playbook id. */
export function getSkillPlaybook(
  playbookId: string,
  dir: string = defaultSkillsDir(),
): { skillId: string; playbook: Playbook } | undefined {
  for (const skill of listSkills(dir)) {
    const pb = skill.playbooks.find((p) => p.id === playbookId);
    if (pb) return { skillId: skill.id, playbook: pb };
  }
  return undefined;
}
