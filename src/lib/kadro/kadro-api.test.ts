import { describe, expect, it } from "vitest";
import { validateKadroCandidateDraft } from "./kadro-api";
import type { KadroCandidateStage } from "./kadro-types";

describe("validateKadroCandidateDraft", () => {
  it("boş ad reddeder", () => {
    const draft = { fullName: "", stage: "aday" as const, links: "", note: "" };
    expect(validateKadroCandidateDraft(draft)).toBe("Aday adı boş olamaz.");
  });

  it("sadece boşluk içeren ad reddeder", () => {
    const draft = { fullName: "   ", stage: "aday" as const, links: "", note: "" };
    expect(validateKadroCandidateDraft(draft)).toBe("Aday adı boş olamaz.");
  });

  it("200 karakterden uzun ad reddeder", () => {
    const draft = { fullName: "a".repeat(201), stage: "aday" as const, links: "", note: "" };
    expect(validateKadroCandidateDraft(draft)).toBe("Aday adı 200 karakterden uzun olamaz.");
  });

  it("500 karakterden uzun link reddeder", () => {
    const draft = {
      fullName: "Ahmet Yılmaz",
      stage: "aday" as const,
      links: "a".repeat(501),
      note: "",
    };
    expect(validateKadroCandidateDraft(draft)).toBe("Linkler 500 karakterden uzun olamaz.");
  });

  it("1000 karakterden uzun not reddeder", () => {
    const draft = {
      fullName: "Ahmet Yılmaz",
      stage: "aday" as const,
      links: "",
      note: "a".repeat(1001),
    };
    expect(validateKadroCandidateDraft(draft)).toBe("Not 1000 karakterden uzun olamaz.");
  });

  it("geçersiz aşama reddeder", () => {
    const draft = { fullName: "Ahmet Yılmaz", stage: "gecersiz" as unknown as KadroCandidateStage, links: "", note: "" };
    expect(validateKadroCandidateDraft(draft)).toBe("Geçersiz aday aşaması.");
  });

  it("geçerli taslak için null döner", () => {
    const draft = {
      fullName: "Ahmet Yılmaz",
      stage: "aday" as const,
      links: "https://linkedin.com/in/ahmet",
      note: "İyi bir aday",
    };
    expect(validateKadroCandidateDraft(draft)).toBeNull();
  });

  it("tüm geçerli aşamaları kabul eder", () => {
    const stages = ["aday", "gorusme", "teklif", "kapandi"] as const;
    for (const stage of stages) {
      const draft = { fullName: "Test", stage, links: "", note: "" };
      expect(validateKadroCandidateDraft(draft)).toBeNull();
    }
  });

  it("Türkçe karakterli isimleri kabul eder", () => {
    const draft = {
      fullName: "İlkay Şahingöz",
      stage: "aday" as const,
      links: "",
      note: "Çok iyi bir aday, özenli çalışıyor.",
    };
    expect(validateKadroCandidateDraft(draft)).toBeNull();
  });
});
