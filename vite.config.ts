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
