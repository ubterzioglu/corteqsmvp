import { describe, expect, it } from "vitest";

import {
  buildRevisionCompletedEmail,
  formatRevisionNumber,
} from "./revision-request-completed.ts";

const PAYLOAD = {
  request_id: "11111111-2222-3333-4444-555555555555",
  revision_number: 42,
  title: "Üsküdar sayfasındaki başlık düzeltilsin",
  detail: "İlk satır\nİkinci satır",
  priority: 8,
  area_label: "Rehber",
  completed_by: "ubterzioglu@gmail.com",
  completed_at: "2026-09-27T10:00:00.000Z",
};

describe("formatRevisionNumber", () => {
  it("üç haneye tamamlar", () => {
    expect(formatRevisionNumber(42)).toBe("#REV-042");
    expect(formatRevisionNumber(7)).toBe("#REV-007");
    expect(formatRevisionNumber(1234)).toBe("#REV-1234");
  });

  it("metin olarak gelen sayıyı da kabul eder", () => {
    expect(formatRevisionNumber("42")).toBe("#REV-042");
  });

  it("numara yoksa BOŞ döner — mail yine çalışmalı", () => {
    // Numara atanmadan önce kuyruğa girmiş eski satırlar bu yola düşer.
    expect(formatRevisionNumber(null)).toBe("");
    expect(formatRevisionNumber(undefined)).toBe("");
    expect(formatRevisionNumber(0)).toBe("");
    expect(formatRevisionNumber(-3)).toBe("");
    expect(formatRevisionNumber("abc")).toBe("");
  });
});

describe("buildRevisionCompletedEmail", () => {
  it("numarayı konuya taşır ve tüm alanları gövdeye yazar", () => {
    const email = buildRevisionCompletedEmail(PAYLOAD);

    expect(email.subject).toBe(
      "CorteQS revizyon tamamlandı: #REV-042 Üsküdar sayfasındaki başlık düzeltilsin",
    );
    expect(email.html).toContain("#REV-042");
    expect(email.html).toContain("Rehber");
    expect(email.html).toContain("ubterzioglu@gmail.com");
    expect(email.html).toContain("Durum: Yapıldı");
    expect(email.text).toContain("Revizyon No: #REV-042");
    expect(email.text).toContain("Tamamlayan: ubterzioglu@gmail.com");
  });

  it("serbest metindeki satır sonlarını korur ve kaçırmayı önce yapar", () => {
    const email = buildRevisionCompletedEmail({
      ...PAYLOAD,
      detail: "<script>kotu</script>\nikinci satır",
    });

    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("<br>");
  });

  it("numara yoksa başlık numarasız kurulur, tablo satırı hiç çizilmez", () => {
    const email = buildRevisionCompletedEmail({ ...PAYLOAD, revision_number: null });

    expect(email.subject).toBe(
      "CorteQS revizyon tamamlandı: Üsküdar sayfasındaki başlık düzeltilsin",
    );
    expect(email.html).not.toContain("#REV-");
    expect(email.html).not.toContain("Revizyon No");
    expect(email.text).not.toContain("Revizyon No");
  });

  it("eksik payload'da çökmez, güvenli varsayılanlara düşer", () => {
    const email = buildRevisionCompletedEmail({});

    expect(email.subject).toBe("CorteQS revizyon tamamlandı: Revizyon isteği");
    expect(email.html).toContain("Detay girilmemiş.");
    expect(email.text).toContain("Öncelik: -");
    expect(email.text).toContain("Alan: -");
    expect(email.text).toContain("Tamamlayan: -");
  });

  it("site adresi verilirse bağlantıyı ona göre kurar, sondaki eğik çizgiyi yutar", () => {
    const email = buildRevisionCompletedEmail(PAYLOAD, "https://mvp.corteqs.net/");

    expect(email.html).toContain("https://mvp.corteqs.net/admin/revision-requests");
    expect(email.text).toContain("https://mvp.corteqs.net/admin/revision-requests");
  });

  it("site adresi boşsa canlıya düşer", () => {
    const email = buildRevisionCompletedEmail(PAYLOAD, "");

    expect(email.text).toContain("https://corteqs.net/admin/revision-requests");
  });
});
