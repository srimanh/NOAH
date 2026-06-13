/**
 * NOAH space TUI — a cinematic, minimal interactive console built directly on
 * pi-tui's render engine + AgentSession (no Pi InteractiveMode). Hero logo,
 * rounded input, blue-on-black, with an arrow-selectable model picker.
 */
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { Container, Input, ProcessTerminal, TUI } from "@earendil-works/pi-tui";
import { buildRegistry } from "../../llm/registry.js";
import { resolveModel, type RegistryLike } from "../../llm/resolve.js";
import { safetyExtension } from "../../safety/extension.js";
import { readAudit, appendAudit } from "../../safety/audit.js";
import { packageTool } from "../../tools/package.js";
import { serviceTool } from "../../tools/service.js";
import { networkTool } from "../../tools/network.js";
import { systemTool } from "../../tools/system.js";
import { logsTool } from "../../tools/logs.js";
import { NOAH_SYSTEM_PROMPT } from "../../prompt/system.js";
import { Dashboard, dashboardData, type DashboardData } from "./dashboard.js";
import { collectSnapshot } from "../../sys/probe.js";
import { cavemanExtension, isCavemanLevel, CAVEMAN_LEVELS, type CavemanLevel } from "../../agent/caveman.js";
import { authGate } from "../../agent/auth-gate.js";
import { spawn } from "node:child_process";
import {
  AssistantBlock,
  Footer,
  InputBox,
  Palette,
  Selector,
  Splash,
  SystemBlock,
  ToolBlock,
  UserBlock,
  type PaletteItem,
  type SelectItem,
} from "./components.js";
import { listLoginProviders, runLogin, type LoginUI } from "../../agent/login.js";
import { G } from "./theme.js";

export interface SpaceOptions {
  initialMessage?: string;
  dryRun: boolean;
  autoYes: boolean;
  model?: string;
  caveman?: CavemanLevel;
}

const NOAH_TOOLS = ["read", "bash", "edit", "write", "grep", "find", "ls", "package", "service", "network", "system", "logs"];
const CUSTOM_TOOLS = [packageTool, serviceTool, networkTool, systemTool, logsTool];

const COMMANDS: PaletteItem[] = [
  { name: "model", desc: "choose a model" },
  { name: "login", desc: "auth status / set an API key" },
  { name: "logout", desc: "sign out of a provider" },
  { name: "caveman", desc: "token-saver terse mode (off/lite/full/ultra/micro)" },
  { name: "compact", desc: "compress context to save tokens" },
  { name: "extensions", desc: "active extensions" },
  { name: "theme", desc: "appearance" },
  { name: "audit", desc: "recent actions" },
  { name: "clear", desc: "clear the console" },
  { name: "help", desc: "what NOAH can do" },
  { name: "quit", desc: "exit NOAH" },
];

const ESC = "\x1b";
const UP = "\x1b[A";
const DOWN = "\x1b[B";
const isEnter = (s: string) => s === "\r" || s === "\n";

export async function runNoahSpace(opts: SpaceOptions): Promise<void> {
  if (opts.dryRun) process.env.NOAH_DRY_RUN = "1";

  // --- agent wiring ---------------------------------------------------------
  const { authStorage, modelRegistry } = await buildRegistry();
  const model = resolveModel(modelRegistry as unknown as RegistryLike, {
    flagModel: opts.model,
    envModel: process.env.NOAH_MODEL,
  });
  const scopedModels = modelRegistry.getAvailable().map((m) => ({ model: m }));

  const entries: import("@earendil-works/pi-tui").Component[] = [];
  let cavemanLevel: CavemanLevel = opts.caveman ?? "off";
  const loggedOut = new Set<string>(); // session-local logout (does not delete ~/.pi creds)
  const state = { busy: false, model: model.id, safety: opts.dryRun ? "dry-run" : "on" };

  let pendingConfirm: ((ok: boolean) => void) | null = null;
  const confirm = (req: { toolName: string; command: string; reason: string }) =>
    new Promise<boolean>((resolve) => {
      pushEntry(
        new SystemBlock(
          [
            `${G.node} safety review — ${req.reason}`,
            `${req.toolName}${req.command ? `: ${req.command}` : ""}`,
            `approve?  ${G.arrow} y / n`,
          ],
          "danger",
        ),
      );
      pendingConfirm = (ok) => {
        pendingConfirm = null;
        pushEntry(new SystemBlock([ok ? `${G.check} approved` : `${G.cross} declined`], ok ? "info" : "warn"));
        resolve(ok);
      };
    });

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    systemPromptOverride: () => NOAH_SYSTEM_PROMPT,
    appendSystemPromptOverride: () => [],
    extensionFactories: [
      safetyExtension({ dryRun: opts.dryRun, autoYes: opts.autoYes, confirm }),
      cavemanExtension(() => cavemanLevel),
    ],
  });
  await resourceLoader.reload();

  const { session } = await createAgentSession({
    resourceLoader,
    model: model as unknown as NonNullable<Parameters<typeof createAgentSession>[0]>["model"],
    authStorage,
    modelRegistry,
    scopedModels,
    tools: NOAH_TOOLS,
    customTools: CUSTOM_TOOLS,
    sessionManager: SessionManager.create(process.cwd()),
  });

  // --- layout ---------------------------------------------------------------
  const terminal = new ProcessTerminal();
  const tui = new TUI(terminal, true);
  const input = new Input();
  const transcript = new Container();
  const palette = new Palette();
  const inputArea = new Container();
  const inputBox = new InputBox(input, () => ({ busy: state.busy }));
  const footer = new Footer(() => ({ model: state.model, safety: state.safety, busy: state.busy, caveman: cavemanLevel }));
  inputArea.addChild(inputBox);

  // Startup health dashboard — visible on the fresh screen, hidden once chatting.
  let dash: DashboardData | null = null;
  const dashArea = new Container();
  dashArea.addChild(new Dashboard(() => dash));
  void collectSnapshot().then((snap) => {
    dash = dashboardData(snap);
    tui.requestRender();
  });

  tui.addChild(new Splash(() => entries.length === 0));
  tui.addChild(dashArea);
  tui.addChild(transcript);
  tui.addChild(palette);
  tui.addChild(inputArea);
  tui.addChild(footer);
  tui.setFocus(input);

  const sync = () => {
    transcript.clear();
    for (const e of entries) transcript.addChild(e);
    tui.requestRender();
  };
  function pushEntry(c: import("@earendil-works/pi-tui").Component) {
    entries.push(c);
    transcript.addChild(c);
    tui.requestRender();
  }

  let resolveRun: () => void;
  const done = new Promise<void>((r) => (resolveRun = r));
  const shutdown = () => {
    tui.stop();
    session.dispose();
    resolveRun();
  };

  // --- streaming ------------------------------------------------------------
  let stream: AssistantBlock | null = null;
  let turnProduced = false; // did this turn show the user anything?
  const toolBlocks = new Map<string, ToolBlock>();
  session.subscribe((event) => {
    switch (event.type) {
      case "message_update": {
        const e = event.assistantMessageEvent;
        if (e.type === "text_delta") {
          if (!stream) {
            stream = new AssistantBlock();
            pushEntry(stream);
          }
          stream.append(e.delta);
          turnProduced = true;
          tui.requestRender();
        }
        break;
      }
      case "tool_execution_start": {
        stream = null;
        turnProduced = true;
        const block = new ToolBlock(event.toolName, describeArgs(event.toolName, event.args), "running");
        toolBlocks.set(event.toolCallId, block);
        pushEntry(block);
        break;
      }
      case "tool_execution_end": {
        toolBlocks.get(event.toolCallId)?.set(event.isError ? "err" : "ok");
        tui.requestRender();
        break;
      }
      case "compaction_start":
        sys([`${G.node} compacting context to save tokens…`]);
        break;
      case "compaction_end":
        if (!event.aborted) sys([`${G.check} context compacted.`]);
        break;
      case "message_end": {
        // Surface model/provider errors (auth, deprecation, overflow) that arrive
        // on the final assistant message instead of as streamed text.
        const m = event.message as { role?: string; errorMessage?: string; stopReason?: string };
        if (m?.role === "assistant" && m.errorMessage) {
          turnProduced = true;
          sys([`${G.cross} ${m.errorMessage}`, hintForError(m.errorMessage)], "danger");
          appendAudit({ ts: new Date().toISOString(), tool: "model", input: { command: m.errorMessage }, ok: false });
        }
        stream = null;
        break;
      }
    }
  });

  // --- generic dropdown selector + line-prompt (used by /model, /login) -----
  let active: { sel: Selector; onPick: (it: SelectItem) => void; onCancel: () => void } | null = null;
  let pendingInput: ((s: string) => void) | null = null;

  const openSelector = (title: string, items: SelectItem[], onPick: (it: SelectItem) => void, onCancel = () => {}) => {
    const sel = new Selector(title, items);
    active = { sel, onPick, onCancel };
    inputArea.clear();
    inputArea.addChild(sel);
    tui.requestRender();
  };
  const closeSelector = () => {
    active = null;
    inputArea.clear();
    inputArea.addChild(inputBox);
    tui.setFocus(input);
    tui.requestRender();
  };

  const openModelSelector = () => {
    const items = modelRegistry.getAvailable().map((m) => ({ id: `${m.provider}/${m.id}`, label: `${m.provider}/${m.id}` }));
    if (items.length === 0) {
      sys([`${G.cross} no models available. Sign in with /login or start Ollama.`], "warn");
      return;
    }
    openSelector("select model", items, (it) => {
      closeSelector();
      const i = it.id.indexOf("/");
      const found = modelRegistry.find(it.id.slice(0, i), it.id.slice(i + 1));
      if (found)
        void session.setModel(found).then(() => {
          state.model = session.model?.id ?? it.id;
          sys([`${G.check} model → ${state.model}`]);
        });
    });
  };

  // line-prompt: capture the next submitted input (for OAuth code paste)
  const uiPrompt = (message: string) =>
    new Promise<string>((resolve) => {
      sys([`${G.node} ${message}`]);
      pendingInput = (s) => {
        pendingInput = null;
        resolve(s);
      };
    });

  const openInBrowser = (url: string) => {
    const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    try {
      spawn(cmd, [url], { stdio: "ignore", detached: true }).unref();
    } catch {
      /* user can copy the url from the note */
    }
  };

  const loginUI: LoginUI = {
    openUrl: openInBrowser,
    note: (m) => sys([m]),
    prompt: uiPrompt,
    select: (message, options) =>
      new Promise((resolve) => {
        openSelector(
          message,
          options.map((o) => ({ id: o.id, label: o.label })),
          (it) => {
            closeSelector();
            resolve(it.id);
          },
          () => {
            closeSelector();
            resolve(undefined);
          },
        );
      }),
  };

  const startLogin = async () => {
    const provs = await listLoginProviders();
    if (provs.length === 0) {
      sys([`${G.cross} no sign-in providers available.`], "warn");
      return;
    }
    openSelector(
      "sign in",
      provs.map((p) => ({ id: p.id, label: p.name })),
      (it) => {
        closeSelector();
        sys([`${G.node} signing in to ${it.label}…`]);
        void runLogin(it.id, loginUI, authStorage, modelRegistry).then((r) => {
          if (r.ok) {
            loggedOut.delete(it.id);
            sys([`${G.check} connected to ${it.label}. Use /model to pick a model.`]);
          } else {
            sys([`${G.cross} sign-in failed: ${r.error}`], "danger");
          }
        });
      },
    );
  };

  // --- commands -------------------------------------------------------------
  const sys = (lines: string[], kind: "info" | "warn" | "danger" = "info") => pushEntry(new SystemBlock(lines, kind));

  async function handleCommand(raw: string): Promise<void> {
    const [cmd, ...rest] = raw.slice(1).trim().split(/\s+/);
    const arg = rest.join(" ");
    switch (cmd) {
      case "help":
        sys([
          `${G.node} NOAH operates your OS from natural language.`,
          "Try: “install htop and start it” · “what’s using port 3000” · “tidy ~/Downloads”.",
          "Tools: bash · files · package · service · network — safety-gated and audited.",
          "Commands: /model /login /logout /extensions /audit /clear /quit · esc interrupts.",
        ]);
        break;
      case "model":
        if (arg) {
          const found = modelRegistry.find(arg.split("/")[0], arg.split("/").slice(1).join("/"));
          if (!found) sys([`${G.cross} unknown model “${arg}”.`], "warn");
          else {
            await session.setModel(found);
            state.model = session.model?.id ?? arg;
            sys([`${G.check} model → ${state.model}`]);
          }
        } else {
          openModelSelector();
        }
        break;
      case "login": {
        const [prov, key] = arg.split(/\s+/);
        if (prov && key) {
          authStorage.set(prov, { type: "api_key", key });
          modelRegistry.refresh();
          loggedOut.delete(prov);
          sys([`${G.check} saved API key for ${prov}. Use /model to pick one of its models.`]);
        } else {
          // No args → pi-style provider dropdown (Anthropic / GitHub Copilot / Codex).
          await startLogin();
        }
        break;
      }
      case "logout": {
        const prov = (arg.trim() || session.model?.provider) ?? "";
        if (!prov) sys(["usage: /logout <provider>"], "warn");
        else {
          loggedOut.add(prov);
          sys([`${G.check} signed out of ${prov} (this session). Run /login ${prov} to reconnect.`]);
        }
        break;
      }
      case "caveman": {
        const a = arg.trim().toLowerCase();
        if (!a) cavemanLevel = cavemanLevel === "off" ? "full" : "off";
        else if (a === "stop" || a === "off") cavemanLevel = "off";
        else if (isCavemanLevel(a)) cavemanLevel = a;
        else {
          sys([`${G.cross} levels: off, ${CAVEMAN_LEVELS.join(", ")}`], "warn");
          break;
        }
        sys([
          cavemanLevel === "off"
            ? `${G.node} caveman mode off — normal responses.`
            : `${G.check} caveman:${cavemanLevel} — terse replies, ~75% fewer output tokens. Applies next message.`,
        ]);
        break;
      }
      case "compact": {
        sys([`${G.node} compacting…`]);
        try {
          await session.compact();
        } catch (err) {
          sys([`${G.cross} compact failed: ${(err as Error).message}`], "warn");
        }
        break;
      }
      case "extensions":
        sys([
          `${G.node} active extensions:`,
          `${G.check} safety-gate    confirmation + blocklist + dry-run`,
          `${G.check} audit-log      every action recorded to .noah/audit.jsonl`,
          `${cavemanLevel === "off" ? G.dot : G.check} caveman        token-saver terse mode (/caveman)`,
          `${G.check} auto-compact   context compression to cut tokens (/compact)`,
        ]);
        break;
      case "theme":
        sys([`${G.node} NOAH uses a fixed cinematic theme (blue · black). More coming soon.`]);
        break;
      case "audit": {
        const e = readAudit().slice(-10);
        if (!e.length) sys(["no actions recorded yet."]);
        else
          sys([
            `${G.node} last ${e.length} actions:`,
            ...e.map((x) => {
              const c =
                x.input && typeof x.input === "object" && "command" in x.input
                  ? (x.input as { command: string }).command
                  : JSON.stringify(x.input);
              return `${x.ok ? G.check : G.cross} [${x.tool}] ${c}`;
            }),
          ]);
        break;
      }
      case "clear":
        entries.length = 0;
        if (dash && dashArea.children.length === 0) dashArea.addChild(new Dashboard(() => dash));
        sync();
        break;
      case "quit":
      case "exit":
        shutdown();
        break;
      default:
        sys([`${G.cross} unknown command “/${cmd}”. Type /help.`], "warn");
    }
  }

  async function submitPrompt(text: string): Promise<void> {
    dashArea.clear(); // hide the launch dashboard once the conversation starts
    // Auth gate: session-local /logout, then real credential check.
    const prov = session.model?.provider;
    if (prov && loggedOut.has(prov)) {
      pushEntry(new UserBlock(text));
      sys([`${G.cross} Signed out of ${prov}. Run /login ${prov} to reconnect.`], "warn");
      return;
    }
    const gate = authGate(session.model ?? undefined, authStorage);
    if (!gate.ok) {
      pushEntry(new UserBlock(text));
      sys([`${G.cross} ${gate.reason}`], "warn");
      return;
    }
    pushEntry(new UserBlock(text));
    appendAudit({ ts: new Date().toISOString(), tool: "message", input: { command: text }, ok: true });
    state.busy = true;
    stream = null;
    turnProduced = false;
    tui.requestRender();
    try {
      await session.prompt(text);
      if (!turnProduced) sys([`${G.node} the model returned no output. Try /model to switch, or rephrase.`], "warn");
    } catch (err) {
      sys([`${G.cross} ${(err as Error).message}`, hintForError((err as Error).message)], "danger");
    } finally {
      state.busy = false;
      tui.requestRender();
    }
  }

  input.onSubmit = (raw) => {
    const text = raw.trim();
    input.setValue("");
    palette.visible = false;
    // OAuth code paste / interactive prompt capture
    if (pendingInput) {
      pendingInput(text);
      return;
    }
    if (!text) return;
    if (text.startsWith("/")) void handleCommand(text);
    else if (!state.busy) void submitPrompt(text);
  };

  // --- key routing ----------------------------------------------------------
  const syncPalette = () => {
    const v = input.getValue();
    if (!state.busy && v.startsWith("/")) {
      const q = v.slice(1).toLowerCase();
      const matches = COMMANDS.filter((c) => c.name.startsWith(q));
      palette.set(matches);
      palette.visible = matches.length > 0;
    } else {
      palette.visible = false;
    }
    tui.requestRender();
  };

  tui.addInputListener((data) => {
    if (pendingConfirm) {
      if (/^y/i.test(data) || isEnter(data)) pendingConfirm(true);
      else if (/^n/i.test(data) || data === ESC) pendingConfirm(false);
      return { consume: true };
    }
    if (active) {
      if (data === UP) active.sel.move(-1);
      else if (data === DOWN) active.sel.move(1);
      else if (isEnter(data)) {
        const it = active.sel.current();
        const onPick = active.onPick;
        if (it) onPick(it);
        else closeSelector();
        return { consume: true };
      } else if (data === ESC) {
        const onCancel = active.onCancel;
        onCancel();
        return { consume: true };
      }
      tui.requestRender();
      return { consume: true };
    }
    if (palette.visible) {
      if (data === UP) {
        palette.move(-1);
        tui.requestRender();
        return { consume: true };
      }
      if (data === DOWN) {
        palette.move(1);
        tui.requestRender();
        return { consume: true };
      }
      if (isEnter(data)) {
        const item = palette.current();
        if (item) {
          input.setValue("");
          palette.visible = false;
          void handleCommand(`/${item.name}`);
        }
        return { consume: true };
      }
      if (data === ESC) {
        palette.visible = false;
        tui.requestRender();
        return { consume: true };
      }
    } else if (state.busy && data === ESC) {
      void session.abort();
      return { consume: true };
    }
    queueMicrotask(syncPalette);
    return undefined;
  });

  // --- go -------------------------------------------------------------------
  tui.start();
  tui.requestRender();
  if (opts.initialMessage) void submitPrompt(opts.initialMessage);
  await done;
}

/** A short, actionable hint for common model errors. */
function hintForError(msg: string): string {
  const m = msg.toLowerCase();
  if (/auth|api key|unauthor|401|credential|login/.test(m)) return "→ run /login, or pick another model with /model.";
  if (/deprecat|end-of-life|not found|404|model/.test(m)) return "→ choose a current model with /model.";
  if (/overflow|context|too long|429|rate/.test(m)) return "→ try again, or /clear to reset the conversation.";
  return "→ try /model to switch, or /login to re-authenticate.";
}

function describeArgs(toolName: string, args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const a = args as Record<string, unknown>;
  if (typeof a.command === "string") return a.command;
  if (toolName === "package") return `${a.action ?? ""} ${a.pkg ?? ""}`.trim();
  if (toolName === "service") return `${a.action ?? ""} ${a.name ?? ""}`.trim();
  if (toolName === "network") return `${a.action ?? ""} ${a.target ?? ""}`.trim();
  if (typeof a.path === "string") return String(a.path);
  return JSON.stringify(a);
}
