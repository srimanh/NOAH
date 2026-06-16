/**
 * The real playbook step performer: does the work via the platform adapter / fs
 * and records a reversible op (tagged with the playbook's turn) so the whole
 * playbook can be undone or rewound.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { platform } from "../platform/adapter.js";
import { recordOp } from "../ops/engine.js";
import { snapshotFile } from "../ops/snapshot.js";
import type { PlaybookStep } from "./types.js";

export async function performStep(step: PlaybookStep, turn: number): Promise<string> {
  const a = step.action;

  if (a.tool === "package") {
    const out = await platform.pkg(a.action, a.pkg);
    recordOp({ tool: "package", action: a.action, pkg: a.pkg }, { turn });
    return out || `${a.action} ${a.pkg ?? "(all)"} done`;
  }

  if (a.tool === "service") {
    const out = await platform.service(a.name, a.action as never);
    recordOp({ tool: "service", action: a.action, name: a.name }, { turn });
    return out || `${a.action} ${a.name} done`;
  }

  // file write: snapshot the original first so the write is reversible.
  const snapshot = snapshotFile(a.path);
  mkdirSync(dirname(a.path), { recursive: true });
  writeFileSync(a.path, a.content);
  recordOp({ tool: "file", action: "write", path: a.path }, { turn, snapshot });
  return `wrote ${a.path}`;
}
