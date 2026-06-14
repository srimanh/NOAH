import { motion } from "framer-motion";
import { User, Boxes, Activity, ShieldCheck, Server, HardDrive, Cpu, Network, ScrollText, Settings } from "lucide-react";
import { Reveal, Section, SectionLabel } from "./ui";

const layers = [
  { Icon: User, t: "You", d: "Natural-language intent", tone: "text-white" },
  { Icon: Boxes, t: "NOAH Core", d: "Agent loop · reasoning · approval", tone: "text-cyan-300" },
  { Icon: Activity, t: "Telemetry Layer", d: "Reads the machine's real state", tone: "text-sky-300" },
  { Icon: ShieldCheck, t: "Safety Layer", d: "classify → deny / confirm / allow + audit", tone: "text-emerald-300" },
  { Icon: Server, t: "Operating System", d: "Executed via per-OS adapters", tone: "text-indigo-300" },
];

const signals = [
  { Icon: Cpu, t: "Memory" },
  { Icon: HardDrive, t: "Disk" },
  { Icon: Settings, t: "Processes" },
  { Icon: ScrollText, t: "Logs" },
  { Icon: Activity, t: "Services" },
  { Icon: Network, t: "Network" },
];

export default function Architecture() {
  return (
    <Section id="architecture">
      <Reveal>
        <SectionLabel>Architecture</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Every action passes through a <span className="text-cyan-gradient">safety-gated pipeline</span>.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        {/* layered stack */}
        <div className="relative space-y-3">
          <div className="pointer-events-none absolute bottom-6 left-[34px] top-6 w-px bg-gradient-to-b from-cyan-400/0 via-cyan-400/40 to-cyan-400/0" />
          {layers.map(({ Icon, t, d, tone }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="glass relative flex items-center gap-4 rounded-2xl p-4">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-black/40">
                  <Icon className={`h-5 w-5 ${tone}`} />
                  <motion.span
                    className="absolute inset-0 rounded-xl border border-cyan-400/40"
                    animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.3, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
                  />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-white">{t}</div>
                  <div className="text-sm text-slate-400">{d}</div>
                </div>
                <span className="mono ml-auto text-xs text-slate-600">L{i}</span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* telemetry signals radar */}
        <Reveal delay={0.1}>
          <div className="glass relative grid h-full place-items-center overflow-hidden rounded-3xl p-8">
            <div className="absolute inset-0 grid-bg opacity-40" />
            <div className="relative grid grid-cols-2 gap-4">
              {signals.map(({ Icon, t }, i) => (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <span className="text-sm font-medium text-white">{t}</span>
                  <motion.span
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
            <div className="mono relative mt-6 text-center text-xs text-cyan-300/70">
              live telemetry · sampled on demand
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
