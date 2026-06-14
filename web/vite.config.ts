import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages serves from https://srimanh.github.io/NOAH/
export default defineConfig({
  base: "/NOAH/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist", sourcemap: false, target: "es2020" },
});
