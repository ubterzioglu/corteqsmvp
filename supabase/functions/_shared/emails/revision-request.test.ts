import { describe, expect, it } from "vitest";

import { buildRevisionRequestEmail } from "./revision-request.ts";

const PAYLOAD = {
  request_id: "11111111-2222-3333-4444-555555555555",
  title: "Üsküdar sayfasındaki başlık düzeltilsin",
  detail: "İlk satır\nİkinci satır",
  status: "acik",
  priority: 8,
  area_label: "Rehber",
  author_email: "corteqssocial@gmail.com",
  created_at: "2026-08-04T10:00:00.000Z",
};

describe("buildRevisionRequestEmail", () => {
  it("başlığı konuya taşır ve tüm alanları gövdeye yazar", () => {
    const email = buildRevisionRequestEmail(PAYLOAD);

    expect(email.subject).toBe(
      "CorteQS yeni revizyon isteği: Üsküdar sayfasındaki başlık düzeltilsin",
    );
    expect(email.html).toContain("Üsküdar sayfasındaki başlık düzeltilsin");
    expect(email.html).toContain("Rehber");
    expect(email.html).toContain("corteqssocial@gmail.com");
    expect(email.text).toContain("Öncelik: 8");
  });

  it("durum kodunu Türkçe etikete çevirir", () => {
    expect(buildRevisionRequestEmail(PAYLOAD).text).toContain("Durum: Açık");
    expect(buildRevisionRequestEmail({ ...PAYLOAD, status: "yapildi" }).text).toContain(
      "Durum: Yapıldı",
    );
  });

  it("bilinmeyen durumu ham haliyle gösterir (veri kaybetmez)", () => {
    const email = buildRevisionRequestEmail({ ...PAYLOAD, status: "beklemede" });

    expect(email.text).toContain("Durum: beklemede");
  });

  it("detaydaki satır sonlarını korur", () => {
    const email = buildRevisionRequestEmail(PAYLOAD);

    expect(email.html).toContain("İlk satır<br>İkinci satır");
  });

  it("panel bağlantısını verilen site adresinden kurar", () => {
    const email = buildRevisionRequestEmail(PAYLOAD, "https://corteqs.net/");

    expect(email.html).toContain("https://corteqs.net/admin/revision-requests");
    expect(email.text).toContain("https://corteqs.net/admin/revision-requests");
  });

  it("site adresi verilmezse canlıya düşer", () => {
    const email = buildRevisionRequestEmail(PAYLOAD, null);

    expect(email.html).toContain("https://corteqs.net/admin/revision-requests");
  });

  it("eksik alanları güvenli varsayılana indirger", () => {
    const email = buildRevisionRequestEmail({});

    expect(email.subject).toBe("CorteQS yeni revizyon isteği: Yeni revizyon isteği");
    expect(email.html).toContain("Detay girilmemiş.");
    expect(email.text).toContain("Öncelik: -");
    expect(email.text).toContain("Açan: -");
  });

  it("başlık ve detaydaki HTML'i kaçırır", () => {
    const email = buildRevisionRequestEmail({
      ...PAYLOAD,
      title: "<script>alert(1)</script>",
      detail: "<img src=x onerror=1>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<img src=x");
  });
});
