import { motion } from "framer-motion";
import { Github, BookOpen, Package } from "lucide-react";
import { LINKS } from "../lib";

function Logo() {
  return (
    <a href="#top" className="group flex items-center gap-3">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/5">
        <span className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#38e1ff]" />
        <span className="absolute h-4 w-4 rounded-full border border-cyan-400/50" />
        <span className="absolute h-7 w-7 rounded-full border border-cyan-400/20" />
      </span>
      <div className="leading-none">
        <div className="text-lg font-extrabold tracking-[0.2em] text-white">NOAH</div>
        <div className="mono text-[9px] tracking-[0.18em] text-cyan-300/70">SYSTEM ONLINE</div>
      </div>
    </a>
  );
}

const links = [
  { label: "GitHub", href: LINKS.github, Icon: Github },
  { label: "Docs", href: LINKS.docs, Icon: BookOpen },
  { label: "npm", href: LINKS.npm, Icon: Package },
];

export default function Nav() {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <div className="glass rounded-2xl px-3 py-2">
          <Logo />
        </div>
        <nav className="glass flex items-center gap-1 rounded-2xl p-1.5">
          {links.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-cyan-400/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}
