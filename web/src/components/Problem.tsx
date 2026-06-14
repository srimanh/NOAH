import { motion } from "framer-motion";
import { Clock, Search, FileText, Terminal, Zap, ArrowRight } from "lucide-react";
import { Reveal, Section, SectionLabel, item, stagger } from "./ui";

const pains = [
  { Icon: Search, t: "Installing PostgreSQL", d: "Right version, right config, right service." },
  { Icon: Terminal, t: "Debugging Docker", d: "Daemon down? Port taken? Out of space?" },
  { Icon: FileText, t: "Reading logs", d: "journalctl vs log show — and what to grep." },
  { Icon: Zap, t: "Laptop is slow", d: "Which process? Memory pressure? Thermals?" },
];

export default function Problem() {
  return (
    <Section id="problem">
      <Reveal>
        <SectionLabel>The Problem</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Operating a machine still means{" "}
          <span className="text-cyan-gradient">memorizing commands</span> and hunting through tabs.
        </h2>
      </Reveal>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {pains.map(({ Icon, t, d }) => (
          <motion.div
            key={t}
            variants={item}
            className="glass group relative overflow-hidden rounded-2xl p-5"
          >
            <div className="scanline pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
            <Icon className="h-6 w-6 text-cyan-400" />
            <div className="mt-4 font-semibold text-white">{t}</div>
            <div className="mt-1 text-sm text-slate-400">{d}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-10 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Reveal>
          <div className="glass h-full rounded-3xl p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/80">Current Workflow</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white">25–30</span>
              <span className="text-slate-400">minutes</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
              {["Google the error", "Scroll Stack Overflow", "Cross-check the docs", "Paste commands and pray"].map(
                (s, i) => (
                  <li key={s} className="flex items-center gap-3">
                    <span className="mono grid h-6 w-6 place-items-center rounded-md border border-rose-400/20 bg-rose-400/5 text-[11px] text-rose-300">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ),
              )}
            </ul>
          </div>
        </Reveal>

        <div className="grid place-items-center">
          <motion.div
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="grid h-12 w-12 place-items-center rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-300"
          >
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </div>

        <Reveal delay={0.1}>
          <div className="glass blue-shadow relative h-full overflow-hidden rounded-3xl border-cyan-400/30 p-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">NOAH Workflow</div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-cyan-gradient">Ask once.</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-white">Done.</div>
            <div className="mono mt-6 rounded-xl border border-cyan-400/15 bg-black/40 p-3 text-sm text-slate-300">
              <span className="text-cyan-400">$</span> noah <span className="text-emerald-300">"install postgresql"</span>
              <div className="mt-2 flex items-center gap-2 text-emerald-300">
                <Clock className="h-3.5 w-3.5" /> checked · recommended · installed · verified
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
