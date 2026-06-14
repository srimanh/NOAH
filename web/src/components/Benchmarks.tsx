import { CheckCircle2, ShieldCheck, Hammer, Activity, Rocket, Package } from "lucide-react";
import { Reveal, Section, SectionLabel, CountUp } from "./ui";

const metrics = [
  { Icon: CheckCircle2, value: <CountUp to={180} />, label: "Tests Passing", sub: "full suite, 0 skipped" },
  { Icon: ShieldCheck, value: <CountUp to={0} />, label: "Vulnerabilities", sub: "npm audit clean" },
  { Icon: Hammer, value: <><CountUp to={100} suffix="%" /></>, label: "Build Success", sub: "reproducible tsc build" },
  { Icon: Activity, value: "LIVE", label: "Telemetry", sub: "cross-platform probe" },
  { Icon: Rocket, value: "READY", label: "Production", sub: "shipped & gated" },
  { Icon: Package, value: "v0.2.1", label: "npm Published", sub: "noah-agent@latest" },
];

export default function Benchmarks() {
  return (
    <Section id="benchmarks">
      <Reveal>
        <SectionLabel>Benchmarks</SectionLabel>
        <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Engineered to <span className="text-cyan-gradient">military-grade</span> standards.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ Icon, value, label, sub }, i) => (
          <Reveal key={label} delay={(i % 3) * 0.06}>
            <div className="glass group relative overflow-hidden rounded-2xl p-6">
              <div className="scanline pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-cyan-300" />
                <span className="mono text-xs text-slate-600">0{i + 1}</span>
              </div>
              <div className="mono mt-5 text-4xl font-extrabold text-white glow-text">{value}</div>
              <div className="mt-2 font-semibold text-cyan-200">{label}</div>
              <div className="text-sm text-slate-500">{sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
