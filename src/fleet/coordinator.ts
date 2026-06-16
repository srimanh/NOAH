/**
 * Fleet coordinator — fan a command out to many nodes concurrently (bounded),
 * capturing each node's result independently so one slow or broken host never
 * blocks or fails the rest.
 */
import type { Node } from "./inventory.js";
import type { NodeClient } from "./transport.js";

export interface FleetResult {
  node: string;
  ok: boolean;
  output: string;
  error?: string;
}

export interface FanOutOptions {
  concurrency?: number;
  timeoutMs?: number;
}

async function runOne(node: Node, command: string, client: NodeClient, timeoutMs?: number): Promise<FleetResult> {
  try {
    const res = await withTimeout(client.run(node, command), timeoutMs);
    if (res.ok) return { node: node.name, ok: true, output: res.stdout };
    return {
      node: node.name,
      ok: false,
      output: res.stdout,
      error: (res.stderr || `exited with code ${res.code}`).trim(),
    };
  } catch (err) {
    return { node: node.name, ok: false, output: "", error: err instanceof Error ? err.message : String(err) };
  }
}

function withTimeout<T>(p: Promise<T>, ms?: number): Promise<T> {
  if (!ms) return p;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function fanOut(
  nodes: Node[],
  command: string,
  client: NodeClient,
  opts: FanOutOptions = {},
): Promise<FleetResult[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 8);
  const results: FleetResult[] = [];
  const queue = [...nodes];

  async function worker(): Promise<void> {
    for (let node = queue.shift(); node; node = queue.shift()) {
      results.push(await runOne(node, command, client, opts.timeoutMs));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, nodes.length) }, worker));
  return results;
}
