import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { homeMeta, wetMeta } from "./src/ogMeta";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawPort = process.env.PORT ?? "5173";
const port = Number(rawPort);

const basePath = process.env.BASE_PATH ?? "/";
const outDir = path.resolve(__dirname, "dist/public");

function applyOgMeta(html: string, meta: typeof homeMeta): string {
  return html
    .replaceAll("%OG_TITLE%", meta.title)
    .replaceAll("%OG_DESCRIPTION%", meta.description)
    .replaceAll("%OG_IMAGE%", meta.image)
    .replaceAll("%OG_URL%", meta.url);
}

function ogMetaPlugin(): Plugin {
  return {
    name: "og-meta-prerender",
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html;
      const meta = ctx.originalUrl?.startsWith("/wet") ? wetMeta : homeMeta;
      return applyOgMeta(html, meta);
    },
    closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, "utf-8");

      fs.writeFileSync(indexPath, applyOgMeta(template, homeMeta), "utf-8");

      const wetDir = path.join(outDir, "wet");
      fs.mkdirSync(wetDir, { recursive: true });
      fs.writeFileSync(path.join(wetDir, "index.html"), applyOgMeta(template, wetMeta), "utf-8");
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ogMetaPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer({
            root: path.resolve(__dirname, ".."),
          }),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom", "framer-motion"],
  },
  root: __dirname,
  build: {
    outDir,
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
