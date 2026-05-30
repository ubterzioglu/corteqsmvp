import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const standaloneDocuments = [
  {
    slug: "contributor",
    sourcePath: path.resolve(__dirname, "./info-contributor.html"),
  },
  {
    slug: "influencer-partner",
    sourcePath: path.resolve(__dirname, "./info-influencer-partner.html"),
  },
  {
    slug: "strategic-partner",
    sourcePath: path.resolve(__dirname, "./info-strategic-partner.html"),
  },
  {
    slug: "community-leader",
    sourcePath: path.resolve(__dirname, "./info-community-leader.html"),
  },
  {
    slug: "ambassador",
    sourcePath: path.resolve(__dirname, "./info-ambassador.html"),
  },
];

const getDocumentRoutes = (slug: string) => {
  const commercialRoute = `/commercial/${slug}`;
  const aliasRoute = `/${slug}`;

  return [
    commercialRoute,
    `${commercialRoute}/`,
    `${commercialRoute}.html`,
    aliasRoute,
    `${aliasRoute}/`,
    `${aliasRoute}.html`,
  ];
};

const standaloneRouteMap = new Map(
  standaloneDocuments.flatMap((document) =>
    getDocumentRoutes(document.slug).map((route) => [route, document.sourcePath] as const),
  ),
);

const readStandaloneDocument = (sourcePath: string) =>
  fs.readFileSync(sourcePath, "utf-8");

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
      name: "standalone-commercial-documents",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const requestPath = req.url?.split("?")[0];

          const sourcePath = requestPath ? standaloneRouteMap.get(requestPath) : undefined;

          if (sourcePath) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(readStandaloneDocument(sourcePath));
            return;
          }

          next();
        });
      },
      generateBundle() {
        for (const document of standaloneDocuments) {
          const source = readStandaloneDocument(document.sourcePath);

          this.emitFile({
            type: "asset",
            fileName: `commercial/${document.slug}/index.html`,
            source,
          });

          this.emitFile({
            type: "asset",
            fileName: `commercial/${document.slug}.html`,
            source,
          });

          this.emitFile({
            type: "asset",
            fileName: `${document.slug}/index.html`,
            source,
          });

          this.emitFile({
            type: "asset",
            fileName: `${document.slug}.html`,
            source,
          });
        }
      },
      closeBundle() {
        const outDir = path.resolve(__dirname, "dist");
        const rootIndexPath = path.join(outDir, "index.html");

        if (!fs.existsSync(rootIndexPath)) {
          return;
        }

        const commercialDir = path.join(outDir, "commercial");
        fs.mkdirSync(commercialDir, { recursive: true });
        fs.copyFileSync(rootIndexPath, path.join(commercialDir, "index.html"));
        fs.copyFileSync(rootIndexPath, path.join(outDir, "commercial.html"));
      },
    },
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
