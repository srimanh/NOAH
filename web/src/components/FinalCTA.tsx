import { motion } from "framer-motion";
import { Github, Download } from "lucide-react";
import { LINKS } from "../lib";
import { Reveal } from "./ui";
import CommandBox from "./CommandBox";

export default function FinalCTA() {
  return (
    <section id="cta" className="relative mx-auto w-full max-w-7xl px-5 py-32 sm:px-8 md:py-44">
      <div className="glass relative overflow-hidden rounded-[2rem] border-cyan-400/20 px-6 py-20 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />

        <Reveal>
          <div className="mono mb-6 text-xs uppercase tracking-[0.4em] text-cyan-300/80">/// system ready</div>
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="text-gradient">Stop Memorizing Commands.</span>
            <br />
            <span className="text-cyan-gradient glow-text">Start Managing Systems.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-xl">
            <CommandBox big />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <motion.a
              href={LINKS.npm}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-7 py-4 font-semibold text-[#02040a]"
            >
              <span className="shimmer absolute inset-0" />
              <Download className="relative h-5 w-5" />
              <span className="relative">Install Now</span>
            </motion.a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
              className="glass inline-flex items-center gap-2 rounded-xl px-7 py-4 font-semibold text-white transition hover:text-cyan-300"
            >
              <Github className="h-5 w-5" /> View GitHub
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
