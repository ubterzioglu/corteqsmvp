/**
 * B7 · Excel sayı teyidi — role_structure.ts ile Excel arasındaki tutarlılık.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Excel'den eksik satır.** 259 satır olmalı; eksik varsa UI'da rol görünmez.
 *   2. **Ana rol sayısı değişimi.** 7 ana rol sabit; değişirse UI kartları güncellenmeli.
 *   3. **ÖNERİ rollerin sızması.** 19 ÖNERİ rol UI'da gösterilmemeli.
 */
import { describe, expect, it } from "vitest";
import { ROLE_STRUCTURE, ANA_ROLLER, ONAYLANMIS_ROLLER, ONERI_ROLLER } from "@/lib/role-structure";

describe("B7 · Excel sayı teyidi", () => {
  it("toplam 259 satır (Excel 'Yeni Rol Yapısı')", () => {
    expect(ROLE_STRUCTURE.length).toBe(259);
  });

  it("7 ana rol (Bireysel + 6 başvurulabilir)", () => {
    expect(ANA_ROLLER.length).toBe(7);
    expect(ANA_ROLLER).toContain("Bireysel Kullanıcı");
    expect(ANA_ROLLER).toContain("Danışman");
    expect(ANA_ROLLER).toContain("İşletme");
    expect(ANA_ROLLER).toContain("Kuruluş");
    expect(ANA_ROLLER).toContain("Şehir Elçisi");
    expect(ANA_ROLLER).toContain("İçerik Üretici");
    expect(ANA_ROLLER).toContain("Venture Hub");
  });

  it("240 onaylanmış rol (durum = 'onaylandi')", () => {
    expect(ONAYLANMIS_ROLLER.length).toBe(240);
  });

  it("19 ÖNERİ rol (durum = 'oneri', UI'da gösterilmez)", () => {
    expect(ONERI_ROLLER.length).toBe(19);
  });

  it("tüm yeni_kod'lar benzersiz", () => {
    const kodlar = ROLE_STRUCTURE.map((r) => r.yeniKod);
    const benzersiz = new Set(kodlar);
    expect(benzersiz.size).toBe(kodlar.length);
  });

  it("tüm yeni_kod'lar noktalı formatta (ana.alt.uzmanlik)", () => {
    for (const r of ROLE_STRUCTURE) {
      // Bireysel istisna: tek seviye
      if (r.anaRol === "Bireysel Kullanıcı") continue;
      // Diğerleri: en az 2 seviye (ana.alt)
      expect(r.yeniKod).toMatch(/^[a-z_]+\.[a-z_]+/);
    }
  });
});
