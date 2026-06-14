import { useEffect, useRef, useState } from "react";

/** Types out `text` character by character; calls onDone when finished. */
export function useTypewriter(text: string, opts: { speed?: number; start?: boolean; onDone?: () => void } = {}) {
  const { speed = 26, start = true, onDone } = opts;
  const [out, setOut] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (!start) return;
    setOut("");
    done.current = false;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        if (!done.current) {
          done.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, start, speed]);

  return out;
}
