import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { stripHtmlCommentsPlugin } from "./scripts/strip-html-comments.mjs";

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

const commercialLegacyHtmlRedirects: Plugin = {
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
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: Number(process.env.PORT ?? 8099),
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        lansman: path.resolve(import.meta.dirname, "lansman/index.html"),
      },
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          // Uzantısız önek bilinçli: hem barrel (social-diaspora-posts.ts,
          // social-test-tools.ts, burak-share-tools.ts) hem de parça dosyalar
          // (social-diaspora-posts/posts-XX-YY.ts, social-test-tools/tools-XX-YY.ts,
          // burak-share-tools/tool-XX.ts) aynı chunk'a girsin.
          if (normalizedId.includes("/src/lib/admin-shell/social-diaspora-posts")) return "social-vault-diaspora";
          if (normalizedId.includes("/src/lib/admin-shell/social-test-tools")) return "social-vault-tests";
          if (normalizedId.includes("/src/lib/admin-shell/burak-share-tools")) return "social-vault-burak";
          if (normalizedId.includes("/src/lib/admin-shell/social-share-vault.ts")) return "social-vault-tools";

          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (/\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(normalizedId)) return "vendor-react";
          if (normalizedId.includes("/@supabase/")) return "vendor-supabase";
          if (normalizedId.includes("/@radix-ui/")) return "vendor-radix";
          if (normalizedId.includes("/lucide-react/")) return "vendor-icons";
          if (normalizedId.includes("/framer-motion/")) return "vendor-motion";
          if (normalizedId.includes("/date-fns/")) return "vendor-date";
          if (normalizedId.includes("/@tanstack/")) return "vendor-query";
          // ⚠️ Yalnız TEMBEL sayfaların kullandığı kütüphaneler (recharts/d3, react-markdown,
          // react-hook-form/zod, qrcode, takvim seçicileri) burada ADLANDIRILMAZ.
          // Lighthouse 2026-10-12: `vendor-charts` grubu React çekirdeğini de içine almıştı
          // (recharts → react bağımlılığı) ve bu yüzden grafik/markdown/form/qrcode parçaları
          // HER sayfanın başlangıcında yükleniyordu (~300 KB kullanılmayan JS). Adsız
          // bırakılınca Rolldown onları kullanan lazy sayfalarla birlikte böler.
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    commercialLegacyHtmlRedirects,
    // index.html geliştirici yorumları dist/ çıktısına sızmasın (GEO 2026-10-11).
    stripHtmlCommentsPlugin(),
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
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
