/**
 * Model resolution — pick which LLM NOAH runs.
 *
 * Precedence: --model flag  →  NOAH_MODEL env  →  first available (has auth).
 * Kept pure (operates on a RegistryLike) so it is fully unit-testable.
 */
/** Structural model shape we need (avoids a direct pi-ai dependency). */
export interface AnyModel {
  provider: string;
  id: string;
}

/** Minimal slice of Pi's ModelRegistry that resolution needs (testable seam). */
export interface RegistryLike {
  find(provider: string, id: string): AnyModel | undefined;
  getAvailable(): AnyModel[];
  getAll(): AnyModel[];
}

export interface ResolveOptions {
  flagModel?: string;
  envModel?: string;
  /** Last-used model (persisted), restored before falling back to first available. */
  lastModel?: string;
}

/** Parse "provider/id" (id may contain further slashes). Null if no provider segment. */
export function parseModelRef(ref: string): { provider: string; id: string } | null {
  const i = ref.indexOf("/");
  if (i <= 0 || i === ref.length - 1) return null;
  return { provider: ref.slice(0, i), id: ref.slice(i + 1) };
}

export class ModelResolutionError extends Error {}

function findRef(reg: RegistryLike, ref: string): AnyModel {
  const parsed = parseModelRef(ref);
  if (!parsed) {
    throw new ModelResolutionError(`Invalid model ref "${ref}". Use provider/id, e.g. ollama/llama3.1`);
  }
  const found = reg.find(parsed.provider, parsed.id);
  if (!found) {
    throw new ModelResolutionError(
      `Model "${ref}" not found. Run \`noah --list-models\` to see options.`,
    );
  }
  return found;
}

/** Remove duplicate provider/id entries (some catalogs ship dotted+dashed aliases). */
export function dedupeModels<M extends AnyModel>(models: M[]): M[] {
  const seen = new Set<string>();
  const out: M[] = [];
  for (const m of models) {
    const key = `${m.provider}/${m.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export function resolveModel(reg: RegistryLike, opts: ResolveOptions): AnyModel {
  if (opts.flagModel) return findRef(reg, opts.flagModel);
  if (opts.envModel) return findRef(reg, opts.envModel);

  // Restore the last-used model when it's still available (ignore if stale).
  if (opts.lastModel) {
    const parsed = parseModelRef(opts.lastModel);
    if (parsed) {
      const found = reg.find(parsed.provider, parsed.id);
      if (found && reg.getAvailable().some((m) => m.provider === found.provider && m.id === found.id)) {
        return found;
      }
    }
  }

  const available = reg.getAvailable();
  if (available.length > 0) return available[0];

  throw new ModelResolutionError(
    "No model available. Start Ollama (`ollama serve`) or configure a cloud key via `pi /login`, " +
      "then pick one with `--model provider/id`.",
  );
}

/** Human-readable model list for `--list-models`. ✓ marks models with auth configured. */
export function formatModelList(reg: RegistryLike): string {
  const available = new Set(reg.getAvailable().map((m) => `${m.provider}/${m.id}`));
  const all = dedupeModels(reg.getAll());
  if (all.length === 0) return "No models registered.";

  const lines = all.map((m) => {
    const ref = `${m.provider}/${m.id}`;
    const mark = available.has(ref) ? "✓" : " ";
    return `  ${mark} ${ref}`;
  });
  return ["Models (✓ = ready to use):", ...lines].join("\n");
}
