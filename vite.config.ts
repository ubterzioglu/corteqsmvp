import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// Commercial documents are rendered by the SPA at /commercial/<slug>
// (CommercialDocumentPage + src/content/commercial/*.html fragments).
// Only legacy *.html URLs still get static redirect stubs for old links.
const commercialDocumentSlugs = [
  "contributor",
  "influencer-partner",
  "strategic-partner",
  "community-leader",
  "ambassador",
];

const createRedirectStub = (target: string) =>
  [
    "<!doctype html>",
    `<html lang="tr"><head><meta charset="utf-8" />`,
    `<meta http-equiv="refresh" content="0;url=${target}" />`,
    `<link rel="canonical" href="https://corteqs.net${target}" />`,
    `<title>CorteQS</title></head>`,
    `<body><a href="${target}">${target}</a></body></html>`,
  ].join("");

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/chat": {
        target: "https://rag.corteqs.net",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        lansman: path.resolve(__dirname, "lansman/index.html"),
      },
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/src/lib/admin-shell/social-diaspora-posts.ts")) return "social-vault-diaspora";
          if (normalizedId.includes("/src/lib/admin-shell/social-test-tools.ts")) return "social-vault-tests";
          if (normalizedId.includes("/src/lib/admin-shell/burak-share-tools.ts")) return "social-vault-burak";
          if (normalizedId.includes("/src/lib/admin-shell/social-share-vault.ts")) return "social-vault-tools";

          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (/\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalizedId)) return "vendor-react";
          if (normalizedId.includes("/@supabase/")) return "vendor-supabase";
          if (normalizedId.includes("/@radix-ui/")) return "vendor-radix";
          if (normalizedId.includes("/lucide-react/")) return "vendor-icons";
          if (normalizedId.includes("/framer-motion/")) return "vendor-motion";
          if (normalizedId.includes("/recharts/") || normalizedId.includes("/d3-")) return "vendor-charts";
          if (normalizedId.includes("/date-fns/")) return "vendor-date";
          if (normalizedId.includes("/@tanstack/")) return "vendor-query";
          if (normalizedId.includes("/zod/") || normalizedId.includes("/react-hook-form/") || normalizedId.includes("/@hookform/")) return "vendor-forms";
          if (/\/(react-markdown|remark-|rehype-|unified|micromark|mdast-|hast-|property-information|vfile)\//.test(normalizedId)) return "vendor-markdown";
          if (normalizedId.includes("/react-day-picker/") || normalizedId.includes("/frimousse/")) return "vendor-pickers";
          if (normalizedId.includes("/qrcode/")) return "vendor-qrcode";
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    {
      name: "commercial-legacy-html-redirects",
      generateBundle() {
        for (const slug of commercialDocumentSlugs) {
          const stub = createRedirectStub(`/commercial/${slug}`);

          this.emitFile({
            type: "asset",
            fileName: `commercial/${slug}.html`,
            source: stub,
          });

          this.emitFile({
            type: "asset",
            fileName: `${slug}.html`,
            source: stub,
          });
        }

        this.emitFile({
          type: "asset",
          fileName: "commercial.html",
          source: createRedirectStub("/commercial"),
        });

        this.emitFile({
          type: "asset",
          fileName: "commercial/index.html",
          source: createRedirectStub("/commercial"),
        });
      },
    },
    mode === "development" && componentTagger(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: false, quality: 80 },
      includePublic: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
