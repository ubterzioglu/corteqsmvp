import { describe, expect, it } from "vitest";

import {
  normalizeList,
  normalizeLocationRecommendation,
  normalizeMoveRow,
  normalizeScoreBreakdown,
  normalizeServiceRow,
  normalizeStepRow,
  toStringArray,
} from "@/lib/relocation-normalize";

/**
 * `relocation_rank_locations_v1`'in 2026-09-25 öncesi CANLI satır şekli
 * (pg_get_functiondef'ten birebir anahtarlar). `explanations` YOKTUR — kusurun kendisi.
 */
const LIVE_RANK_ROW_WITHOUT_EXPLANATIONS = {
  entity_id: "7b6a0c1e-0000-4000-8000-000000000001",
  country_code: "DE",
  city_code: "BER",
  title: "Berlin",
  hard_filter_pass: true,
  rule_score: 0.6125,
  final_score: 0.6125,
  score_breakdown: {
    budget_fit: 0.5,
    bureaucracy_ease: 0.4,
    healthcare_access: 0.8,
    gsm_coverage: 0.9,
    community_fit: 0.7,
    flight_access: 0.6,
  },
  source_quality: { official_sources_ratio: 0, freshness_hours: null },
};

describe("toStringArray", () => {
  it("dizi olmayan her değeri boş diziye çeker", () => {
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray("pasaport")).toEqual([]);
    expect(toStringArray({ 0: "a" })).toEqual([]);
  });

  it("metin olmayan ve boş öğeleri eler, sırayı korur", () => {
    expect(toStringArray(["Pasaport", null, "", 3, "Diploma"])).toEqual(["Pasaport", "Diploma"]);
  });
});

describe("normalizeLocationRecommendation", () => {
  it("canlı RPC satırında eksik explanations'ı [] yapar ve diğer alanları korur", () => {
    const rec = normalizeLocationRecommendation(LIVE_RANK_ROW_WITHOUT_EXPLANATIONS);
    expect(rec.explanations).toEqual([]);
    expect(rec.title).toBe("Berlin");
    expect(rec.final_score).toBe(0.6125);
    expect(rec.score_breakdown.healthcare_access).toBe(0.8);
    expect(rec.source_quality).toEqual({ official_sources_ratio: 0, freshness_hours: null });
  });

  it("migration sonrası gelen explanations dizisini olduğu gibi geçirir", () => {
    const rec = normalizeLocationRecommendation({
      ...LIVE_RANK_ROW_WITHOUT_EXPLANATIONS,
      explanations: ["Sağlık erişimi yüksek"],
    });
    expect(rec.explanations).toEqual(["Sağlık erişimi yüksek"]);
  });

  it("score_breakdown ve source_quality tamamen yoksa güvenli varsayılan verir", () => {
    const rec = normalizeLocationRecommendation({ entity_id: "x", title: "Münih", rule_score: 0.4 });
    expect(rec.score_breakdown).toEqual({
      budget_fit: 0,
      bureaucracy_ease: 0,
      healthcare_access: 0,
      gsm_coverage: 0,
      community_fit: 0,
      flight_access: 0,
    });
    expect(rec.final_score).toBe(0.4);
    expect(rec.source_quality).toEqual({ official_sources_ratio: 0, freshness_hours: null });
  });

  it("jsonb numeric'in metin gelmesine dayanır", () => {
    const rec = normalizeLocationRecommendation({ rule_score: "0.5", final_score: "0.55" });
    expect(rec.rule_score).toBe(0.5);
    expect(rec.final_score).toBe(0.55);
  });
});

describe("normalizeScoreBreakdown", () => {
  it("altı anahtarı her zaman üretir, sayı olmayanı 0'a çeker", () => {
    const breakdown = normalizeScoreBreakdown({ budget_fit: "abc", gsm_coverage: 0.3 });
    expect(Object.keys(breakdown).sort()).toEqual(
      [
        "budget_fit",
        "bureaucracy_ease",
        "community_fit",
        "flight_access",
        "gsm_coverage",
        "healthcare_access",
      ].sort(),
    );
    expect(breakdown.budget_fit).toBe(0);
    expect(breakdown.gsm_coverage).toBe(0.3);
  });
});

describe("normalizeServiceRow / normalizeStepRow", () => {
  it("hizmette eksik languages ve trust_score güvenli varsayılana düşer", () => {
    const svc = normalizeServiceRow({ id: "s1", provider_name: "Telekom", languages: null });
    expect(svc.languages).toEqual([]);
    expect(svc.trust_score).toBe(0);
    expect(svc.provider_name).toBe("Telekom");
  });

  it("checklist adımında eksik belge listeleri [] olur", () => {
    const step = normalizeStepRow({ id: "b1", name: "Anmeldung", trigger: "after_arrival" });
    expect(step.required_documents).toEqual([]);
    expect(step.output_artifacts).toEqual([]);
    expect(step.trigger).toBe("after_arrival");
  });
});

describe("normalizeMoveRow", () => {
  it("dizi ve nesne alanlarını güvenli varsayılana çeker", () => {
    const move = normalizeMoveRow({ id: "m1", target_country_codes: null, household: null });
    expect(move.target_country_codes).toEqual([]);
    expect(move.must_haves).toEqual([]);
    expect(move.nice_to_haves).toEqual([]);
    expect(move.household.adults).toBe(1);
    expect(move.wizard_answers).toEqual({});
  });
});

describe("normalizeList", () => {
  it("dizi olmayan RPC dönüşünü boş listeye çevirir", () => {
    expect(normalizeList(null, normalizeStepRow)).toEqual([]);
    expect(normalizeList({ id: "x" }, normalizeStepRow)).toEqual([]);
  });

  it("her öğeyi normalize eder", () => {
    const list = normalizeList([LIVE_RANK_ROW_WITHOUT_EXPLANATIONS], normalizeLocationRecommendation);
    expect(list).toHaveLength(1);
    expect(list[0].explanations).toEqual([]);
  });
});
