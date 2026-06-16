/**
 * Snapshot extension — makes pi's built-in `write`/`edit` tools reversible.
 *
 * tool_call (before): snapshot the target file's current bytes.
 * tool_result (after, on success): record a file transaction referencing that
 * snapshot, so `noah undo` can restore it.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { snapshotFile, type SnapshotRef } from "./snapshot.js";
import { recordOp } from "./engine.js";

const FILE_TOOLS: Record<string, "write" | "edit"> = { write: "write", edit: "edit" };

/** Pull a filesystem path out of a tool's input, tolerating common field names. */
export function extractPath(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  for (const key of ["path", "file_path", "filePath", "file"]) {
    if (typeof o[key] === "string") return o[key] as string;
  }
  return null;
}

export const snapshotExtension =
  () =>
  (pi: ExtensionAPI): void => {
    const pending = new Map<string, SnapshotRef>();

    pi.on("tool_call", (event) => {
      if (process.env.NOAH_DRY_RUN === "1") return undefined;
      if (!FILE_TOOLS[event.toolName]) return undefined;
      const path = extractPath(event.input);
      if (path) pending.set(path, snapshotFile(path));
      return undefined;
    });

    pi.on("tool_result", (event) => {
      const kind = FILE_TOOLS[event.toolName];
      if (!kind) return;
      const path = extractPath(event.input);
      if (!path) return;
      const ref = pending.get(path);
      pending.delete(path);
      if (event.isError || !ref) return;
      recordOp({ tool: "file", action: kind, path }, { snapshot: ref });
    });
  };
