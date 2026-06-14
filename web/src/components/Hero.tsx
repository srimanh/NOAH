import { motion } from "framer-motion";
import { ArrowRight, Boxes, Cpu, Download } from "lucide-react";
import { LINKS } from "../lib";
import { CountUp } from "./ui";
import CommandBox from "./CommandBox";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center justify-center px-5 pt-28 sm:px-8">
      {/* orbiting core, right side */}
      <div className="pointer-events-none absolute right-[-6%] top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="relative h-[560px] w-[560px]">
          {[160, 250, 360].map((r, i) => (
            <motion.div
              key={r}
              className="absolute left-1/2 top-1/2 rounded-full border border-cyan-400/15"
              style={{ width: r, height: r, marginLeft: -r / 2, marginTop: -r / 2 }}
              animate={{ rotate: i % 2 ? -360 : 360 }}
              transition={{ duration: 30 + i * 14, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_#38e1ff]" />
            </motion.div>
          ))}
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 blur-[2px]" />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-cyan-400/30" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Native Operating-System Agentic Harness
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.05 }}
          className="text-balance text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-7xl"
        >
          <span className="text-gradient glow-text">Your Operating System</span>
          <br />
          <span className="text-cyan-gradient">Now Has an AI Administrator.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.15 }}
          className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300/90 sm:text-xl"
        >
          NOAH understands your machine <span className="text-white">before it acts</span>. It inspects memory,
          disk, processes, services, logs, and system health — then recommends, and safely executes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.25 }}
          className="mt-9 max-w-2xl"
        >
          <CommandBox big />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.35 }}
          className="mt-7 flex flex-wrap items-center gap-4"
        >
          <a
            href={LINKS.github}
            target="_blank"
            rel="noreferrer"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-6 py-3.5 font-semibold text-[#02040a] transition hover:shadow-[0_0_40px_-6px_#38e1ff]"
          >
            <span className="shimmer absolute inset-0" />
            <Download className="relative h-4 w-4" />
            <span className="relative">Launch NOAH</span>
          </a>
          <a
            href="#architecture"
            className="glass inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white transition hover:text-cyan-300"
          >
            View Architecture <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400"
        >
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4 text-cyan-400" />
            <span className="mono text-white">
              <CountUp to={12480} />
            </span>{" "}
            installs
          </span>
          <span className="inline-flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" /> Linux &amp; macOS
          </span>
          <span className="inline-flex items-center gap-2">
            <Boxes className="h-4 w-4 text-cyan-400" /> v0.2.1 · MIT
          </span>
        </motion.div>
      </div>

      <a
        href="#problem"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 text-cyan-300/60 transition hover:text-cyan-300"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
          <div className="mx-auto h-9 w-5 rounded-full border border-cyan-400/30 p-1">
            <div className="mx-auto h-2 w-1 rounded-full bg-cyan-300" />
          </div>
        </motion.div>
      </a>
    </section>
  );
}
