/**
 * KR09 şablon sözleşmesi.
 *
 * ⚠️ En önemli iddia: **mail dosya bağlantısı taşımaz.** Kova private'tır ve
 * imzalı bağlantı süreli üretilir; maile gömülen bir bağlantı mail kutusunda
 * süresiz kalır ve iletilen her kopya başvuranın CV'sine erişim açar.
 */
import { describe, expect, it } from "vitest";

import { buildCareerApplicationEmail } from "./career-application";

const payload = {
  application_id: "11111111-2222-3333-4444-555555555555",
  full_name: "Ömer Çağrı Şahin",
  email: "omer@example.com",
  position_id: "coo",
  model: "kurucu-ekip",
  country: "Türkiye",
  city: "İstanbul",
  created_at: "2026-10-02T09:00:00.000Z",
};

describe("kariyer başvurusu bildirim şablonu", () => {
  it("konu ve gövde adayın adını taşır", () => {
    const mail = buildCareerApplicationEmail(payload, "https://corteqs.net");

    expect(mail.subject).toContain("Ömer Çağrı Şahin");
    expect(mail.html).toContain("Ömer Çağrı Şahin");
    expect(mail.text).toContain("Ömer Çağrı Şahin");
  });

  it("dosya yolu veya depolama bağlantısı İÇERMEZ", () => {
    const mail = buildCareerApplicationEmail(
      { ...payload, cv_path: "11111111/cv-ozgecmis.pdf" } as never,
      "https://corteqs.net",
    );

    for (const body of [mail.html, mail.text]) {
      expect(body).not.toContain("cv-ozgecmis.pdf");
      expect(body).not.toContain("career-applications/");
      expect(body).not.toContain("storage/v1");
    }
  });

  it("panele yönlendirir", () => {
    const mail = buildCareerApplicationEmail(payload, "https://corteqs.net");

    expect(mail.html).toContain("https://corteqs.net/admin/kadro/basvurular");
    expect(mail.text).toContain("https://corteqs.net/admin/kadro/basvurular");
  });

  it("site adresi boşsa canlıya düşer, çift eğik çizgi üretmez", () => {
    const mail = buildCareerApplicationEmail(payload, "https://corteqs.net/");

    expect(mail.html).toContain("https://corteqs.net/admin/kadro/basvurular");
    expect(mail.html).not.toContain("net//admin");
    expect(buildCareerApplicationEmail(payload, null).text).toContain("https://corteqs.net/admin");
  });

  it("katılım modeli okunabilir etikete çevrilir, bilinmeyen değer ham kalır", () => {
    expect(buildCareerApplicationEmail(payload).text).toContain("Kurucu Ekip Modeli");
    expect(buildCareerApplicationEmail({ ...payload, model: "uydurma" }).text).toContain("uydurma");
  });

  it("eksik payload çökmez, güvenli varsayılana düşer", () => {
    const mail = buildCareerApplicationEmail({});

    expect(mail.subject).toContain("İsimsiz aday");
    expect(mail.text).toContain("-");
  });

  it("HTML kaçırması yapılır (ad alanından enjeksiyon olmaz)", () => {
    const mail = buildCareerApplicationEmail({ ...payload, full_name: "<script>alert(1)</script>" });

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("şehir yoksa konum yalnız ülkeyi gösterir", () => {
    const mail = buildCareerApplicationEmail({ ...payload, city: "" });

    expect(mail.text).toContain("Konum: Türkiye");
    expect(mail.text).not.toContain("Türkiye /");
  });
});
