import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTypewriter } from "../hooks/useTypewriter";
import { Reveal, Section, SectionLabel } from "./ui";

type Line = { text: string; c?: string; pre?: string };
type Demo = { cmd: string; title: string; lines: Line[] };

const C = {
  dim: "text-slate-500",
  ok: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-rose-300",
  cyan: "text-cyan-300",
  ink: "text-slate-200",
  nebula: "text-indigo-300",
};

const DEMOS: Demo[] = [
  {
    cmd: "noah doctor",
    title: "Deterministic health report — no LLM",
    lines: [
      { text: "SYSTEM HEALTH — WARN", c: C.warn },
      { text: "OS: macOS 14.5", c: C.ink },
      { text: "Memory: 82% used (13.1 GB / 16.0 GB)", c: C.ink },
      { text: "Disk /: 86% used (70 GB free)", c: C.ink },
      { text: "Top: Chrome 42% · node 12% · Docker 9%", c: C.dim },
      { text: "Recommendations (by priority):", c: C.cyan },
      { text: "  [high]  Disk filling up — / at 86%", c: C.bad, pre: "▸" },
      { text: "  [med]   3 updates available", c: C.warn, pre: "▸" },
      { text: "Extensions (2 loaded): anthropic-subscription-fix, github-copilot-fix", c: C.dim },
    ],
  },
  {
    cmd: 'noah "why is my laptop slow?"',
    title: "Grounded root-cause analysis",
    lines: [
      { text: "◆ reading telemetry…", c: C.cyan },
      { text: "✓ system:health", c: C.ok },
      { text: "Memory pressure high — 82% used, swapping likely.", c: C.ink },
      { text: "Top offender: 'Chrome Helper' at 42% CPU (pid 24615).", c: C.ink },
      { text: "Disk at 86% — low headroom slows the whole system.", c: C.ink },
      { text: "Severity: medium. Recommended:", c: C.warn },
      { text: "  1. Close idle Chrome tabs / restart the helper", c: C.ink, pre: "›" },
      { text: "  2. Reclaim ~12 GB of caches (run /free)", c: C.ink, pre: "›" },
    ],
  },
  {
    cmd: 'noah "install postgresql"',
    title: "Pre-flight checks → impact → approval gate",
    lines: [
      { text: "✓ system:disk    21.4 GB free — sufficient", c: C.ok },
      { text: "✓ system:info    no existing postgres detected", c: C.ok },
      { text: "Plan:", c: C.cyan },
      { text: "  • brew install postgresql@16  (~310 MB)", c: C.ink, pre: "›" },
      { text: "  • initialize cluster + start service", c: C.ink, pre: "›" },
      { text: "Impact: medium · disk +310 MB · new background service", c: C.warn },
      { text: "⚠ safety review — install software", c: C.bad },
      { text: "approve?  › y / n", c: C.nebula },
      { text: "✓ approved → installing → service running ✓", c: C.ok },
    ],
  },
  {
    cmd: 'noah "free up space"',
    title: "Find reclaimable storage — safe cleanup",
    lines: [
      { text: "Scanning caches, logs, and large files…", c: C.cyan },
      { text: "Reclaimable:", c: C.ink },
      { text: "  • ~/Library/Caches            6.2 GB", c: C.ink, pre: "›" },
      { text: "  • Docker dangling images      3.8 GB", c: C.ink, pre: "›" },
      { text: "  • npm / pip caches            1.9 GB", c: C.ink, pre: "›" },
      { text: "Total safe to reclaim: 11.9 GB", c: C.ok },
      { text: "⚠ confirm before deleting?  › y / n", c: C.nebula },
    ],
  },
];

export default function Terminal() {
  const [active, setActive] = useState(0);
  const demo = DEMOS[active];

  return (
    <Section id="demo">
      <Reveal>
        <SectionLabel>Live Terminal</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Watch NOAH <span className="text-cyan-gradient">think before it acts</span>.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-wrap gap-2">
          {DEMOS.map((d, i) => (
            <button
              key={d.cmd}
              onClick={() => setActive(i)}
              className={`mono rounded-lg border px-3 py-1.5 text-xs transition ${
                i === active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {d.cmd.replace("noah ", "")}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="glass blue-shadow mt-5 overflow-hidden rounded-2xl border-cyan-400/20">
          {/* titlebar */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-rose-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="mono ml-3 text-xs text-slate-400">noah — {demo.title}</span>
          </div>
          <div className="mono min-h-[360px] bg-[#04070f] p-5 text-sm leading-relaxed sm:p-6">
            <TerminalBody key={active} demo={demo} onComplete={() => setActive((a) => (a + 1) % DEMOS.length)} />
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function TerminalBody({ demo, onComplete }: { demo: Demo; onComplete: () => void }) {
  const [shown, setShown] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const cmd = useTypewriter(demo.cmd, { speed: 34, onDone: () => setTypingDone(true) });
  const timers = useRef<number[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShown(0);
    setTypingDone(false);
  }, [demo]);

  useEffect(() => {
    if (!typingDone) return;
    demo.lines.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setShown(i + 1), 260 + i * 230));
    });
    timers.current.push(window.setTimeout(onComplete, 260 + demo.lines.length * 230 + 3200));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typingDone, demo]);

  return (
    <div>
      <div className="text-slate-200">
        <span className="text-cyan-400">noah@system</span>
        <span className="text-slate-500"> ~ </span>
        <span className="text-emerald-300">$</span> {cmd}
        {!typingDone && <span className="blink ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-cyan-300" />}
      </div>
      <div className="mt-3 space-y-1">
        <AnimatePresence>
          {demo.lines.slice(0, shown).map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={l.c ?? "text-slate-300"}
            >
              {l.pre && <span className="mr-1 text-cyan-400">{l.pre}</span>}
              {l.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {typingDone && shown >= demo.lines.length && (
          <div className="text-slate-200">
            <span className="text-emerald-300">$</span>{" "}
            <span className="blink inline-block h-[1.05em] w-[7px] translate-y-[2px] bg-cyan-300" />
          </div>
        )}
      </div>
    </div>
  );
}
