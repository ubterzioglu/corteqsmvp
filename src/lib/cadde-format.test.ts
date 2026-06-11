import { describe, expect, it } from "vitest";

import { injectSponsoredPlacement, interleavePromotions, parseCaddeFilters, serializeCaddeFilters, summarizeCaddeFilters } from "@/lib/cadde-format";
import type { CaddeFeedListItem, CaddePost, CaddePromotionCard, CaddeSponsoredPlacement } from "@/lib/cadde-types";

const makePost = (id: string): CaddePost => ({
  id,
  mode: "real",
  type: "text",
  title: `Post ${id}`,
  body: "Body",
  authorName: "Test",
  authorRole: null,
  authorAvatarUrl: null,
  authorUserId: null,
  country: null,
  city: null,
  isBridge: false,
  pinned: false,
  createdAt: "2026-05-29T00:00:00.000Z",
  needCategory: null,
  interests: [],
  reactionCounts: { like: 0, support: 0, idea: 0 },
  totalReactionCount: 0,
  commentCount: 0,
  comments: [],
  viewerReactions: [],
});

const sponsor: CaddeSponsoredPlacement = {
  id: "s-1",
  title: "Sponsor",
  description: "Desc",
  badgeText: "Sponsorlu",
  ctaLabel: "Git",
  ctaUrl: "/login?mode=signup",
  imageUrl: null,
};

describe("parseCaddeFilters", () => {
  it("defaults to REAL mode when no mode param is present (Cadde 3.0 / R-01)", () => {
    const filters = parseCaddeFilters(new URLSearchParams(""));
    expect(filters).toEqual({ mode: "real", countries: [], cities: [], bridge: false });
  });

  it("enters demo mode only when explicitly requested", () => {
    expect(parseCaddeFilters(new URLSearchParams("mode=demo")).mode).toBe("demo");
    expect(parseCaddeFilters(new URLSearchParams("mode=real")).mode).toBe("real");
    expect(parseCaddeFilters(new URLSearchParams("mode=unknown")).mode).toBe("real");
  });

  it("parses single-value legacy URLs as one-element lists (geriye uyumluluk)", () => {
    const filters = parseCaddeFilters(new URLSearchParams("country=Almanya&city=Berlin&bridge=1"));
    expect(filters).toEqual({ mode: "real", countries: ["Almanya"], cities: ["Berlin"], bridge: true });
  });

  it("parses comma-separated multi geo values, trims and dedupes (Faz 3)", () => {
    const filters = parseCaddeFilters(new URLSearchParams("country=Almanya,%20Hollanda%20,Almanya&city=Berlin,K%C3%B6ln"));
    expect(filters.countries).toEqual(["Almanya", "Hollanda"]);
    expect(filters.cities).toEqual(["Berlin", "Köln"]);
  });
});

describe("serializeCaddeFilters", () => {
  it("omits the mode param for the real default and writes demo explicitly", () => {
    expect(serializeCaddeFilters({ mode: "real", countries: [], cities: [], bridge: false }).toString()).toBe("");
    expect(serializeCaddeFilters({ mode: "demo", countries: [], cities: [], bridge: false }).toString()).toBe("mode=demo");
  });

  it("round-trips multi geo filter state through the URL", () => {
    const original = { mode: "demo" as const, countries: ["Almanya", "Hollanda"], cities: ["Berlin", "Amsterdam"], bridge: true };
    expect(parseCaddeFilters(serializeCaddeFilters(original))).toEqual(original);

    const realDefault = { mode: "real" as const, countries: ["Hollanda"], cities: [], bridge: false };
    expect(parseCaddeFilters(serializeCaddeFilters(realDefault))).toEqual(realDefault);
  });
});

describe("summarizeCaddeFilters", () => {
  it("derives a short badge label from the selection", () => {
    expect(summarizeCaddeFilters({ mode: "real", countries: [], cities: [], bridge: false })).toBe("Global Akış");
    expect(summarizeCaddeFilters({ mode: "real", countries: ["Almanya"], cities: [], bridge: false })).toBe("Almanya");
    expect(summarizeCaddeFilters({ mode: "real", countries: ["Almanya"], cities: ["Berlin", "Köln"], bridge: false })).toBe("Berlin +2");
  });
});

describe("injectSponsoredPlacement", () => {
  it("injects sponsored content after the third real post", () => {
    const items = injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], sponsor, "real");
    expect(items.map((item) => item.kind)).toEqual(["post", "post", "post", "sponsor", "post"]);
  });

  it("does not inject in demo mode, without a sponsor, or with too few posts", () => {
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], sponsor, "demo").every((item) => item.kind === "post")).toBe(true);
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], null, "real").every((item) => item.kind === "post")).toBe(true);
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3")], sponsor, "real").every((item) => item.kind === "post")).toBe(true);
  });
});

describe("interleavePromotions (Faz 6, spec 11.4/15)", () => {
  const makePromo = (id: string): CaddePromotionCard => ({
    campaignId: id,
    placementKey: "cadde-feed-inline",
    campaignType: "business",
    title: `Kampanya ${id}`,
    description: "Aciklama",
    targetUrl: "https://example.com",
    imageUrl: null,
  });
  const posts = (count: number): CaddeFeedListItem[] =>
    Array.from({ length: count }, (_, index) => ({ kind: "post" as const, post: makePost(`p${index + 1}`) }));

  it("her 4 organik postta bir kampanya karti ekler", () => {
    const result = interleavePromotions(posts(9), [makePromo("c1"), makePromo("c2")], "real", 4, 2);
    expect(result.map((item) => item.kind)).toEqual([
      "post", "post", "post", "post", "promotion",
      "post", "post", "post", "post", "promotion",
      "post",
    ]);
  });

  it("ayni kampanya feed basina en fazla maxPerCampaign kez gorunur", () => {
    const result = interleavePromotions(posts(20), [makePromo("c1")], "real", 4, 2);
    const promoCount = result.filter((item) => item.kind === "promotion").length;
    expect(promoCount).toBe(2);
  });

  it("demo modda, kampanya yokken veya az postta dokunmaz", () => {
    expect(interleavePromotions(posts(9), [makePromo("c1")], "demo")).toHaveLength(9);
    expect(interleavePromotions(posts(9), [], "real")).toHaveLength(9);
    expect(interleavePromotions(posts(3), [makePromo("c1")], "real", 4)).toHaveLength(3);
  });

  it("iki sponsor karti art arda gelmez (legacy sponsor + kampanya birlikte)", () => {
    const withLegacySponsor = injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4"), makePost("5"), makePost("6"), makePost("7"), makePost("8")], sponsor, "real");
    const result = interleavePromotions(withLegacySponsor, [makePromo("c1"), makePromo("c2")], "real", 4, 2);
    for (let index = 1; index < result.length; index += 1) {
      const consecutive = result[index].kind !== "post" && result[index - 1].kind !== "post";
      expect(consecutive).toBe(false);
    }
  });
});
