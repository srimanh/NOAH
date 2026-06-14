import { useEffect, useState } from "react";

/** Global futuristic backdrop: grid, aurora blobs, floating particles, cursor glow. */
export default function Background() {
  const [cursor, setCursor] = useState({ x: -500, y: -500 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const particles = Array.from({ length: 26 });

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* base gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,#0a1530_0%,#02040a_55%)]" />

      {/* moving grid */}
      <div className="grid-bg absolute inset-0" />

      {/* aurora blobs */}
      <div className="aurora left-[-10%] top-[-10%] h-[40vmax] w-[40vmax] rounded-full bg-[#1d4ed8]" />
      <div
        className="aurora right-[-15%] top-[20%] h-[34vmax] w-[34vmax] rounded-full bg-[#0891b2]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="aurora bottom-[-15%] left-[25%] h-[36vmax] w-[36vmax] rounded-full bg-[#3730a3]"
        style={{ animationDelay: "-11s" }}
      />

      {/* floating particles */}
      {particles.map((_, i) => {
        const size = 1 + (i % 3);
        const left = (i * 37) % 100;
        const dur = 14 + (i % 9) * 2.4;
        const delay = -(i * 1.7);
        return (
          <span
            key={i}
            className="particle bottom-[-8px]"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              opacity: 0.5,
              boxShadow: "0 0 8px rgba(125,211,252,0.9)",
              animation: `float-up ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,#02040a_100%)]" />

      {/* cursor glow */}
      <div
        className="absolute h-[420px] w-[420px] rounded-full opacity-50 transition-transform duration-150"
        style={{
          left: cursor.x - 210,
          top: cursor.y - 210,
          background: "radial-gradient(circle, rgba(56,225,255,0.10), transparent 65%)",
        }}
      />
    </div>
  );
}
