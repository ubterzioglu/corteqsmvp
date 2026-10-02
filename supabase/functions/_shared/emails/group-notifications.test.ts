// G23 · grup bildirimi şablonları — metinler tasarım §9 tablosuna karşı BİREBİR
// kilitli (politika §6 rozet testiyle aynı desen: kaynak dosyadan ayrıştırılır).
// Ayrıca kural 8: maile davet linki GİRMEZ — {link} alanları site sayfasıdır.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildGroupNotificationEmail } from "./group-notifications.ts";

const DESIGN = "docs/dijital-gruplar/02_motor-tasarimi.md";

/** §9 tablosundan olay → metin eşlemesi: | Olay | Alıcı | Metin | (tırnaklar soyulur) */
const designRows = (): Record<string, string> => {
  const doc = readFileSync(DESIGN, "utf8");
  const section = doc.split("## 9.")[1]?.split(/\n---/)[0] ?? "";
  const rows: Record<string, string> = {};
  for (const match of section.matchAll(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm)) {
    if (match[1] === "Olay" || match[1].startsWith("---")) continue;
    rows[match[1]] = match[3].replace(/^"|"$/g, "");
  }
  return rows;
};

const payload = (overrides: Record<string, unknown> = {}) => ({
  email: "uye@example.com",
  group_name: "Berlin Yazılımcıları",
  slug: "berlin-yazilimcilari",
  ...overrides,
});

describe("group-notifications · tasarım §9 metinleri birebir", () => {
  const rows = designRows();

  it("§9 tablosu gerçekten okundu (8 olay)", () => {
    expect(Object.keys(rows).length).toBeGreaterThanOrEqual(8);
  });

  it("Gönderim alındı", () => {
    const email = buildGroupNotificationEmail("group_submission_received", payload());
    expect(email.text).toContain(rows["Gönderim alındı"]);
  });

  it("Yayına çıktı — {Grup} ve {link} yerine konur", () => {
    const template = rows["Yayına çıktı"];
    const email = buildGroupNotificationEmail("group_published", payload());
    const expected = template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{link}", "https://corteqs.net/addcom?group=berlin-yazilimcilari");
    expect(email.text).toContain(expected);
  });

  it("Reddedildi — {sebep} ve Grup Sözü linki", () => {
    const template = rows["Reddedildi"];
    const email = buildGroupNotificationEmail("group_rejected", payload({ reason: "Kara liste" }));
    const expected = template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{sebep}", "Kara liste")
      .replace("{link}", "https://corteqs.net/addcom");
    expect(email.text).toContain(expected);
    // Grup Sözü linki form sayfasıdır (politika §10'un göründüğü yer)
    expect(email.text).toContain("Grup Sözü: https://corteqs.net/addcom");
  });

  it("Sahiplik doğrulandı — kod silme hatırlatması", () => {
    const email = buildGroupNotificationEmail("group_ownership_verified", payload());
    expect(email.text).toContain(rows["Sahiplik doğrulandı"]
      .replace("{Grup}", "Berlin Yazılımcıları"));
  });

  it("Yeni gönderi onay bekliyor — {n} ve 48 saat", () => {
    const template = rows["Yeni gönderi onay bekliyor"];
    const email = buildGroupNotificationEmail("group_post_pending", payload({ n: 3 }));
    expect(email.text).toContain(template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{n}", "3"));
    expect(email.text).toContain("48 saat içinde bakmazsan ekibimiz devralır.");
  });

  it("Link çalışmıyor", () => {
    const template = rows["Link çalışmıyor"];
    const email = buildGroupNotificationEmail("group_link_dead", payload());
    const expected = template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{link}", "https://corteqs.net/addcom?group=berlin-yazilimcilari");
    expect(email.text).toContain(expected);
  });

  it("Skor kazanımı", () => {
    const template = rows["Skor kazanımı"];
    const email = buildGroupNotificationEmail("group_score_badge", payload());
    const expected = template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{link}", "https://corteqs.net/addcom?group=berlin-yazilimcilari");
    expect(email.text).toContain(expected);
  });

  it("Uyarı — {sebep}", () => {
    const template = rows["Uyarı"];
    const email = buildGroupNotificationEmail("group_strike_warning", payload({ reason: "1. ihlal — uyarı" }));
    expect(email.text).toContain(template
      .replace("{Grup}", "Berlin Yazılımcıları")
      .replace("{sebep}", "1. ihlal — uyarı"));
  });
});

describe("group-notifications · kural 8 + biçim", () => {
  it("davet linki maile HİÇBİR olayda girmez; {link} site sayfasıdır", () => {
    const events = [
      "group_submission_received", "group_published", "group_rejected",
      "group_ownership_verified", "group_post_pending", "group_link_dead",
      "group_score_badge", "group_strike_warning",
    ] as const;

    for (const event of events) {
      const email = buildGroupNotificationEmail(event, payload({
        // Kötü niyetli/yanlış payload bile sızmamalı: şablon bu alanları OKUMAZ
        whatsapp_link: "https://chat.whatsapp.com/SIZMA",
        invite_code: "SIZMA",
      }));
      expect(email.html, event).not.toContain("chat.whatsapp.com");
      expect(email.text, event).not.toContain("chat.whatsapp.com");
      expect(email.html, event).not.toContain("SIZMA");
      expect(email.subject).toContain("CorteQS");
    }
  });

  it("html kaçışlıdır (grup adı XSS taşımaz)", () => {
    const email = buildGroupNotificationEmail("group_published", payload({
      group_name: '<script>alert(1)</script>',
    }));
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("slug yoksa link /addcom'a düşer; siteUrl override edilir", () => {
    const email = buildGroupNotificationEmail("group_published", payload({ slug: "" }), "https://www.corteqs.net/");
    expect(email.text).toContain("https://www.corteqs.net/addcom");
  });

  it("bilinmeyen tip nötr düşer (ham metin uydurulmaz)", () => {
    const email = buildGroupNotificationEmail("group_bilinmeyen" as never, payload());
    expect(email.text).toContain("bir güncelleme var");
  });
});
