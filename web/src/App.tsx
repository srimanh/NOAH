import { motion, useScroll, useSpring } from "framer-motion";
import Background from "./components/Background";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import SysAdmin from "./components/SysAdmin";
import Terminal from "./components/Terminal";
import Architecture from "./components/Architecture";
import Features from "./components/Features";
import Trust from "./components/Trust";
import Benchmarks from "./components/Benchmarks";
import Roadmap from "./components/Roadmap";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

export default function App() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <div className="relative min-h-screen">
      <Background />

      {/* scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600"
      />

      <Nav />

      <main className="relative z-10">
        <Hero />
        <Problem />
        <SysAdmin />
        <Terminal />
        <Architecture />
        <Features />
        <Trust />
        <Benchmarks />
        <Roadmap />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
