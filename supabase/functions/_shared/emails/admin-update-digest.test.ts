import { describe, expect, it } from "vitest";

import { buildAdminUpdateEmail } from "./admin-update-digest.ts";

const ENTRY = {
  id: "20260730-ornek",
  date: "30 Temmuz 2026",
  title: "Örnek güncelleme",
  items: ["Birinci madde", "İkinci madde"],
};

describe("buildAdminUpdateEmail — tekil kayıt", () => {
  it("konuyu eski tekil formatla üretir (başlık konudadır)", () => {
    const email = buildAdminUpdateEmail([ENTRY]);

    expect(email.subject).toBe("CorteQS admin güncellemesi: Örnek güncelleme");
    expect(email.html).toContain("Örnek güncelleme");
    expect(email.html).toContain("<li>Birinci madde</li>");
    expect(email.text).toContain("- İkinci madde");
  });

  it("eksik alanları güvenli varsayılana indirger", () => {
    const email = buildAdminUpdateEmail([{ id: "x" }]);

    expect(email.subject).toBe("CorteQS admin güncellemesi: Yeni güncelleme");
    expect(email.html).toContain("<ul");
  });

  it("boş dizide bile geçerli bir mail döner", () => {
    const email = buildAdminUpdateEmail([]);

    expect(email.subject).toBe("CorteQS admin güncellemesi: Yeni güncelleme");
  });
});

describe("buildAdminUpdateEmail — günlük özet (2+ kayıt)", () => {
  const SECOND = { ...ENTRY, id: "20260730-ikinci", title: "İkinci güncelleme" };
  const THIRD = { ...ENTRY, id: "20260730-ucuncu", title: "Üçüncü güncelleme" };

  it("kayıt sayısını konuya yazar ve tüm başlıkları gövdeye alır", () => {
    const email = buildAdminUpdateEmail([ENTRY, SECOND, THIRD]);

    expect(email.subject).toBe("CorteQS admin güncellemesi — günlük özet: 3 kayıt");
    for (const title of ["Örnek güncelleme", "İkinci güncelleme", "Üçüncü güncelleme"]) {
      expect(email.html).toContain(title);
      expect(email.text).toContain(title);
    }
  });

  it("verilen sırayı korur (claim created_at artan sırada verir)", () => {
    const email = buildAdminUpdateEmail([ENTRY, SECOND]);

    expect(email.html.indexOf("Örnek güncelleme")).toBeLessThan(
      email.html.indexOf("İkinci güncelleme"),
    );
  });

  it("başlık ve maddelerdeki HTML'i kaçırır", () => {
    const email = buildAdminUpdateEmail([
      { ...ENTRY, title: "<script>alert(1)</script>" },
      { ...ENTRY, id: "y", items: ["<img src=x onerror=1>"] },
    ]);

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<img src=x");
  });
});
