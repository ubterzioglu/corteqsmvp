import { describe, expect, it } from "vitest";

import { findRouteChunkFiles, routeModulePreloadPlugin } from "./route-modulepreload.mjs";

const bundle = {
  "assets/main-a.js": { type: "chunk", fileName: "assets/main-a.js", facadeModuleId: "C:\\repo\\index.html", imports: [] },
  "assets/LandingTrialPage-b.js": {
    type: "chunk",
    fileName: "assets/LandingTrialPage-b.js",
    facadeModuleId: "C:\\repo\\src\\pages\\LandingTrialPage.tsx",
    imports: ["assets/vendor-react-c.js", "assets/geo-d.js", "assets/geo-d.js"],
  },
  "assets/geo-d.js": {
    type: "chunk",
    fileName: "assets/geo-d.js",
    imports: ["assets/geoCountries-e.js", "assets/vendor-react-c.js"],
    dynamicImports: ["assets/admin-f.js"],
  },
  "assets/geoCountries-e.js": { type: "chunk", fileName: "assets/geoCountries-e.js", imports: [] },
  "assets/vendor-react-c.js": { type: "chunk", fileName: "assets/vendor-react-c.js", imports: [] },
  "assets/main.css": { type: "asset", fileName: "assets/main.css" },
};

const MODULE = "src/pages/LandingTrialPage.tsx";
const handler = (html, ctx) => routeModulePreloadPlugin({ moduleSuffix: MODULE }).transformIndexHtml.handler(html, ctx);

describe("findRouteChunkFiles", () => {
  it("Windows yollu facadeModuleId ile parçayı ve statik import'larını ÖZYİNELEMELİ, tekrarsız bulur", () => {
    expect(findRouteChunkFiles(bundle, MODULE)).toEqual([
      "assets/LandingTrialPage-b.js",
      "assets/vendor-react-c.js",
      "assets/geo-d.js",
      "assets/geoCountries-e.js",
    ]);
  });

  it("dinamik import'ları önceden yüklemez", () => {
    expect(findRouteChunkFiles(bundle, MODULE)).not.toContain("assets/admin-f.js");
  });

  it("parça yoksa boş döner", () => {
    expect(findRouteChunkFiles(bundle, "src/pages/Yok.tsx")).toEqual([]);
  });
});

describe("routeModulePreloadPlugin", () => {
  it("index.html'e yalnız zaten yüklenmeyen parçalar için modulepreload ekler", () => {
    const html = '<script type="module" crossorigin src="/assets/vendor-react-c.js"></script>';
    const tags = handler(html, { path: "/index.html", bundle });

    expect(tags.map((tag) => tag.attrs.href)).toEqual([
      "/assets/LandingTrialPage-b.js",
      "/assets/geo-d.js",
      "/assets/geoCountries-e.js",
    ]);
    expect(tags.every((tag) => tag.attrs.rel === "modulepreload" && tag.injectTo === "head")).toBe(true);
  });

  it("lansman/index.html gibi başka girişlere dokunmaz", () => {
    expect(handler("<html></html>", { path: "/lansman/index.html", bundle })).toBe("<html></html>");
  });

  it("dev sunucusunda (bundle yok) dokunmaz", () => {
    expect(handler("<html></html>", { path: "/index.html" })).toBe("<html></html>");
  });

  it("parça bulunamazsa build'i sessizce geçirmez", () => {
    expect(() => handler("<html></html>", { path: "/index.html", bundle: {} })).toThrow(/bulunamadı/);
  });
});
