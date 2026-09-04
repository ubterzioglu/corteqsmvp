import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  // Yeni kayıt EN ÜSTE eklenir: okunmamış rozeti ve /admin/about sıralaması bu
  // sıraya güvenir. Kimlikler benzersiz olmalı — okundu takibi id ile yapılır.
  it("kayıtları en yeniden eskiye sıralar ve kimlikleri benzersizdir", () => {
    expect(ADMIN_UPDATES[0].id).toBe("20260904-profil-toplantisi-ve-workshop-panosu");
    expect(ADMIN_UPDATES[0].date).toBe("4 Eylül 2026");

    const ids = ADMIN_UPDATES.map((update) => update.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("3 Eylül Profiller toplantısının panele işlendiğini duyurur", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260904-profil-toplantisi-ve-workshop-panosu",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(detail).toContain("24 kayıt");
    expect(detail).toContain("B+B");
    expect(detail).toContain("Profil Workshop");
    expect(detail).toContain("26 madde");
  });

  it("TOP 10 HOT FIX listesinin sınır kuralını günlük dille anlatır", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260903-top-10-hot-fix-ve-yonetici-yetkisi",
    );
    const detail = update?.items.join(" ") ?? "";

    expect(update?.date).toBe("3 Eylül 2026");
    expect(detail).toContain("EN FAZLA 10 AÇIK MADDE");
    // Ana tablodan ayıran davranış: tamamlanan madde listede kalır, slot işgal etmez.
    expect(detail).toContain("listeden kaybolmuyor");
    expect(detail).toContain("SuperAdmin");
  });

  it("30 Ağustos'tan eksik kalan teknik işleri günlük kayıtlarda korur", () => {
    const update = ADMIN_UPDATES.find(
      ({ id }) => id === "20260831-30-agustos-eksik-teknik-isler",
    );
    const normalizedDetail = (update?.items.join(" ") ?? "").toLocaleLowerCase("tr-TR");

    expect(update?.date).toBe("31 Ağustos 2026");
    expect(normalizedDetail).toContain("migration");
    expect(normalizedDetail).toContain("supabase sdk");
    expect(normalizedDetail).toContain("veri sınırları");
    expect(normalizedDetail).toContain("test gürültüsü");
    expect(normalizedDetail).toContain("çoklu giriş");
  });

  it("kalan işler turunu günlük kayıtlarda korur", () => {
    const update = ADMIN_UPDATES.find(({ id }) => id === "20260830-kalan-isler-temizlendi");
    const detail = update?.items.join(" ") ?? "";

    expect(update?.date).toBe("30 Ağustos 2026");
    expect(detail).toContain("Contributor");
    expect(detail).toContain("0 uyarı");
    expect(detail).toContain("22/22");
    expect(detail).toContain("Referral QR");
    expect(detail).toContain("0 güvenlik açığı");
    expect(detail.toLocaleLowerCase("tr-TR")).toContain(
      "kendi hesabından kaynak gönderebiliyor",
    );
  });
});
