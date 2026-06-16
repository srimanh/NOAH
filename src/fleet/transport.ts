/**
 * Node transport. The coordinator talks to nodes through the `NodeClient`
 * interface so it can be tested without a network; the real client shells out
 * to `ssh`, reusing the operator's existing keys and config.
 */
import { spawn } from "node:child_process";
import type { Node } from "./inventory.js";

export interface NodeRunResult {
  ok: boolean;
  stdout: string;
  stderr?: string;
  code?: number;
}

export interface NodeClient {
  run(node: Node, command: string): Promise<NodeRunResult>;
}

export interface BuiltCommand {
  cmd: string;
  args: string[];
}

/** Build a non-interactive ssh invocation (never hangs on a password prompt). */
export function sshCommand(node: Node, command: string): BuiltCommand {
  const target = node.user ? `${node.user}@${node.host}` : node.host;
  return {
    cmd: "ssh",
    args: [
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=8",
      "-o",
      "StrictHostKeyChecking=accept-new",
      target,
      command,
    ],
  };
}

export const sshClient: NodeClient = {
  run(node, command) {
    const { cmd, args } = sshCommand(node, command);
    return new Promise<NodeRunResult>((resolve) => {
      const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("error", (err) => resolve({ ok: false, stdout, stderr: String(err), code: -1 }));
      child.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, code: code ?? -1 }));
    });
  },
};
