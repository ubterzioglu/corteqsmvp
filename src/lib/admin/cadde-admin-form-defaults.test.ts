// AdminCaddePage form varsayılanları — güvenlik ağı (C03).
//
// Sayfa 773 satırdı, tek bileşen içinde DÖRT form durumu tutuyordu ve hiç testi yoktu.
// Bu dosya ayrıştırmanın güvenlik ağıdır.

import { describe, expect, it } from "vitest";

import {
  billboardDefaults,
  cafeDefaults,
  normalizeFormText,
  postDefaults,
  sponsoredDefaults,
} from "@/lib/admin/cadde-admin-form-defaults";

describe("normalizeFormText", () => {
  it("boş ve yalnız boşluktan oluşan metni null'a çevirir", () => {
    // ⚠️ Boş dize ile null AYNI ŞEY DEĞİLDİR: boş dize "değer var ama boş" demektir
    // ve listede boş bir satır çizdirir; null varsayılan metne düşer.
    expect(normalizeFormText("")).toBeNull();
    expect(normalizeFormText("   ")).toBeNull();
    expect(normalizeFormText("\n\t ")).toBeNull();
  });

  it("gerçek metni kırpar ama KORUR", () => {
    expect(normalizeFormText("  Berlin Buluşması  ")).toBe("Berlin Buluşması");
  });

  it("Türkçe karakteri bozmaz", () => {
    expect(normalizeFormText(" Şişli İçerik ")).toBe("Şişli İçerik");
  });

  it("tek karakterlik anlamlı girdiyi null'a düşürmez", () => {
    expect(normalizeFormText("A")).toBe("A");
  });
});

describe("form varsayılanları", () => {
  it("her form YENİ nesne döner (paylaşılan referans yok)", () => {
    // ⚠️ Fabrika olmasının sebebi bu: sabit bir nesne paylaşılsaydı bir formda yapılan
    // değişiklik ötekine sızardı ve bunu hiçbir şey yakalamazdı.
    expect(postDefaults()).not.toBe(postDefaults());
    expect(cafeDefaults()).not.toBe(cafeDefaults());
    expect(billboardDefaults()).not.toBe(billboardDefaults());
    expect(sponsoredDefaults()).not.toBe(sponsoredDefaults());
  });

  it("hepsi DEMO kipinde başlar — yeni içerik kazara canlıya düşmez", () => {
    for (const defaults of [postDefaults(), cafeDefaults(), billboardDefaults(), sponsoredDefaults()]) {
      expect(defaults.content_mode).toBe("demo");
    }
  });

  it("konum alanları boş başlar (ülke/şehir seçtirilir)", () => {
    for (const defaults of [postDefaults(), cafeDefaults(), billboardDefaults(), sponsoredDefaults()]) {
      expect(defaults.countryName).toBe("");
      expect(defaults.cityName).toBe("");
    }
  });

  it("cafe varsayılanında bitiş başlangıçtan SONRADIR", () => {
    const cafe = cafeDefaults();

    expect(new Date(cafe.ends_at).getTime()).toBeGreaterThan(new Date(cafe.starts_at).getTime());
  });

  it("cafe zaman alanları datetime-local biçiminde (saniye YOK)", () => {
    // `<input type="datetime-local">` saniyeli değeri sessizce yok sayar ve alan boş
    // görünür; bu yüzden `slice(0, 16)` şart.
    const cafe = cafeDefaults();

    expect(cafe.starts_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(cafe.ends_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
