/**
 * RPC run mode — headless JSON-RPC over stdin/stdout, reusing pi's `runRpcMode`
 * driven by a NOAH-wired runtime. Lets a desktop applet / voice frontend / any
 * app embed NOAH as a subprocess with all OS tools + safety + caveman intact.
 *
 *   noah --rpc            # then send {"type":"prompt","message":"..."} lines
 */
import { runRpcMode } from "@earendil-works/pi-coding-agent";
import { buildNoahRuntime, type BuildOptions } from "../runtime.js";

export async function runNoahRpc(opts: BuildOptions): Promise<void> {
  const runtime = await buildNoahRuntime(opts);
  await runRpcMode(runtime);
}
