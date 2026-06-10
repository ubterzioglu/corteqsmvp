import { describe, expect, it } from "vitest";

import {
  CADDE_RANK_WEIGHTS,
  compareCaddeRank,
  computeCaddeBand,
  computeCaddeScore,
  deterministicCaddeRand,
  isAfterCaddeCursor,
  type CaddeRankInput,
  type CaddeRankedItem,
} from "@/lib/cadde-ranking";

const baseInput: CaddeRankInput = {
  sameCity: false,
  sameCountry: false,
  needMatch: false,
  interestOverlap: 0,
  engagementScore: 0,
  avgEngagement: 0,
  bridgeFilterMatch: false,
  pinned: false,
  ageHours: 100000,
};

describe("computeCaddeBand (CKS §11.1 truth table)", () => {
  it("A: aynı şehir + ihtiyaç eşleşmesi", () => {
    expect(computeCaddeBand({ ...baseInput, sameCity: true, needMatch: true })).toBe(1);
  });

  it("B: aynı şehir (ihtiyaç eşleşmeden)", () => {
    expect(computeCaddeBand({ ...baseInput, sameCity: true })).toBe(2);
  });

  it("C: aynı ülke", () => {
    expect(computeCaddeBand({ ...baseInput, sameCountry: true })).toBe(3);
  });

  it("D: global, engagement ortalamanın %100 üstünde", () => {
    expect(computeCaddeBand({ ...baseInput, engagementScore: 10, avgEngagement: 5 })).toBe(4);
  });

  it("E: global, engagement ortalamanın %50 üstünde", () => {
    expect(computeCaddeBand({ ...baseInput, engagementScore: 8, avgEngagement: 5 })).toBe(5);
  });

  it("F: kalan global içerik; ortalama 0 iken D/E devre dışı", () => {
    expect(computeCaddeBand(baseInput)).toBe(6);
    expect(computeCaddeBand({ ...baseInput, engagementScore: 100, avgEngagement: 0 })).toBe(6);
  });

  it("aynı şehir bandı engagement bandlarından önce gelir", () => {
    expect(computeCaddeBand({ ...baseInput, sameCity: true, engagementScore: 100, avgEngagement: 5 })).toBe(2);
  });
});

describe("computeCaddeScore (CKS §11.2 ağırlıkları)", () => {
  it("geo skoru tekildir: aynı şehir 100, aynı ülke 60 (toplanmaz)", () => {
    expect(computeCaddeScore({ ...baseInput, sameCity: true, sameCountry: true })).toBe(100);
    expect(computeCaddeScore({ ...baseInput, sameCountry: true })).toBe(60);
  });

  it("ilgi alanı başına +8, en fazla +32", () => {
    expect(computeCaddeScore({ ...baseInput, interestOverlap: 2 })).toBe(16);
    expect(computeCaddeScore({ ...baseInput, interestOverlap: 7 })).toBe(32);
  });

  it("tüm bonuslar toplanır (band A senaryosu)", () => {
    const score = computeCaddeScore({
      sameCity: true,
      sameCountry: true,
      needMatch: true,
      interestOverlap: 1,
      engagementScore: 0,
      avgEngagement: 0,
      bridgeFilterMatch: true,
      pinned: true,
      ageHours: 1,
    });
    expect(score).toBe(
      CADDE_RANK_WEIGHTS.sameCity +
        CADDE_RANK_WEIGHTS.bridgeFilterMatch +
        CADDE_RANK_WEIGHTS.needMatch +
        CADDE_RANK_WEIGHTS.perInterest +
        CADDE_RANK_WEIGHTS.pinned +
        CADDE_RANK_WEIGHTS.freshness6h,
    );
  });

  it("engagement band bonusu yalnız global içeriğe uygulanır", () => {
    expect(computeCaddeScore({ ...baseInput, engagementScore: 10, avgEngagement: 5 })).toBe(CADDE_RANK_WEIGHTS.highEngagementBand);
    expect(computeCaddeScore({ ...baseInput, engagementScore: 8, avgEngagement: 5 })).toBe(CADDE_RANK_WEIGHTS.midEngagementBand);
    expect(computeCaddeScore({ ...baseInput, sameCity: true, engagementScore: 10, avgEngagement: 5 })).toBe(CADDE_RANK_WEIGHTS.sameCity);
  });

  it("tazelik bucket'ları: 6 saat +25, 24 saat +15, 7 gün +5, sonrası 0", () => {
    expect(computeCaddeScore({ ...baseInput, ageHours: 5 })).toBe(25);
    expect(computeCaddeScore({ ...baseInput, ageHours: 20 })).toBe(15);
    expect(computeCaddeScore({ ...baseInput, ageHours: 100 })).toBe(5);
    expect(computeCaddeScore({ ...baseInput, ageHours: 24 * 8 })).toBe(0);
  });
});

describe("deterministicCaddeRand (CKS §11.3)", () => {
  it("aynı gün + aynı scope için stabildir", () => {
    expect(deterministicCaddeRand("post-1", "2026-06-10", "Berlin")).toBe(deterministicCaddeRand("post-1", "2026-06-10", "Berlin"));
  });

  it("gün veya scope değişince sıra değişebilir (en az bir girişte fark üretir)", () => {
    const ids = ["p1", "p2", "p3", "p4", "p5"];
    const today = ids.map((id) => deterministicCaddeRand(id, "2026-06-10", "Berlin"));
    const tomorrow = ids.map((id) => deterministicCaddeRand(id, "2026-06-11", "Berlin"));
    expect(today).not.toEqual(tomorrow);
  });
});

const makeItem = (id: string, band: number, score: number, rand: number): CaddeRankedItem => ({ id, band, score, rand });

describe("compareCaddeRank + cursor pagination", () => {
  const items: CaddeRankedItem[] = [
    makeItem("d", 2, 50, 7),
    makeItem("a", 1, 200, 3),
    makeItem("c", 2, 50, 5),
    makeItem("b", 1, 100, 9),
    makeItem("e", 2, 50, 7), // d ile band/score/rand eşit → id kırar
    makeItem("f", 6, 0, 1),
  ];

  it("band asc, score desc, rand asc, id asc sıralar", () => {
    const sorted = [...items].sort(compareCaddeRank).map((item) => item.id);
    expect(sorted).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("cursor pagination tekrar ve kayıp üretmez (kabul kriteri)", () => {
    const sorted = [...items].sort(compareCaddeRank);
    const pageSize = 2;
    const collected: string[] = [];
    let cursor: CaddeRankedItem | null = null;

    for (let guard = 0; guard < 10; guard += 1) {
      const remaining = cursor ? sorted.filter((item) => isAfterCaddeCursor(item, cursor!)) : sorted;
      const page = remaining.slice(0, pageSize);
      if (page.length === 0) break;
      collected.push(...page.map((item) => item.id));
      cursor = page[page.length - 1];
    }

    expect(collected).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(new Set(collected).size).toBe(collected.length);
  });
});
