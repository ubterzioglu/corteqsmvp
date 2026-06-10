import { describe, expect, it } from "vitest";

import {
  CADDE_MAX_POST_INTERESTS,
  interestOverlapCount,
  needCategoryMatches,
  normalizeInterestKeys,
  toggleInterestSelection,
  validatePostInterests,
} from "@/lib/cadde-targeting";

describe("normalizeInterestKeys", () => {
  it("trim eder, boşları atar, tekilleştirir ve sırayı korur", () => {
    expect(normalizeInterestKeys([" career ", "", "career", "food", "  "])).toEqual(["career", "food"]);
  });
});

describe("validatePostInterests", () => {
  it("1-3 etiketi kabul eder", () => {
    expect(validatePostInterests(["career"])).toEqual(["career"]);
    expect(validatePostInterests(["career", "food", "travel"])).toHaveLength(3);
  });

  it("3'ten fazla etikette kullanıcı dostu hata fırlatır", () => {
    expect(() => validatePostInterests(["a", "b", "c", "d"])).toThrowError(/En fazla 3 etiket/);
  });

  it("tekrarlar tekilleştirildiği için limite takılmaz", () => {
    expect(validatePostInterests(["a", "a", "b", "b"])).toEqual(["a", "b"]);
  });
});

describe("toggleInterestSelection", () => {
  it("seçili olmayanı ekler, seçiliyi çıkarır (immutable)", () => {
    const current = ["career"];
    const added = toggleInterestSelection(current, "food");
    expect(added).toEqual(["career", "food"]);
    expect(current).toEqual(["career"]);
    expect(toggleInterestSelection(added, "career")).toEqual(["food"]);
  });

  it("limit doluyken yeni etiket eklemez", () => {
    const full = ["a", "b", "c"];
    expect(toggleInterestSelection(full, "d")).toEqual(full);
    expect(full).toHaveLength(CADDE_MAX_POST_INTERESTS);
  });
});

describe("needCategoryMatches / interestOverlapCount", () => {
  it("ihtiyaç kategorisi görüntüleyen ilgi alanlarıyla eşleşir", () => {
    expect(needCategoryMatches("career", ["career", "food"])).toBe(true);
    expect(needCategoryMatches("sports", new Set(["career"]))).toBe(false);
    expect(needCategoryMatches(null, ["career"])).toBe(false);
  });

  it("kesişim sayısı tekilleştirilmiş etiketler üzerinden hesaplanır", () => {
    expect(interestOverlapCount(["career", "career", "food", "sports"], ["career", "food"])).toBe(2);
    expect(interestOverlapCount([], ["career"])).toBe(0);
  });
});
