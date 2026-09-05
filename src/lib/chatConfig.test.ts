import { describe, expect, it } from "vitest";

import {
  INITIAL_DATA,
  STEP_ORDER,
  getNextStep,
  getStepMessage,
  resolveCategoryInput,
  shouldRedirectToKnowledgeAssistant,
  shouldStartRegistration,
  validateStep,
} from "@/lib/chatConfig";

describe("chatConfig helpers", () => {
  it("accepts typed category labels and aliases", () => {
    expect(resolveCategoryInput("İşletme / Şirket")).toBe("isletme");
    expect(resolveCategoryInput("emlak şirketi")).toBe("isletme");
    expect(resolveCategoryInput("doktor")).toBe("danisman");
    expect(resolveCategoryInput("şehir elçisi")).toBe("sehir-elcisi");
  });

  it("keeps category validation compatible with natural input", () => {
    expect(validateStep("category", "doktor", {} as never)).toEqual({ ok: true });
    expect(validateStep("category", "rastgele cevap", {} as never)).toEqual({
      ok: false,
      message: "Lütfen bir kategori seç.",
    });
  });

  it("detects likely knowledge questions for knowledge-assistant redirect", () => {
    expect(shouldRedirectToKnowledgeAssistant("Corteqs nedir?")).toBe(true);
    expect(shouldRedirectToKnowledgeAssistant("Nasıl çalışıyor bu platform")).toBe(true);
    expect(shouldRedirectToKnowledgeAssistant("Berlin")).toBe(false);
  });

  it("detects explicit registration intent", () => {
    expect(shouldStartRegistration("Kayıt olmak istiyorum")).toBe(true);
    expect(shouldStartRegistration("Beni ekleyin lütfen")).toBe(true);
    expect(shouldStartRegistration("Berlin hakkında bilgi verir misin?")).toBe(false);
  });
});

// `referral_source` adımı kayıt akışından kaldırıldı (T19, 3 Eylül 2026).
describe("chat kayıt akışı referans kaynağını sormaz", () => {
  it("adım sırasında referral_source / referral_detail bulunmaz", () => {
    const stepNames: string[] = STEP_ORDER.map((step) => String(step));
    expect(stepNames).not.toContain("referral_source");
    expect(stepNames).not.toContain("referral_detail");
  });

  it("telefondan sonra doğrudan davet koduna geçer", () => {
    expect(getNextStep("phone", { ...INITIAL_DATA })).toBe("referral_code");
  });

  it("özet mesajında kaynak satırı yer almaz", () => {
    const summary = getStepMessage("summary", { ...INITIAL_DATA, fullname: "Ada Lovelace" });
    expect(summary.content).not.toContain("Kaynak:");
    expect(summary.content).toContain("Referral:");
  });
});
