import { motion } from "framer-motion";
import { Eye, Brain, Lightbulb, ShieldCheck, Play, User, Server } from "lucide-react";
import { Reveal, Section, SectionLabel } from "./ui";

const stages = [
  { Icon: Eye, t: "Inspect", d: "Read live telemetry: memory, disk, processes, services, logs." },
  { Icon: Brain, t: "Analyze", d: "Assess impact, cost, and what could go wrong. Assign severity." },
  { Icon: Lightbulb, t: "Recommend", d: "Best action + safer alternatives, grounded in real data." },
  { Icon: ShieldCheck, t: "Approve", d: "Dangerous actions wait for you. Catastrophic ones are blocked." },
  { Icon: Play, t: "Execute", d: "Run it the right way for your OS — and log every step." },
];

const requests = ['"Install PostgreSQL"', '"Why is my laptop slow?"', '"Free disk space"', '"Restart nginx"'];

export default function SysAdmin() {
  return (
    <Section id="admin">
      <Reveal>
        <SectionLabel>The AI System Administrator</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          A request flows through NOAH <span className="text-cyan-gradient">into your machine</span>.
        </h2>
      </Reveal>

      {/* flow rail: User -> NOAH -> OS */}
      <Reveal delay={0.05}>
        <div className="relative mt-12 grid items-center gap-6 md:grid-cols-[1fr_auto_1.2fr_auto_1fr]">
          <Node Icon={User} label="You" sub="natural language" />
          <Connector />
          <div className="glass blue-shadow relative overflow-hidden rounded-3xl border-cyan-400/30 p-6 text-center">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <div className="mono text-xs tracking-[0.3em] text-cyan-300">N O A H</div>
            <div className="mt-3 grid gap-2">
              {requests.map((r, i) => (
                <motion.div
                  key={r}
                  initial={{ opacity: 0.4 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="mono rounded-lg border border-cyan-400/10 bg-black/40 px-3 py-1.5 text-xs text-emerald-300"
                >
                  {r}
                </motion.div>
              ))}
            </div>
          </div>
          <Connector />
          <Node Icon={Server} label="Operating System" sub="executed safely" />
        </div>
      </Reveal>

      {/* reasoning stages */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stages.map(({ Icon, t, d }, i) => (
          <Reveal key={t} delay={i * 0.06}>
            <div className="glass group h-full rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mono text-xs text-slate-500">0{i + 1}</span>
              </div>
              <div className="mt-4 font-semibold text-white">{t}</div>
              <div className="mt-1 text-sm text-slate-400">{d}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Node({ Icon, label, sub }: { Icon: typeof User; label: string; sub: string }) {
  return (
    <div className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300">
        <Icon className="h-6 w-6" />
      </span>
      <div className="font-semibold text-white">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function Connector() {
  return (
    <div className="relative hidden h-px min-w-12 bg-cyan-400/15 md:block">
      <motion.span
        className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_#38e1ff]"
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
