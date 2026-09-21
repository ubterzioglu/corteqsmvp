import { describe, expect, it } from "vitest";
import { buildKadroAdText } from "./kadro-ad-text";
import { KADRO_ROLES } from "./roles";
import type { KadroRole } from "./kadro-types";

describe("buildKadroAdText", () => {
  it("ilan metni olmayan rol için null döner", () => {
    const ceo = KADRO_ROLES.find((r) => r.id === "ld-ceo")!;
    expect(buildKadroAdText(ceo)).toBeNull();
  });

  it("ilan metni olan rol için metin üretir", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo);

    expect(text).not.toBeNull();
    expect(typeof text).toBe("string");
    expect(text!.length).toBeGreaterThan(100);
  });

  it("metinde başlık vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("# Head of Marketing & Growth");
  });

  it("metinde özet bölümü vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain(cmo.ad!.sum);
  });

  it("metinde 'Ne yapacaksın?' bölümü vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Ne yapacaksın?");
    for (const item of cmo.ad!.does) {
      expect(text).toContain(`- ${item}`);
    }
  });

  it("metinde 'Kimi arıyoruz?' bölümü vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Kimi arıyoruz?");
    for (const item of cmo.ad!.profile) {
      expect(text).toContain(`- ${item}`);
    }
  });

  it("metinde görev detayları vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Görev Detayları");
    expect(text).toContain("**Departman:**");
    expect(text).toContain("**Eksen:**");
    expect(text).toContain("**Çalışma Tipi:**");
    expect(text).toContain("**Dalga:**");
    expect(text).toContain("**Durum:**");
    expect(text).toContain("**Öncelik:**");
  });

  it("metinde KPI'lar vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## KPI'lar");
    for (const kpi of cmo.kpi) {
      expect(text).toContain(`- ${kpi}`);
    }
  });

  it("metinde çalışma düzeni vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Çalışma Düzeni");
    expect(text).toContain(cmo.cadence);
  });

  it("metinde araçlar vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Araçlar");
    expect(text).toContain(cmo.tools);
  });

  it("metinde tetikleyici vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Tetikleyici");
    expect(text).toContain(cmo.trigger);
  });

  it("metinde çıkış planı vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Çıkış Planı");
    expect(text).toContain(cmo.exit);
  });

  it("metinde ortak bloklar vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("CorteQS şu anda erken aşama");
    expect(text).toContain("Erken dönemde roller");
    expect(text).toContain("Başvuru için");
  });

  it("metinde görev testi vardır", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("## Görev Testi");
    expect(text).toContain(cmo.ad!.test);
  });

  it("Türkçe karakterler korunur", () => {
    const cmo = KADRO_ROLES.find((r) => r.id === "ld-cmo")!;
    const text = buildKadroAdText(cmo)!;

    expect(text).toContain("Çalışma");
    expect(text).toContain("Öncelik");
    expect(text).toContain("Kuruluş");
  });

  it("tüm ilan metni olan roller için metin üretebilir", () => {
    const rolesWithAd = KADRO_ROLES.filter((r) => r.ad !== null);
    expect(rolesWithAd.length).toBe(50);

    for (const role of rolesWithAd) {
      const text = buildKadroAdText(role);
      expect(text).not.toBeNull();
      expect(text!.length).toBeGreaterThan(100);
    }
  });
});
