import { describe, expect, it } from "vitest";

import { ADMIN_UPDATES } from "./admin-updates";

describe("ADMIN_UPDATES", () => {
  it("30 Ağustos'tan eksik kalan teknik işleri yeni bildirim olarak gösterir", () => {
    const latest = ADMIN_UPDATES[0];
    const detail = latest.items.join(" ");
    const normalizedDetail = detail.toLocaleLowerCase("tr-TR");

    expect(latest.id).toBe("20260831-30-agustos-eksik-teknik-isler");
    expect(latest.date).toBe("31 Ağustos 2026");
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
