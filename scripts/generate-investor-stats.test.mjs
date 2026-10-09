import { describe, expect, it } from "vitest";

import { collectInvestorStats, renderStatsModule } from "./generate-investor-stats.mjs";

describe("generate-investor-stats", () => {
  const stats = collectInvestorStats();

  it("tüm sayaçlar pozitif tam sayıdır", () => {
    for (const key of [
      "sourceFiles",
      "productionLines",
      "testFiles",
      "e2eSpecs",
      "pages",
      "components",
      "lazyRoutes",
      "edgeFunctions",
      "migrations",
    ]) {
      expect(Number.isInteger(stats[key]), key).toBe(true);
      expect(stats[key], key).toBeGreaterThan(0);
    }
  });

  it("referanslovable klonunu saymaz (git ls-files kullanır)", () => {
    // Çıplak find 28.09'da Playwright spec'lerini 44 saydı; gerçek sayı çok daha küçük.
    expect(stats.e2eSpecs).toBeLessThan(40);
  });

  it("sürümler önek (^/~) taşımaz", () => {
    expect(stats.versions.react).toMatch(/^\d/);
    expect(Object.values(stats.versions).every((v) => /^\d/.test(v))).toBe(true);
  });

  it("üretilen modül ölçüm tarihini ve sabiti içerir", () => {
    const text = renderStatsModule(stats, "2026-10-09");
    expect(text).toContain("export const INVESTOR_REPO_STATS");
    expect(text).toContain('"measuredAt": "2026-10-09"');
  });
});
