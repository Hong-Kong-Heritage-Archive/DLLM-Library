import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: true,
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
