/**
 * M22 şablon sözleşmesi — tavsiye eşleşme maili.
 *
 * ⚠️ En önemli iddia: **mail talep sahibinin İLETİŞİMİNİ taşımaz.** İletişim
 * Pro kilidinin arkasındadır (ProLockedInboxCard → feature_interest 'pro.inbox');
 * payload'a sunucu tarafında hiç konmaz, şablon da bilinen alanlar DIŞINDA
 * hiçbir şey çizmez. Payload'a sızan fazladan alanlar (requester_email vb.)
 * çıktıya YANSIMAZ — test bunu fazladan alanla kilitler.
 */
import { describe, expect, it } from "vitest";

import { buildRecommendationMatchEmail } from "./recommendation-match";

const payload = {
  pro_name: "Terzi Ayşe",
  request_id: "11111111-2222-3333-4444-555555555555",
  request_title: "Dortmund'da güvenilir terzi",
  request_city: "Dortmund",
  request_country: "DE",
};

describe("tavsiye eşleşme maili", () => {
  it("konu talep başlığını taşır; gövde /tavsiye/:id bağlantısını içerir", () => {
    const mail = buildRecommendationMatchEmail(payload, "https://corteqs.net");

    expect(mail.subject).toContain("Dortmund'da güvenilir terzi");
    expect(mail.html).toContain("/tavsiye/11111111-2222-3333-4444-555555555555");
    expect(mail.html).toContain("Terzi Ayşe");
    expect(mail.html).toContain("Dortmund");
    expect(mail.text).toContain("Talebi gör ve yanıtla");
    expect(mail.text.length).toBeGreaterThan(0);
    // F12: paragraf AYRAÇLARI korunur (text sürümü tek bloka düşmez).
    expect(mail.text).toContain("\n\n");
  });

  it("🔴 talep sahibinin İLETİŞİMİ sızamaz — payload'a fazladan alan konsa bile çizilmez", () => {
    const leaky = {
      ...payload,
      requester_email: "talep@sahibi.com",
      requester_phone: "0555 999 88 77",
      email: "talep@sahibi.com", // alıcı alanı bile gövdeye basılmaz
    };
    const mail = buildRecommendationMatchEmail(leaky, "https://corteqs.net");
    const combined = `${mail.subject}\n${mail.html}\n${mail.text}`;

    expect(combined).not.toContain("talep@sahibi.com");
    expect(combined).not.toContain("0555 999 88 77");
  });

  it("başlık HTML'den kaçırılır (XSS yok)", () => {
    const mail = buildRecommendationMatchEmail(
      { ...payload, request_title: '<script>alert("x")</script>' },
      "https://corteqs.net",
    );

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("🔴 CRLF başlık enjeksiyonu: subject/header satırı KIRILAMAZ (inceleme CRITICAL)", () => {
    const mail = buildRecommendationMatchEmail(
      { ...payload, request_title: "Merhaba\r\nBcc: kurban@evil.example\r\nReply-To: saldirgan@evil.example" },
      "https://corteqs.net",
    );
    const combined = `${mail.subject}\n${mail.html}\n${mail.text}`;

    // Subject tek satır kalır — CR/LF ve kontrol karakteri İÇERMEZ:
    // eslint-disable-next-line no-control-regex -- test: kontrol karakteri YOKLUĞUNU ölçüyor
    expect(mail.subject).not.toMatch(/[\r\n\u0000-\u001f\u007f]/);
    expect(combined).not.toContain("Bcc: kurban@evil.example\r\n");
    // Enjekte metin düz veri olarak bile subject'te satır sonu üretemez:
    expect(mail.subject.split(/[\r\n]/)).toHaveLength(1);
  });

  it("eksik alanlarda çöker gibi davranmaz: başlık fallback + /tavsiye kökü", () => {
    const mail = buildRecommendationMatchEmail({}, null);

    expect(mail.subject).toContain("Tavsiye talebi");
    expect(mail.html).toContain("/tavsiye");
    expect(mail.text.length).toBeGreaterThan(0);
  });

  it("Pro kilidi metni mailde açıklanır (iletişim yok ama yol var)", () => {
    const mail = buildRecommendationMatchEmail(payload, "https://corteqs.net");

    expect(mail.html).toContain("Pro");
  });
});
