import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { stripHtmlCommentsPlugin } from "./scripts/strip-html-comments.mjs";
import { routeModulePreloadPlugin } from "./scripts/route-modulepreload.mjs";
import { envConfigOrderPlugin } from "./scripts/env-config-order.mjs";

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
        // Rolldown gruplaması (`manualChunks` yerine). Bir grup eşleşen modülün
        // BAĞIMLILIKLARINI da yakalar (`includeDependenciesRecursively` varsayılanı true);
        // bu yüzden öncelik sırası anlam taşır.
        // ⚠️ Lighthouse 2026-10-13: eski `manualChunks` ile React çekirdeği `vendor-icons`'a,
        // `react/jsx-runtime` ise `vendor-motion`'a sürüklenmişti — ana sayfa hiç kullanmadığı
        // framer-motion'ı (46 KB) yalnız jsx-runtime için indiriyordu. `vendor-react` en yüksek
        // öncelikte olmalı ki React'i başka bir grup yutmasın.
        codeSplitting: {
          groups: [
            { name: "vendor-react", priority: 100, test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: "vendor-supabase", priority: 90, test: /[\\/]node_modules[\\/]@supabase[\\/]/ },
            { name: "vendor-query", priority: 90, test: /[\\/]node_modules[\\/]@tanstack[\\/]/ },
            { name: "vendor-icons", priority: 80, test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: "vendor-motion", priority: 80, test: /[\\/]node_modules[\\/]framer-motion[\\/]/ },
            { name: "vendor-date", priority: 80, test: /[\\/]node_modules[\\/]date-fns[\\/]/ },
            // ⚠️ `@radix-ui/*` bilerek GRUPLANMAZ. Lighthouse 2026-10-13: tek `vendor-radix`
            // grubu ~30 primitive'i 92 KB'lık tek parçada her sayfaya indiriyordu (bootup 1,16 sn).
            // ⚠️ Yalnız TEMBEL sayfaların kullandığı kütüphaneler (recharts/d3, react-markdown,
            // react-hook-form/zod, qrcode, takvim seçicileri) de GRUPLANMAZ. Lighthouse 2026-10-12:
            // `vendor-charts` grubu React çekirdeğini içine almıştı ve grafik/markdown/form/qrcode
            // HER sayfanın başlangıcında yükleniyordu. Grupsuz kalınca Rolldown onları kullanan
            // lazy sayfalarla birlikte böler.

            // Uzantısız önek bilinçli: hem barrel (social-diaspora-posts.ts,
            // social-test-tools.ts, burak-share-tools.ts) hem de parça dosyalar
            // (social-diaspora-posts/posts-XX-YY.ts, social-test-tools/tools-XX-YY.ts,
            // burak-share-tools/tool-XX.ts) aynı chunk'a girsin.
            { name: "social-vault-diaspora", priority: 10, test: /[\\/]src[\\/]lib[\\/]admin-shell[\\/]social-diaspora-posts/ },
            { name: "social-vault-tests", priority: 10, test: /[\\/]src[\\/]lib[\\/]admin-shell[\\/]social-test-tools/ },
            { name: "social-vault-burak", priority: 10, test: /[\\/]src[\\/]lib[\\/]admin-shell[\\/]burak-share-tools/ },
            { name: "social-vault-tools", priority: 10, test: /[\\/]src[\\/]lib[\\/]admin-shell[\\/]social-share-vault\.ts/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    commercialLegacyHtmlRedirects,
    // index.html geliştirici yorumları dist/ çıktısına sızmasın (GEO 2026-10-11).
    stripHtmlCommentsPlugin(),
    // `/` tembel parçasını main ile PARALEL indir (Lighthouse 2026-10-13, ikinci dalga).
    routeModulePreloadPlugin({ moduleSuffix: "src/pages/LandingTrialPage.tsx" }),
    // env-config.js modüllerden ÖNCE çalışmazsa supabase boş config ile kurulur → build düşer.
    envConfigOrderPlugin(),
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
