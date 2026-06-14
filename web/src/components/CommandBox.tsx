import { motion } from "framer-motion";
import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { NPM_CMD } from "../lib";

export default function CommandBox({ big = false }: { big?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(NPM_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className={`glass blue-shadow group flex w-full items-center justify-between gap-4 rounded-2xl px-4 ${
        big ? "py-5" : "py-3.5"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Terminal className="h-5 w-5 shrink-0 text-cyan-400" />
        <code className={`mono truncate text-left ${big ? "text-base sm:text-lg" : "text-sm sm:text-base"} text-slate-200`}>
          <span className="text-cyan-400">$</span> {NPM_CMD}
          <span className="blink ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-cyan-300" />
        </code>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition group-hover:bg-cyan-400/15">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </span>
    </motion.button>
  );
}
