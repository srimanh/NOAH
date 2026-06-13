import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "dist", "cli.js");

test("runNoahRpc is wired", async () => {
  const mod = await import("./rpc.js");
  assert.equal(typeof mod.runNoahRpc, "function");
});

test("RPC mode: responds to a JSON command over stdin/stdout", { timeout: 25000 }, async () => {
  const child = spawn("node", [CLI, "--rpc"], { stdio: ["pipe", "pipe", "pipe"] });
  let buf = "";
  const got = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("no RPC response\n" + buf)), 22000);
    child.stdout.on("data", (d) => {
      buf += d.toString();
      for (const line of buf.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("{")) continue;
        try {
          const msg = JSON.parse(t);
          if (msg.type === "response" && msg.id === "noah-1") {
            clearTimeout(timer);
            resolve(msg);
          }
        } catch {
          /* partial line */
        }
      }
    });
    child.on("error", reject);
  });

  // get_available_models needs no LLM call
  child.stdin.write(JSON.stringify({ id: "noah-1", type: "get_available_models" }) + "\n");

  try {
    const res = await got;
    assert.equal(res.type, "response");
    assert.equal(res.id, "noah-1");
    assert.equal(res.success, true);
  } finally {
    child.kill("SIGKILL");
  }
});
