import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const caddeSurfaceFiles = [
  "src/pages/cadde/CaddePage.tsx",
  "src/pages/cadde/CaddeCafePage.tsx",
  "src/pages/cadde/CaddeCarsiPage.tsx",
  "src/pages/cadde/CaddeCarsiItemPage.tsx",
  "src/components/cadde/CaddeFeaturedSpotlight.tsx",
  "src/components/cadde/CarsiGlobalTicker.tsx",
  "src/components/cadde/SponsoredFeedCard.tsx",
];

describe("cadde visual style contract", () => {
  it("keeps Cadde surface gradients and color literals centralized in CSS utilities", () => {
    const offenders = caddeSurfaceFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const hits = [
        ...source.matchAll(/bg-\[linear-gradient[^\]]*\]/g),
        ...source.matchAll(/\b(?:bg|text|border)-\[#(?:[0-9a-fA-F]{3,8})\]/g),
        ...source.matchAll(/shadow-\[[^\]]*(?:rgba|#)[^\]]*\]/g),
      ];
      return hits.map((hit) => `${file}: ${hit[0]}`);
    });

    expect(offenders).toEqual([]);
  });

  it("uses the shared Cadde shell background on every Cadde page", () => {
    for (const file of caddeSurfaceFiles.slice(0, 4)) {
      expect(readFileSync(file, "utf8")).toContain("cadde-shell");
    }
  });
});
