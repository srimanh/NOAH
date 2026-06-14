import { motion } from "framer-motion";
import { Mic, Bot, MonitorCheck, Network, Cloud } from "lucide-react";
import { Reveal, Section, SectionLabel } from "./ui";

const milestones = [
  { Icon: Mic, t: "Voice Interface", d: "Speak to your OS. Whisper in, Piper out.", tag: "Next" },
  { Icon: Bot, t: "Autonomous Maintenance", d: "A daemon that watches health and acts ahead.", tag: "Planned" },
  { Icon: MonitorCheck, t: "Windows Support", d: "PowerShell adapter — the same brain, a third OS.", tag: "Planned" },
  { Icon: Network, t: "Fleet Management", d: "One NOAH operating many machines over RPC.", tag: "Future" },
  { Icon: Cloud, t: "Remote Infrastructure", d: "Cloud servers and edge nodes, safely operated.", tag: "Future" },
];

export default function Roadmap() {
  return (
    <Section id="roadmap">
      <Reveal>
        <SectionLabel>Roadmap</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          The trajectory toward an <span className="text-cyan-gradient">autonomous OS</span>.
        </h2>
      </Reveal>

      <div className="relative mt-14 pl-2">
        <div className="absolute bottom-0 left-[27px] top-0 w-px bg-gradient-to-b from-cyan-400/50 via-cyan-400/20 to-transparent" />
        <div className="space-y-6">
          {milestones.map(({ Icon, t, d, tag }, i) => (
            <Reveal key={t} delay={i * 0.08}>
              <div className="relative flex items-start gap-5">
                <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/20 bg-[#04070f]">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <motion.span
                    className="absolute inset-0 rounded-2xl border border-cyan-400/40"
                    animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.25, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.4 }}
                  />
                </span>
                <div className="glass flex-1 rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{t}</span>
                    <span className="mono rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan-300">
                      {tag}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">{d}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
