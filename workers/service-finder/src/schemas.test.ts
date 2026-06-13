import { describe, expect, it } from "vitest";

import { candidateResultSchema } from "./schemas.js";

const validResult = {
  is_match: true,
  match_reason: "Sayfada Türkçe hizmet açıkça belirtilmiş",
  confidence_score: 85,
  canonical_name: "Dr. Ayşe Yılmaz",
  organization_name: "Praxis Yılmaz",
  profession_label: "Doktor",
  role_key: "Healthcare_Doctor",
  item_type: "advisor",
  category_slug: "advisor-healthcare-doctor",
  city: "Dortmund",
  country_code: "DE",
  languages: ["tr", "de"],
  services: ["Kardiyoloji"],
  contacts: [{ type: "phone", value: "+49 231 5551234", label: "Telefon", is_primary: true }],
  website_url: "https://praxis-yilmaz.de",
  appointment_url: null,
  evidence_quotes: ["Türkçe konuşulur"],
};

describe("candidateResultSchema", () => {
  it("geçerli sınıflandırıcı çıktısını kabul eder", () => {
    expect(candidateResultSchema.safeParse(validResult).success).toBe(true);
  });

  it("eşleşmeyen sayfa (null alanlarla) geçerlidir", () => {
    const noMatch = {
      ...validResult,
      is_match: false,
      confidence_score: 0,
      canonical_name: null,
      organization_name: null,
      profession_label: null,
      role_key: null,
      item_type: null,
      category_slug: null,
      city: null,
      country_code: null,
      languages: [],
      services: [],
      contacts: [],
      website_url: null,
      evidence_quotes: [],
    };
    expect(candidateResultSchema.safeParse(noMatch).success).toBe(true);
  });

  it("güven skoru 100'ü aşamaz", () => {
    expect(
      candidateResultSchema.safeParse({ ...validResult, confidence_score: 150 }).success,
    ).toBe(false);
  });

  it("geçersiz iletişim tipi reddedilir", () => {
    expect(
      candidateResultSchema.safeParse({
        ...validResult,
        contacts: [{ type: "fax", value: "123" }],
      }).success,
    ).toBe(false);
  });

  it("6'dan fazla kanıt alıntısı reddedilir", () => {
    expect(
      candidateResultSchema.safeParse({
        ...validResult,
        evidence_quotes: Array.from({ length: 7 }, (_, index) => `quote ${index}`),
      }).success,
    ).toBe(false);
  });

  it("eksik zorunlu alan reddedilir", () => {
    const { is_match: _omitted, ...incomplete } = validResult;
    expect(candidateResultSchema.safeParse(incomplete).success).toBe(false);
  });
});
