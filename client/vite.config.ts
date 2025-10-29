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
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        // Use non-module format for better compatibility
        format: 'iife',
        // Ensure assets are properly referenced
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Disable code-splitting for better compatibility
        manualChunks: undefined
      }
    }
  },
  base: "/", // Ensure assets are loaded from the root
  define: {
    global: "globalThis",
    "process.env.PUBLIC_URL": JSON.stringify(""),
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
});
