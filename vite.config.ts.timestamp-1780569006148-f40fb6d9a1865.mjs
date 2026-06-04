// vite.config.ts
import fs from "node:fs";
import { defineConfig } from "file:///C:/temp_private/corteqs/corteqs_fin/node_modules/vite/dist/node/index.js";
import react from "file:///C:/temp_private/corteqs/corteqs_fin/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/temp_private/corteqs/corteqs_fin/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\temp_private\\corteqs\\corteqs_fin";
var standaloneDocuments = [
  {
    slug: "contributor",
    sourcePath: path.resolve(__vite_injected_original_dirname, "./info-contributor.html")
  },
  {
    slug: "influencer-partner",
    sourcePath: path.resolve(__vite_injected_original_dirname, "./info-influencer-partner.html")
  },
  {
    slug: "strategic-partner",
    sourcePath: path.resolve(__vite_injected_original_dirname, "./info-strategic-partner.html")
  },
  {
    slug: "community-leader",
    sourcePath: path.resolve(__vite_injected_original_dirname, "./info-community-leader.html")
  },
  {
    slug: "ambassador",
    sourcePath: path.resolve(__vite_injected_original_dirname, "./info-ambassador.html")
  }
];
var getDocumentRoutes = (slug) => {
  const commercialRoute = `/commercial/${slug}`;
  const aliasRoute = `/${slug}`;
  return [
    commercialRoute,
    `${commercialRoute}/`,
    `${commercialRoute}.html`,
    aliasRoute,
    `${aliasRoute}/`,
    `${aliasRoute}.html`
  ];
};
var standaloneRouteMap = new Map(
  standaloneDocuments.flatMap(
    (document) => getDocumentRoutes(document.slug).map((route) => [route, document.sourcePath])
  )
);
var readStandaloneDocument = (sourcePath) => fs.readFileSync(sourcePath, "utf-8");
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    },
    proxy: {
      "/api/chat": {
        target: "https://rag.corteqs.net",
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html"),
        lansman: path.resolve(__vite_injected_original_dirname, "lansman/index.html")
      }
    }
  },
  plugins: [
    react(),
    {
      name: "standalone-commercial-documents",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const requestPath = req.url?.split("?")[0];
          const sourcePath = requestPath ? standaloneRouteMap.get(requestPath) : void 0;
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
            source
          });
          this.emitFile({
            type: "asset",
            fileName: `commercial/${document.slug}.html`,
            source
          });
          this.emitFile({
            type: "asset",
            fileName: `${document.slug}/index.html`,
            source
          });
          this.emitFile({
            type: "asset",
            fileName: `${document.slug}.html`,
            source
          });
        }
      },
      closeBundle() {
        const outDir = path.resolve(__vite_injected_original_dirname, "dist");
        const rootIndexPath = path.join(outDir, "index.html");
        if (!fs.existsSync(rootIndexPath)) {
          return;
        }
        const commercialDir = path.join(outDir, "commercial");
        fs.mkdirSync(commercialDir, { recursive: true });
        fs.copyFileSync(rootIndexPath, path.join(commercialDir, "index.html"));
        fs.copyFileSync(rootIndexPath, path.join(outDir, "commercial.html"));
      }
    },
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx0ZW1wX3ByaXZhdGVcXFxcY29ydGVxc1xcXFxjb3J0ZXFzX2ZpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcdGVtcF9wcml2YXRlXFxcXGNvcnRlcXNcXFxcY29ydGVxc19maW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3RlbXBfcHJpdmF0ZS9jb3J0ZXFzL2NvcnRlcXNfZmluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IGZzIGZyb20gXCJub2RlOmZzXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IGNvbXBvbmVudFRhZ2dlciB9IGZyb20gXCJsb3ZhYmxlLXRhZ2dlclwiO1xyXG5cclxuY29uc3Qgc3RhbmRhbG9uZURvY3VtZW50cyA9IFtcclxuICB7XHJcbiAgICBzbHVnOiBcImNvbnRyaWJ1dG9yXCIsXHJcbiAgICBzb3VyY2VQYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vaW5mby1jb250cmlidXRvci5odG1sXCIpLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgc2x1ZzogXCJpbmZsdWVuY2VyLXBhcnRuZXJcIixcclxuICAgIHNvdXJjZVBhdGg6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9pbmZvLWluZmx1ZW5jZXItcGFydG5lci5odG1sXCIpLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgc2x1ZzogXCJzdHJhdGVnaWMtcGFydG5lclwiLFxyXG4gICAgc291cmNlUGF0aDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2luZm8tc3RyYXRlZ2ljLXBhcnRuZXIuaHRtbFwiKSxcclxuICB9LFxyXG4gIHtcclxuICAgIHNsdWc6IFwiY29tbXVuaXR5LWxlYWRlclwiLFxyXG4gICAgc291cmNlUGF0aDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL2luZm8tY29tbXVuaXR5LWxlYWRlci5odG1sXCIpLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgc2x1ZzogXCJhbWJhc3NhZG9yXCIsXHJcbiAgICBzb3VyY2VQYXRoOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vaW5mby1hbWJhc3NhZG9yLmh0bWxcIiksXHJcbiAgfSxcclxuXTtcclxuXHJcbmNvbnN0IGdldERvY3VtZW50Um91dGVzID0gKHNsdWc6IHN0cmluZykgPT4ge1xyXG4gIGNvbnN0IGNvbW1lcmNpYWxSb3V0ZSA9IGAvY29tbWVyY2lhbC8ke3NsdWd9YDtcclxuICBjb25zdCBhbGlhc1JvdXRlID0gYC8ke3NsdWd9YDtcclxuXHJcbiAgcmV0dXJuIFtcclxuICAgIGNvbW1lcmNpYWxSb3V0ZSxcclxuICAgIGAke2NvbW1lcmNpYWxSb3V0ZX0vYCxcclxuICAgIGAke2NvbW1lcmNpYWxSb3V0ZX0uaHRtbGAsXHJcbiAgICBhbGlhc1JvdXRlLFxyXG4gICAgYCR7YWxpYXNSb3V0ZX0vYCxcclxuICAgIGAke2FsaWFzUm91dGV9Lmh0bWxgLFxyXG4gIF07XHJcbn07XHJcblxyXG5jb25zdCBzdGFuZGFsb25lUm91dGVNYXAgPSBuZXcgTWFwKFxyXG4gIHN0YW5kYWxvbmVEb2N1bWVudHMuZmxhdE1hcCgoZG9jdW1lbnQpID0+XHJcbiAgICBnZXREb2N1bWVudFJvdXRlcyhkb2N1bWVudC5zbHVnKS5tYXAoKHJvdXRlKSA9PiBbcm91dGUsIGRvY3VtZW50LnNvdXJjZVBhdGhdIGFzIGNvbnN0KSxcclxuICApLFxyXG4pO1xyXG5cclxuY29uc3QgcmVhZFN0YW5kYWxvbmVEb2N1bWVudCA9IChzb3VyY2VQYXRoOiBzdHJpbmcpID0+XHJcbiAgZnMucmVhZEZpbGVTeW5jKHNvdXJjZVBhdGgsIFwidXRmLThcIik7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICBcIi9hcGkvY2hhdFwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vcmFnLmNvcnRlcXMubmV0XCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGlucHV0OiB7XHJcbiAgICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJpbmRleC5odG1sXCIpLFxyXG4gICAgICAgIGxhbnNtYW46IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwibGFuc21hbi9pbmRleC5odG1sXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwic3RhbmRhbG9uZS1jb21tZXJjaWFsLWRvY3VtZW50c1wiLFxyXG4gICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHJlcXVlc3RQYXRoID0gcmVxLnVybD8uc3BsaXQoXCI/XCIpWzBdO1xyXG5cclxuICAgICAgICAgIGNvbnN0IHNvdXJjZVBhdGggPSByZXF1ZXN0UGF0aCA/IHN0YW5kYWxvbmVSb3V0ZU1hcC5nZXQocmVxdWVzdFBhdGgpIDogdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgIGlmIChzb3VyY2VQYXRoKSB7XHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcIik7XHJcbiAgICAgICAgICAgIHJlcy5lbmQocmVhZFN0YW5kYWxvbmVEb2N1bWVudChzb3VyY2VQYXRoKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGdlbmVyYXRlQnVuZGxlKCkge1xyXG4gICAgICAgIGZvciAoY29uc3QgZG9jdW1lbnQgb2Ygc3RhbmRhbG9uZURvY3VtZW50cykge1xyXG4gICAgICAgICAgY29uc3Qgc291cmNlID0gcmVhZFN0YW5kYWxvbmVEb2N1bWVudChkb2N1bWVudC5zb3VyY2VQYXRoKTtcclxuXHJcbiAgICAgICAgICB0aGlzLmVtaXRGaWxlKHtcclxuICAgICAgICAgICAgdHlwZTogXCJhc3NldFwiLFxyXG4gICAgICAgICAgICBmaWxlTmFtZTogYGNvbW1lcmNpYWwvJHtkb2N1bWVudC5zbHVnfS9pbmRleC5odG1sYCxcclxuICAgICAgICAgICAgc291cmNlLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdGhpcy5lbWl0RmlsZSh7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiYXNzZXRcIixcclxuICAgICAgICAgICAgZmlsZU5hbWU6IGBjb21tZXJjaWFsLyR7ZG9jdW1lbnQuc2x1Z30uaHRtbGAsXHJcbiAgICAgICAgICAgIHNvdXJjZSxcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHRoaXMuZW1pdEZpbGUoe1xyXG4gICAgICAgICAgICB0eXBlOiBcImFzc2V0XCIsXHJcbiAgICAgICAgICAgIGZpbGVOYW1lOiBgJHtkb2N1bWVudC5zbHVnfS9pbmRleC5odG1sYCxcclxuICAgICAgICAgICAgc291cmNlLFxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdGhpcy5lbWl0RmlsZSh7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiYXNzZXRcIixcclxuICAgICAgICAgICAgZmlsZU5hbWU6IGAke2RvY3VtZW50LnNsdWd9Lmh0bWxgLFxyXG4gICAgICAgICAgICBzb3VyY2UsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIGNsb3NlQnVuZGxlKCkge1xyXG4gICAgICAgIGNvbnN0IG91dERpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiZGlzdFwiKTtcclxuICAgICAgICBjb25zdCByb290SW5kZXhQYXRoID0gcGF0aC5qb2luKG91dERpciwgXCJpbmRleC5odG1sXCIpO1xyXG5cclxuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMocm9vdEluZGV4UGF0aCkpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbW1lcmNpYWxEaXIgPSBwYXRoLmpvaW4ob3V0RGlyLCBcImNvbW1lcmNpYWxcIik7XHJcbiAgICAgICAgZnMubWtkaXJTeW5jKGNvbW1lcmNpYWxEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgICAgIGZzLmNvcHlGaWxlU3luYyhyb290SW5kZXhQYXRoLCBwYXRoLmpvaW4oY29tbWVyY2lhbERpciwgXCJpbmRleC5odG1sXCIpKTtcclxuICAgICAgICBmcy5jb3B5RmlsZVN5bmMocm9vdEluZGV4UGF0aCwgcGF0aC5qb2luKG91dERpciwgXCJjb21tZXJjaWFsLmh0bWxcIikpO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3QvanN4LXJ1bnRpbWVcIiwgXCJyZWFjdC9qc3gtZGV2LXJ1bnRpbWVcIiwgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIiwgXCJAdGFuc3RhY2svcXVlcnktY29yZVwiXSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVMsT0FBTyxRQUFRO0FBQ2xULFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFKaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTSxzQkFBc0I7QUFBQSxFQUMxQjtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sWUFBWSxLQUFLLFFBQVEsa0NBQVcseUJBQXlCO0FBQUEsRUFDL0Q7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixZQUFZLEtBQUssUUFBUSxrQ0FBVyxnQ0FBZ0M7QUFBQSxFQUN0RTtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLFlBQVksS0FBSyxRQUFRLGtDQUFXLCtCQUErQjtBQUFBLEVBQ3JFO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sWUFBWSxLQUFLLFFBQVEsa0NBQVcsOEJBQThCO0FBQUEsRUFDcEU7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixZQUFZLEtBQUssUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxFQUM5RDtBQUNGO0FBRUEsSUFBTSxvQkFBb0IsQ0FBQyxTQUFpQjtBQUMxQyxRQUFNLGtCQUFrQixlQUFlLElBQUk7QUFDM0MsUUFBTSxhQUFhLElBQUksSUFBSTtBQUUzQixTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0EsR0FBRyxlQUFlO0FBQUEsSUFDbEIsR0FBRyxlQUFlO0FBQUEsSUFDbEI7QUFBQSxJQUNBLEdBQUcsVUFBVTtBQUFBLElBQ2IsR0FBRyxVQUFVO0FBQUEsRUFDZjtBQUNGO0FBRUEsSUFBTSxxQkFBcUIsSUFBSTtBQUFBLEVBQzdCLG9CQUFvQjtBQUFBLElBQVEsQ0FBQyxhQUMzQixrQkFBa0IsU0FBUyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLFNBQVMsVUFBVSxDQUFVO0FBQUEsRUFDdkY7QUFDRjtBQUVBLElBQU0seUJBQXlCLENBQUMsZUFDOUIsR0FBRyxhQUFhLFlBQVksT0FBTztBQUVyQyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxhQUFhO0FBQUEsUUFDWCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLFFBQzFDLFNBQVMsS0FBSyxRQUFRLGtDQUFXLG9CQUFvQjtBQUFBLE1BQ3ZEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixnQkFBZ0IsUUFBUTtBQUN0QixlQUFPLFlBQVksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO0FBQ3pDLGdCQUFNLGNBQWMsSUFBSSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFFekMsZ0JBQU0sYUFBYSxjQUFjLG1CQUFtQixJQUFJLFdBQVcsSUFBSTtBQUV2RSxjQUFJLFlBQVk7QUFDZCxnQkFBSSxVQUFVLGdCQUFnQiwwQkFBMEI7QUFDeEQsZ0JBQUksSUFBSSx1QkFBdUIsVUFBVSxDQUFDO0FBQzFDO0FBQUEsVUFDRjtBQUVBLGVBQUs7QUFBQSxRQUNQLENBQUM7QUFBQSxNQUNIO0FBQUEsTUFDQSxpQkFBaUI7QUFDZixtQkFBVyxZQUFZLHFCQUFxQjtBQUMxQyxnQkFBTSxTQUFTLHVCQUF1QixTQUFTLFVBQVU7QUFFekQsZUFBSyxTQUFTO0FBQUEsWUFDWixNQUFNO0FBQUEsWUFDTixVQUFVLGNBQWMsU0FBUyxJQUFJO0FBQUEsWUFDckM7QUFBQSxVQUNGLENBQUM7QUFFRCxlQUFLLFNBQVM7QUFBQSxZQUNaLE1BQU07QUFBQSxZQUNOLFVBQVUsY0FBYyxTQUFTLElBQUk7QUFBQSxZQUNyQztBQUFBLFVBQ0YsQ0FBQztBQUVELGVBQUssU0FBUztBQUFBLFlBQ1osTUFBTTtBQUFBLFlBQ04sVUFBVSxHQUFHLFNBQVMsSUFBSTtBQUFBLFlBQzFCO0FBQUEsVUFDRixDQUFDO0FBRUQsZUFBSyxTQUFTO0FBQUEsWUFDWixNQUFNO0FBQUEsWUFDTixVQUFVLEdBQUcsU0FBUyxJQUFJO0FBQUEsWUFDMUI7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLE1BQ0EsY0FBYztBQUNaLGNBQU0sU0FBUyxLQUFLLFFBQVEsa0NBQVcsTUFBTTtBQUM3QyxjQUFNLGdCQUFnQixLQUFLLEtBQUssUUFBUSxZQUFZO0FBRXBELFlBQUksQ0FBQyxHQUFHLFdBQVcsYUFBYSxHQUFHO0FBQ2pDO0FBQUEsUUFDRjtBQUVBLGNBQU0sZ0JBQWdCLEtBQUssS0FBSyxRQUFRLFlBQVk7QUFDcEQsV0FBRyxVQUFVLGVBQWUsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUMvQyxXQUFHLGFBQWEsZUFBZSxLQUFLLEtBQUssZUFBZSxZQUFZLENBQUM7QUFDckUsV0FBRyxhQUFhLGVBQWUsS0FBSyxLQUFLLFFBQVEsaUJBQWlCLENBQUM7QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVMsaUJBQWlCLGdCQUFnQjtBQUFBLEVBQzVDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsSUFDQSxRQUFRLENBQUMsU0FBUyxhQUFhLHFCQUFxQix5QkFBeUIseUJBQXlCLHNCQUFzQjtBQUFBLEVBQzlIO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
