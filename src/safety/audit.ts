/**
 * Audit log — accountability. Every executed tool call appended as JSONL.
 */
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const AUDIT_PATH = join(process.cwd(), ".noah", "audit.jsonl");

export interface AuditEntry {
  ts: string;
  tool: string;
  input: unknown;
  ok: boolean;
  verdict?: string;
}

export function appendAudit(entry: AuditEntry): void {
  try {
    mkdirSync(dirname(AUDIT_PATH), { recursive: true });
    appendFileSync(AUDIT_PATH, JSON.stringify(entry) + "\n");
  } catch {
    // never let auditing crash the agent
  }
}

export function readAudit(): AuditEntry[] {
  if (!existsSync(AUDIT_PATH)) return [];
  return readFileSync(AUDIT_PATH, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as AuditEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is AuditEntry => e !== null);
}

export function printAuditLog(): void {
  const entries = readAudit();
  if (entries.length === 0) {
    console.log("📜 No audit entries yet.");
    return;
  }
  console.log(`📜 NOAH audit log (${entries.length} actions) — ${AUDIT_PATH}\n`);
  for (const e of entries) {
    const status = e.ok ? "✅" : "❌";
    const cmd =
      e.input && typeof e.input === "object" && "command" in e.input
        ? (e.input as { command: string }).command
        : JSON.stringify(e.input);
    console.log(`${status} ${e.ts}  [${e.tool}]  ${cmd}`);
  }
}
