import { describe, expect, it } from "vitest";

import {
  INITIAL_DATA,
  STEP_ORDER,
  detectCommand,
  getNextStep,
  getStepMessage,
  resolveCategoryInput,
  shouldRedirectToKnowledgeAssistant,
  shouldStartRegistration,
  validateStep,
} from "@/lib/chatConfig";

// Görünmez boşluklar kod noktasıyla üretilir: kaçış dizisini araç katmanı ham karaktere
// çevirebiliyor (CLAUDE.md — "gerekiyorsa String.fromCharCode ile üret").
const TAB = String.fromCharCode(9);
const NEWLINE = String.fromCharCode(10);
const NBSP = String.fromCharCode(0xa0);

// Sohbet komutları (07.11): bare toLowerCase "İPTAL"i "i + birleşen nokta" yapıyor,
// "SIFIRLA"yı "sifirla" yapıyordu → büyük harfle ya da Türkçe karaktersiz yazılan komut
// tanınmıyordu.
describe("detectCommand", () => {
  it("komutları Türkçe yazımlarıyla tanır", () => {
    expect(detectCommand("geri")).toBe("back");
    expect(detectCommand("düzenle")).toBe("back");
    expect(detectCommand("geç")).toBe("skip");
    expect(detectCommand("sıfırla")).toBe("reset");
    expect(detectCommand("formu aç")).toBe("classic_form");
  });

  it("büyük harf ve boşluktan etkilenmez — İ/I Türkçe kuralla katlanır", () => {
    expect(detectCommand("  İPTAL ")).toBe("reset");
    expect(detectCommand("SIFIRLA")).toBe("reset");
    expect(detectCommand("BAŞTAN")).toBe("reset");
    expect(detectCommand("Geri Al")).toBe("back");
    expect(detectCommand("KLASİK FORM")).toBe("classic_form");
  });

  it("Türkçe karaktersiz yazımı da tanır", () => {
    expect(detectCommand("gec")).toBe("skip");
    expect(detectCommand("sifirla")).toBe("reset");
    expect(detectCommand("bastan")).toBe("reset");
    expect(detectCommand("duzenle")).toBe("back");
    expect(detectCommand("formu ac")).toBe("classic_form");
  });

  it("İngilizce ve tek kelimelik komutları da tanır: skip, sonraki, form", () => {
    expect(detectCommand("skip")).toBe("skip");
    expect(detectCommand("sonraki")).toBe("skip");
    expect(detectCommand("form")).toBe("classic_form");
    // Mobil klavye ilk harfi büyütür.
    expect(detectCommand("Sonraki")).toBe("skip");
    expect(detectCommand("Form")).toBe("classic_form");
    // tr-TR küçültmesi İngilizce "I"yı "ı" yapar; trFold "ı"yı "i"ye katladığı için tutar.
    expect(detectCommand("SKIP")).toBe("skip");
  });

  it("ara boşlukları tek boşluğa indirir: çift boşluk, sekme, satır sonu, bölünmez boşluk", () => {
    expect(detectCommand("geri  al")).toBe("back");
    expect(detectCommand(" GERİ   AL ")).toBe("back");
    expect(detectCommand(`klasik${TAB}form`)).toBe("classic_form");
    expect(detectCommand(`geri${NEWLINE}al`)).toBe("back");
    expect(detectCommand(`formu${NBSP}aç`)).toBe("classic_form");
  });

  it("komut olmayan cevapları komut saymaz", () => {
    expect(detectCommand("İstanbul")).toBeNull();
    expect(detectCommand("geri dönmek istiyorum")).toBeNull();
    expect(detectCommand("")).toBeNull();
    // Boşluk SİLİNMEZ, yalnız sadeleşir: harflerin arasına giren boşluk komut üretmez.
    expect(detectCommand("g e r i")).toBeNull();
  });
});

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

  it("m17: telefondan sonra davet kodu adımı atlanır — profil formunda toplanır", () => {
    expect(getNextStep("phone", { ...INITIAL_DATA })).toBe("offers_needs");
  });

  it("özet mesajında kaynak satırı yer almaz", () => {
    const summary = getStepMessage("summary", { ...INITIAL_DATA, fullname: "Ada Lovelace" });
    expect(summary.content).not.toContain("Kaynak:");
    // m17: referral_code chat akışından kaldırıldı
    expect(summary.content).not.toContain("Referral:");
  });
});
