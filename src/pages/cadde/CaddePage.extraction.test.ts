import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("CaddePage extraction boundaries", () => {
  it("C14.1 keeps remote data loading in the Cadde page data hook", () => {
    const hookPath = "src/hooks/cadde/useCaddePageData.ts";

    expect(existsSync(hookPath)).toBe(true);

    const pageSource = read("src/pages/cadde/CaddePage.tsx");
    const hookSource = read(hookPath);

    expect(pageSource).toContain('from "@/hooks/cadde/useCaddePageData"');
    expect(pageSource).toContain("useCaddePageData(");

    for (const operation of [
      "listCaddeCountries",
      "listCaddeCities",
      "listCaddeFeed",
      "listCaddeCafes",
      "listCaddeBillboardCards",
      "getCaddeSponsoredPlacement",
      "listCaddePromotions",
      "searchCaddePeople",
      "listCaddeInterestCatalog",
      "listCaddeCafeThemes",
    ]) {
      expect(hookSource, `${operation} veri hook'unda bulunmalı`).toContain(operation);
    }
  });

  it("C14.2 keeps feed polling, widening and interleaving in the feed-state hook", () => {
    const hookPath = "src/hooks/cadde/useCaddeFeedState.ts";

    expect(existsSync(hookPath)).toBe(true);

    const pageSource = read("src/pages/cadde/CaddePage.tsx");
    const hookSource = read(hookPath);

    expect(pageSource).toContain('from "@/hooks/cadde/useCaddeFeedState"');
    expect(pageSource).toContain("useCaddeFeedState(");
    expect(hookSource).toContain("countCaddePostsSince");
    expect(hookSource).toContain("widenCaddeFilters");
    expect(hookSource).toContain("interleavePromotions");
    expect(hookSource).toContain("caddeNewPostPollInterval");
  });

  it("C14.3 keeps composer state and post creation in the composer hook", () => {
    const hookPath = "src/hooks/cadde/useCaddeComposerState.ts";

    expect(existsSync(hookPath)).toBe(true);

    const pageSource = read("src/pages/cadde/CaddePage.tsx");
    const hookSource = read(hookPath);

    expect(pageSource).toContain('from "@/hooks/cadde/useCaddeComposerState"');
    expect(pageSource).toContain("useCaddeComposerState(");
    expect(hookSource).toContain("emptyCaddeComposer");
    expect(hookSource).toContain("createCaddePost");
    expect(hookSource).toContain("Global akışa doğrudan paylaşım yapılamıyor");
  });

  it("C14.4 keeps comment, reaction, share and report state in the engagement hook", () => {
    const hookPath = "src/hooks/cadde/useCaddePostEngagement.ts";

    expect(existsSync(hookPath)).toBe(true);

    const pageSource = read("src/pages/cadde/CaddePage.tsx");
    const hookSource = read(hookPath);

    expect(pageSource).toContain('from "@/hooks/cadde/useCaddePostEngagement"');
    expect(pageSource).toContain("useCaddePostEngagement(");
    expect(hookSource).toContain("createCaddeComment");
    expect(hookSource).toContain("toggleCaddeReaction");
    expect(hookSource).toContain("recordCaddeShare");
    expect(hookSource).toContain("reportCaddeEntity");
    expect(hookSource).toContain("applyReactionToFeedPages");
  });

  it("C14.5 keeps layout state and cold-start composition in the layout hook", () => {
    const hookPath = "src/hooks/cadde/useCaddeLayoutState.ts";

    expect(existsSync(hookPath)).toBe(true);

    const pageSource = read("src/pages/cadde/CaddePage.tsx");
    const hookSource = read(hookPath);

    expect(pageSource).toContain('from "@/hooks/cadde/useCaddeLayoutState"');
    expect(pageSource).toContain("useCaddeLayoutState(");
    expect(hookSource).toContain("isColdStart");
    expect(hookSource).toContain("sparseContentHint");
    expect(hookSource).toContain("resolveCaddeClockTarget");
    expect(hookSource).toContain("spotlightBillboard");
  });
});
