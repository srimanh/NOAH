import { motion } from "framer-motion";
import { Eye, Hand, Ban, ScrollText, Calculator, Radar, ShieldAlert } from "lucide-react";
import { Reveal, Section, SectionLabel } from "./ui";

const pillars = [
  { Icon: Eye, t: "Reads before acting", d: "Grounded in real telemetry, never assumptions." },
  { Icon: Hand, t: "Approval required", d: "Mutating actions wait for your explicit yes." },
  { Icon: Ban, t: "Catastrophes blocked", d: "rm -rf /, mkfs, fork bombs — hard-denied." },
  { Icon: ScrollText, t: "Full audit trail", d: "Every command recorded to .noah/audit.jsonl." },
  { Icon: Calculator, t: "Deterministic health", d: "Severity rules run without the LLM." },
  { Icon: Radar, t: "Real telemetry", d: "Disk, memory, processes, services, logs." },
];

export default function Trust() {
  return (
    <Section id="trust">
      <Reveal>
        <SectionLabel>Why Trust NOAH</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Autonomous when you trust it. <span className="text-cyan-gradient">Blocked when you don't.</span>
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map(({ Icon, t, d }, i) => (
            <Reveal key={t} delay={(i % 2) * 0.06}>
              <div className="glass h-full rounded-2xl p-5">
                <Icon className="h-5 w-5 text-emerald-300" />
                <div className="mt-3 font-semibold text-white">{t}</div>
                <div className="mt-1 text-sm text-slate-400">{d}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* blocked command demo */}
        <Reveal delay={0.1}>
          <div className="glass blue-shadow relative overflow-hidden rounded-3xl border-rose-400/20 p-6">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="mono text-sm">
              <div className="text-slate-200">
                <span className="text-cyan-400">noah@system</span>{" "}
                <span className="text-emerald-300">$</span> noah --check{" "}
                <span className="text-rose-300">"rm -rf /"</span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3"
              >
                <ShieldAlert className="h-6 w-6 text-rose-400" />
                <div>
                  <div className="text-base font-bold tracking-wide text-rose-300">⛔ SAFETY BLOCK</div>
                  <div className="text-xs text-rose-200/70">blocked: recursive delete of root — no override</div>
                </div>
              </motion.div>
              <div className="mt-4 space-y-1 text-xs">
                <div className="text-slate-300">
                  <span className="text-cyan-400">→</span> dangerous ops:{" "}
                  <span className="text-amber-300">confirm</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-cyan-400">→</span> read-only ops:{" "}
                  <span className="text-emerald-300">allow</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-cyan-400">→</span> catastrophic ops:{" "}
                  <span className="text-rose-300">deny</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
