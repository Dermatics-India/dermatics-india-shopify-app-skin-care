import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      "~": resolve(dirname(fileURLToPath(import.meta.url)), "./"),
    },
  },

  server: {
    host: "0.0.0.0",                      // Allow Shopify Admin iframe + Cloudflare tunnel
    port: Number(process.env.FRONTEND_PORT),
    strictPort: true,

    // ⭐ FIXED: allow ALL hosts (including all random Cloudflare tunnels)
    allowedHosts: true,

    hmr: {
      protocol: "ws",
      host: "localhost",
      port: Number(process.env.FRONTEND_PORT),
    },

    proxy: {
      "^/api(/|(\\?.*)?$)": {
        target: `http://localhost:${process.env.BACKEND_PORT}`,
        changeOrigin: false,
        secure: false,
      },
    },
  },
});
