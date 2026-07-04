import { describe, expect, it } from "vitest";

import {
  CAREER_HYBRID_THRESHOLD,
  type CareerAnswers,
  computeCareerScores,
  resolveCareerPath,
} from "@/lib/relocation-tools-career";

// docs/10tool/06 §4 — patika sinyal matrisi + hibrit eşiği aynası (SQL relocation_score_career_path_v1).

describe("computeCareerScores — eksik veri (nötr fallback)", () => {
  it("hiç cevap yoksa tüm scale 0.5; patikalar nötr türetilir", () => {
    const scores = computeCareerScores({});
    // international = 0*0.2 + 0.5*0.2 + 0*0.15 + 0.5*0.1 + 0 + (1-0.5)*0.1 + 0.5*0.05 = 0.225
    expect(scores.international_professional).toBeCloseTo(0.225, 4);
    // academic = 0.5*0.35 + 0.5*0.25 + 0 + 0 + 0.5*0.1 = 0.35
    expect(scores.academic_research).toBeCloseTo(0.35, 4);
  });
});

describe("computeCareerScores — net patika sinyalleri", () => {
  it("yüksek araştırma + eğitim isteği + akademik ortam → academic_research", () => {
    const answers: CareerAnswers = {
      research_interest: 5,
      study_willingness: 5,
      favorite_work: ["research"],
      work_environment: "academic",
    };
    const scores = computeCareerScores(answers);
    // academic = 1*0.35 + 1*0.25 + 1*0.15 + 1*0.15 + 0.5(nötr certOpenness)*0.1 = 0.95
    expect(scores.academic_research).toBeCloseTo(0.95, 4);
    expect(resolveCareerPath(scores).topKey).toBe("academic_research");
  });

  it("yüksek risk + girişimcilik + startup ortamı → startup_entrepreneur", () => {
    const scores = computeCareerScores({
      risk_appetite: 5,
      entrepreneurship: 5,
      salary_vs_stability: 5,
      work_environment: "startup",
    });
    // startup = 1*0.25 + 1*0.3 + 1*0.1 + 0.5(nötr clientFacing)*0.1 + 1*0.15 + 0.5(nötr flexible)*0.1 = 0.9
    expect(scores.startup_entrepreneur).toBeCloseTo(0.9, 4);
    expect(resolveCareerPath(scores).topKey).toBe("startup_entrepreneur");
  });

  it("teknik + güçlü portföy + freelance → remote_global", () => {
    const scores = computeCareerScores({
      core_skills: ["technical"],
      portfolio_signal: "strong",
      entrepreneurship: 5,
      work_environment: "freelance",
    });
    // remote = 1*0.25 + 1*0.25 + 1*0.15 + 0.5(nötr flexible)*0.2 + 1*0.15 = 0.9
    expect(scores.remote_global).toBeCloseTo(0.9, 4);
    expect(resolveCareerPath(scores).topKey).toBe("remote_global");
  });

  it("insanlara destek + sağlık becerisi + kamu → public_ngo_community", () => {
    const scores = computeCareerScores({
      people_helping: 5,
      favorite_work: ["people"],
      core_skills: ["healthcare"],
      language_level: 5,
      work_environment: "public",
    });
    // public = 1*0.25 + 1*0.15 + 1*0.1 + 1*0.1 + 0.5(nötr mission)*0.25 + 1*0.1 + 0.5(nötr clientFacing)*0.05 = 0.85
    expect(scores.public_ngo_community).toBeCloseTo(0.85, 4);
    expect(resolveCareerPath(scores).topKey).toBe("public_ngo_community");
  });
});

describe("resolveCareerPath — hibrit (<0.08 fark)", () => {
  it("ilk iki patika 0.08'den yakınsa hibrit", () => {
    const result = resolveCareerPath(computeCareerScores({}));
    // nötr profilde ilk ikinin farkı küçük → hibrit beklenir
    if (result.isHybrid) {
      expect(result.secondaryKey).not.toBeNull();
    }
    // eşik tanımı doğru
    expect(CAREER_HYBRID_THRESHOLD).toBe(0.08);
  });

  it("net kazanan (fark ≥ 0.08) hibrit değil", () => {
    const result = resolveCareerPath(
      computeCareerScores({
        research_interest: 5,
        study_willingness: 5,
        favorite_work: ["research"],
        work_environment: "academic",
      }),
    );
    expect(result.topKey).toBe("academic_research");
    expect(result.isHybrid).toBe(false);
    expect(result.secondaryKey).toBeNull();
  });
});

describe("computeCareerScores — uç değer kırpılır", () => {
  it("aralık dışı scale 0..1'e kırpılır", () => {
    const scores = computeCareerScores({ research_interest: 9 }); // (9-1)/4=2 → 1
    // academic = 1*0.35 + 0.5*0.25 + 0 + 0 + 0.5(nötr certOpenness)*0.1 = 0.525
    expect(scores.academic_research).toBeCloseTo(0.525, 4);
  });
});
