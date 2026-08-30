import { describe, expect, it } from "vitest";

import { extractHtmlAssets, extractMuhasebeChunks } from "./verify-release.mjs";

describe("release verification asset discovery", () => {
  it("selects the main module after vendor entrypoints", () => {
    const html = `
      <script type="module" crossorigin src="/assets/vendor-react-abc123.js"></script>
      <script type="module" crossorigin src="/assets/vendor-query-def456.js"></script>
      <script type="module" crossorigin src="/assets/main-release789.js"></script>
      <link rel="stylesheet" crossorigin href="/assets/main-style123.css">
    `;

    expect(extractHtmlAssets(html)).toEqual({
      mainScript: "/assets/main-release789.js",
      mainStyle: "/assets/main-style123.css",
    });
  });

  it("discovers accounting chunks from the Vite dependency map", () => {
    const source = `
      m.f = [
        "assets/MuhasebeLayout-layout1.js",
        "assets/MuhasebeDashboard-dashboard2.js",
        "assets/GiderlerPage-expense3.js",
        "assets/GelirlerPage-income4.js",
        "assets/NakitAkisiPage-cashflow5.js"
      ];
    `;

    expect(extractMuhasebeChunks(source)).toEqual([
      "/assets/MuhasebeLayout-layout1.js",
      "/assets/MuhasebeDashboard-dashboard2.js",
      "/assets/GiderlerPage-expense3.js",
      "/assets/GelirlerPage-income4.js",
      "/assets/NakitAkisiPage-cashflow5.js",
    ]);
  });
});
