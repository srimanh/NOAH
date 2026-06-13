/**
 * Auth gate — make /login and /logout actually mean something.
 *
 * After /logout the running session still holds a model, so without a gate the
 * agent would keep answering. This checks the live credential before each prompt
 * so signing out blocks usage until /login restores it (matching pi's behaviour).
 */

export interface AuthStoreLike {
  get(provider: string): unknown;
}

export interface ModelLike {
  provider: string;
  id: string;
}

/** True if the provider currently has a stored credential (api key or oauth). */
export function isAuthed(provider: string, store: AuthStoreLike): boolean {
  return store.get(provider) != null;
}

export type GateVerdict = { ok: true } | { ok: false; reason: string };

/** Decide whether a prompt may run for the current model. */
export function authGate(model: ModelLike | undefined, store: AuthStoreLike): GateVerdict {
  if (!model) return { ok: false, reason: "No model selected. Use /model to choose one." };
  if (!isAuthed(model.provider, store)) {
    return {
      ok: false,
      reason: `Signed out of ${model.provider}. Run /login (subscription or API key) to reconnect.`,
    };
  }
  return { ok: true };
}
