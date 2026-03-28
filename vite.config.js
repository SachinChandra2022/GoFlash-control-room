import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy for local dev to avoid CORS issues entirely
    proxy: {
      "/stream": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8081",
        changeOrigin: true,
        // SSE requires disabling the proxy timeout
        configure: (proxy) => {
          proxy.on("error", (err) => console.log("Proxy error:", err));
        },
      },
      "/purchase-async": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8081",
        changeOrigin: true,
      },
      "/reset": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("react-dom") || id.includes("react/")) return "vendor";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("lucide-react")) return "icons";
        },
      },
    },
  },
});