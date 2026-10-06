/**
 * M26 şablon sözleşmesi — haftalık şehir özeti maili.
 *
 * ⚠️ Kilitler: payload'ın BİLİNEN alanları çizilir (id+title+bağlantı) —
 * fazladan sızan alan (email/telefon) ÇİZİLMEZ · boş özet maili üretilmez
 * (G23: içeriği olmayana satır zaten açılmaz, şablon da 0 içeriği dürüst söyler) ·
 * eşleşmeyen şehirler GÖRÜNÜR kalır (M25 unmatched_cities — sözlük farkı
 * sessizce yutulmaz) · XSS kaçışı.
 */
import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildWeeklyCityDigestEmail } from "./weekly-city-digest";

// Bildirim hattı BEŞ parçalı (biri eksikse hata vermez, mail gitmez) — edge
// kablolaması kaynak kilidiyle kilitlenir (KR09/Radar dersi).
const edgeSource = readFileSync("supabase/functions/send-notification-emails/index.ts", "utf8");

describe("weekly_city_digest · edge kablolaması (5 parça)", () => {
  it("SETTING_KEY_BY_EVENT'te weekly_city_digest → global anahtar", () => {
    expect(edgeSource).toContain('weekly_city_digest: "email.weekly_city_digest.enabled"');
  });

  it("buildEmail kolu şablonu çağırır", () => {
    expect(edgeSource).toContain('case "weekly_city_digest":');
    expect(edgeSource).toContain("buildWeeklyCityDigestEmail(row.payload, resolveSiteUrl())");
  });

  it("alıcı payload.email'den (directEvents — SQL'de enqueue anında çözülür, M27)", () => {
    // M27 ölçümü: getUserById dalı CANLIDA düştü (sb_secret anahtarı GoTrue
    // admin API'sinde 401) — G23 desenine geçildi: email payload'da gelir.
    const idx = edgeSource.indexOf("const directEvents = new Set<string>([");
    const slice = edgeSource.slice(idx, idx + 500);
    expect(slice).toContain('"weekly_city_digest"');
    expect(edgeSource).not.toContain("getUserById");
  });

  it("skip sebebi directRecipient dalında (no_recipient_email, no_subscribers DEĞİL)", () => {
    const idx = edgeSource.indexOf("const directRecipient =");
    const slice = edgeSource.slice(idx, idx + 400);
    expect(slice).toContain('row.event_type === "weekly_city_digest"');
  });
});

/**
 * F13 kilidi (rolout self-heal): edge'in BİLDİĞİ tip kümesi, outbox CHECK
 * kümesiyle BİREBİR aynı olmalı. CHECK'te olup edge'in bilmediği tip → satır
 * pending'de kalır (self-heal çalışır ama mail gitmez); edge'de olup CHECK'te
 * olmayan → DB satırı zaten yazamaz (imkânsız). İki küme birlikte kayar.
 */
describe("edge · F13 knownEventTypes ↔ outbox CHECK aynası", () => {
  // GEÇERLİ CHECK = constraint'i tanımlayan EN SON migration. Eskiden tek bir migration
  // dosyası sabit yazılıydı; sonradan event tipi ekleyen migration'lar (örn. event_published)
  // yeni bir CHECK tanımladığında test eski listeyi okuyup düşüyordu (20 ≠ 19).
  const MIGRATION_DIR = "supabase/migrations/applied";
  const CHECK_MARKER = "add constraint notification_email_outbox_event_type_check";
  const latestCheckMigration = readdirSync(MIGRATION_DIR)
    .filter((file) => file.endsWith(".sql"))
    .filter((file) => readFileSync(`${MIGRATION_DIR}/${file}`, "utf8").includes(CHECK_MARKER))
    .sort()
    .at(-1);
  expect(latestCheckMigration, "outbox event_type CHECK'ini tanımlayan migration bulunamadı").toBeDefined();
  const checkSql = readFileSync(`${MIGRATION_DIR}/${latestCheckMigration}`, "utf8");

  const checkValues = (): string[] => {
    const start = checkSql.indexOf("add constraint notification_email_outbox_event_type_check");
    const block = checkSql.slice(start, checkSql.indexOf("));", start));
    return [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
  };

  const knownValues = (): string[] => {
    const start = edgeSource.indexOf("const knownEventTypes = new Set<string>([");
    expect(start, "knownEventTypes bloğu bulunamadı").toBeGreaterThan(-1);
    const block = edgeSource.slice(start, edgeSource.indexOf("]);", start));
    return [...block.matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  };

  it("CHECK değerleri toplanabiliyor (tarama boşa düşmesin)", () => {
    expect(checkValues().length).toBeGreaterThanOrEqual(19);
  });

  it("iki küme BİREBİR aynı (çift yönlü)", () => {
    expect([...knownValues()].sort()).toEqual([...checkValues()].sort());
  });

  it("bilinmeyen tip TERMINAL düşmez — claim geri bırakılır (attempts iade)", () => {
    const idx = edgeSource.indexOf("if (!knownEventTypes.has(row.event_type))");
    expect(idx, "deferral dalı yok").toBeGreaterThan(-1);
    // Dilim YALNIZ deferral dalı: ilk `continue;` sınırına kadar (sonrasındaki
    // skip/fail blokları bu dalın parçası değil — geniş dilim yanlış pozitif üretir).
    const end = edgeSource.indexOf("continue;", idx);
    const slice = edgeSource.slice(idx, end);
    expect(slice).toContain("claimed_at: null");
    expect(slice).toContain("attempts");
    expect(slice).not.toContain('"skipped"');
    expect(slice).not.toContain('"failed"');
  });
});

const payload = {
  user_id: "11111111-2222-3333-4444-555555555555",
  week: "2026-W40",
  cities: [{ city: "Dortmund" }, { city: "Essen" }],
  events: [{ id: "e1", title: "Dortmund Tanışma Pikniği" }],
  recommendations: [{ id: "r1", title: "Dortmund'da güvenilir terzi" }],
  unmatched_cities: ["Essen"],
};

describe("haftalık şehir özeti maili", () => {
  it("konu hafta + şehirler + içerik sayısını taşır; bağlantılar doğru rotalarda", () => {
    const mail = buildWeeklyCityDigestEmail(payload, "https://corteqs.net");

    expect(mail.subject).toContain("2026-W40");
    expect(mail.subject).toContain("Dortmund, Essen");
    expect(mail.subject).toContain("2 yeni içerik");
    expect(mail.html).toContain("/events/e1");
    expect(mail.html).toContain("/tavsiye/r1");
    expect(mail.html).toContain("Dortmund Tanışma Pikniği");
    expect(mail.text).toContain("https://corteqs.net/tavsiye/r1");
    expect(mail.text.length).toBeGreaterThan(0);
    // F12: paragraf AYRAÇLARI korunur (text sürümü tek bloka düşmez).
    expect(mail.text).toContain("\n\n");
  });

  it("eşleşmeyen şehir GÖRÜNÜR kalır (unmatched_cities sessizce yutulmaz)", () => {
    const mail = buildWeeklyCityDigestEmail(payload, "https://corteqs.net");

    expect(mail.html).toContain("Essen için bu hafta yeni içerik yok");
    expect(mail.text).toContain("Essen");
  });

  it("🔴 payload'a sızan fazladan alan ÇİZİLMEZ (iletişim yüzeyi kapalı)", () => {
    const leaky = {
      ...payload,
      events: [{ id: "e1", title: "Piknik", organizer_email: "org@mail.com", phone: "0555 123 45 67" }],
      email: "uye@mail.com",
    };
    const mail = buildWeeklyCityDigestEmail(leaky, "https://corteqs.net");
    const combined = `${mail.subject}\n${mail.html}\n${mail.text}`;

    expect(combined).not.toContain("org@mail.com");
    expect(combined).not.toContain("0555 123 45 67");
    expect(combined).not.toContain("uye@mail.com");
  });

  it("başlıklar HTML'den kaçırılır (XSS yok)", () => {
    const mail = buildWeeklyCityDigestEmail(
      { ...payload, events: [{ id: "e1", title: '<script>alert("x")</script>' }] },
      "https://corteqs.net",
    );

    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("boş listelerde çökmez — dürüst 'yok' metni (uydurma içerik yok)", () => {
    const mail = buildWeeklyCityDigestEmail(
      { user_id: "u", week: "2026-W40", cities: [], events: [], recommendations: [] },
      null,
    );

    expect(mail.subject).toContain("0 yeni içerik");
    expect(mail.html).toContain("Bu hafta yeni etkinlik yok.");
    expect(mail.html).toContain("Bu hafta yeni tavsiye talebi yok.");
    expect(mail.html).toContain("https://corteqs.net"); // siteUrl fallback
  });
});
