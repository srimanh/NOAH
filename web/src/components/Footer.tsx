import { Github, Package, BookOpen } from "lucide-react";
import { LINKS } from "../lib";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-cyan-400/30 bg-cyan-400/5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38e1ff]" />
          </span>
          <div>
            <div className="text-sm font-bold tracking-[0.2em] text-white">NOAH</div>
            <div className="mono text-[10px] text-slate-500">Native Operating-System Agentic Harness</div>
          </div>
        </div>

        <div className="flex items-center gap-5 text-sm text-slate-400">
          <a href={LINKS.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-cyan-300">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a href={LINKS.npm} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-cyan-300">
            <Package className="h-4 w-4" /> npm
          </a>
          <a href={LINKS.docs} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-cyan-300">
            <BookOpen className="h-4 w-4" /> Docs
          </a>
        </div>

        <div className="mono text-xs text-slate-600">MIT © Sriman · built with NOAH</div>
      </div>
    </footer>
  );
}
