/**
 * Fleet inventory — the set of machines NOAH can reach, stored in
 * ~/.noah/fleet.json. Nodes are addressed by SSH target; we invent no auth of
 * our own and rely entirely on the operator's existing SSH configuration.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Node {
  name: string;
  host: string;
  user?: string;
}

export function defaultFleetPath(): string {
  return process.env.NOAH_FLEET || join(homedir(), ".noah", "fleet.json");
}

export function listNodes(path: string = defaultFleetPath()): Node[] {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(parsed?.nodes) ? (parsed.nodes as Node[]) : [];
  } catch {
    return [];
  }
}

function write(nodes: Node[], path: string): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify({ nodes }, null, 2) + "\n");
  } catch {
    /* best-effort */
  }
}

export function addNode(node: Node, path: string = defaultFleetPath()): Node {
  const nodes = listNodes(path).filter((n) => n.name !== node.name);
  nodes.push(node);
  write(nodes, path);
  return node;
}

export function removeNode(name: string, path: string = defaultFleetPath()): boolean {
  const nodes = listNodes(path);
  const next = nodes.filter((n) => n.name !== name);
  if (next.length === nodes.length) return false;
  write(next, path);
  return true;
}

export function getNode(name: string, path: string = defaultFleetPath()): Node | undefined {
  return listNodes(path).find((n) => n.name === name);
}
