/**
 * Skill manifest — the declared identity + capabilities of a shareable skill.
 *
 * A skill bundles one or more playbooks plus the permissions it needs. NOAH
 * validates the manifest, verifies its signature, and enforces that the
 * playbooks never exceed the declared permissions before it will run anything.
 */
import { parsePlaybook } from "../playbooks/parse.js";
import type { Playbook } from "../playbooks/types.js";

export const SKILL_PERMISSIONS = ["package", "service", "file"] as const;
export type SkillPermission = (typeof SKILL_PERMISSIONS)[number];

export interface SkillManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: SkillPermission[];
  playbooks: Playbook[];
}

export type ManifestResult =
  | { ok: true; manifest: SkillManifest }
  | { ok: false; errors: string[] };

const SEMVER = /^\d+\.\d+\.\d+/;

export function parseManifest(input: unknown): ManifestResult {
  const errors: string[] = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["manifest must be an object"] };
  const o = input as Record<string, unknown>;

  for (const key of ["id", "name", "author", "description"]) {
    if (typeof o[key] !== "string" || !(o[key] as string).trim()) errors.push(`missing "${key}"`);
  }
  if (typeof o.version !== "string" || !SEMVER.test(o.version)) errors.push(`"version" must be semver (x.y.z)`);

  if (!Array.isArray(o.permissions)) {
    errors.push(`"permissions" must be an array`);
  } else {
    for (const p of o.permissions) {
      if (!SKILL_PERMISSIONS.includes(p as SkillPermission)) errors.push(`unknown permission "${String(p)}"`);
    }
  }

  const playbooks: Playbook[] = [];
  if (!Array.isArray(o.playbooks) || o.playbooks.length === 0) {
    errors.push("a skill must declare at least one playbook");
  } else {
    o.playbooks.forEach((pb, i) => {
      const r = parsePlaybook(pb);
      if (r.ok) playbooks.push(r.playbook);
      else errors.push(`playbook ${i}: ${r.errors.join("; ")}`);
    });
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    manifest: {
      id: o.id as string,
      name: o.name as string,
      version: o.version as string,
      author: o.author as string,
      description: o.description as string,
      permissions: o.permissions as SkillPermission[],
      playbooks,
    },
  };
}
