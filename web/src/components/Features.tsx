import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Stethoscope,
  Package,
  Server,
  Network,
  ScrollText,
  ShieldCheck,
  MonitorSmartphone,
  Code2,
} from "lucide-react";
import { Reveal, Section, SectionLabel } from "./ui";

const features = [
  { Icon: Activity, t: "Machine Awareness", d: "Reads memory, disk, processes, services & logs before acting." },
  { Icon: Gauge, t: "Health Dashboard", d: "Live status, meters, and prioritized recommendations on launch." },
  { Icon: Stethoscope, t: "AI Doctor", d: "Deterministic + LLM analysis with severity and root cause." },
  { Icon: Package, t: "Package Management", d: "apt · dnf · pacman · zypper · brew — auto-routed per OS." },
  { Icon: Server, t: "Service Control", d: "systemd & launchd: start, stop, restart, status, enable." },
  { Icon: Network, t: "Network Diagnostics", d: "Interfaces, ports, connections, ping, gated fetch." },
  { Icon: ScrollText, t: "Audit Logging", d: "Every action appended to .noah/audit.jsonl. Accountable." },
  { Icon: ShieldCheck, t: "Safety Gates", d: "Confirm dangerous ops; hard-block the catastrophic." },
  { Icon: MonitorSmartphone, t: "Cross-Platform", d: "Linux & macOS, first-class. One agent, one interface." },
  { Icon: Code2, t: "SDK Integration", d: "Embed NOAH in your app: createNoahSession() + RPC mode." },
];

export default function Features() {
  return (
    <Section id="features">
      <Reveal>
        <SectionLabel>Capabilities</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          A complete <span className="text-cyan-gradient">operating-system toolkit</span>, governed by one brain.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {features.map(({ Icon, t, d }, i) => (
          <Reveal key={t} delay={(i % 5) * 0.05}>
            <motion.div
              whileHover={{ y: -6 }}
              className="glass group relative h-full overflow-hidden rounded-2xl p-5"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-400/0 blur-2xl transition group-hover:bg-cyan-400/20" />
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/5 text-cyan-300 transition group-hover:scale-110 group-hover:border-cyan-400/50">
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-4 font-semibold text-white">{t}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-slate-400">{d}</div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
