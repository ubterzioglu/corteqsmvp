/**
 * KR09 sözleşmeleri — kariyer başvurusu bildirim hattı.
 *
 * Bu hat **beş ayrı yerde** tanımlıdır ve biri eksik kalırsa hata vermez,
 * yalnız mail gitmez:
 *   1. `notification_email_outbox.event_type` CHECK listesi
 *   2. `notification_settings` anahtarı
 *   3. `admin_notification_subscriptions` sütunu
 *   4. `admin_get_notification_subscribers` eşlemesi
 *   5. Edge function (`SETTING_KEY_BY_EVENT` + `buildEmail` kolu)
 * Testler beşini birden kilitler.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const read = (path: string) => readFileSync(path, "utf8");

const migration = (name: string) => {
  const candidates = [`supabase/migrations/applied/${name}`, `supabase/migrations/${name}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${name} bulunamadı (applied/ altında yaşamalı).`);
  return read(path);
};

const NOTIFY_MIGRATION = "20261002000000_career_application_notification.sql";
const ADMINS_MIGRATION = "20261002010000_career_notification_all_admins.sql";
const EDGE = "supabase/functions/send-notification-emails/index.ts";

/** Yorumları atar: migration başlığı yasakladığı/anlattığı terimleri içerir. */
const code = (source: string) =>
  source
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

/**
 * Yalnız CHECK kısıtının değer listesi.
 *
 * ⚠️ Dosyanın tamamında aramak YETMEZ: aynı olay adları aşağıdaki
 * `admin_get_notification_subscribers` dalında da geçiyor. Mutasyon turunda
 * yakalandı — `'radar_scan_digest'` CHECK'ten silindiğinde test, adı öbür
 * yerde bulup yeşil kalmıştı.
 */
const checkValues = (sql: string) =>
  sliceBetween(sql, "add constraint notification_email_outbox_event_type_check", "]));", "CHECK listesi");

describe("kariyer bildirimi — kuyruk sözleşmesi", () => {
  it("CHECK listesi yeni olay tipini içerir", () => {
    // ⚠️ Yalnız TS'te tanımlamak YETMEZ: insert 23514 ile reddedilir
    // (`client_error_reports.source` ile aynı sınıf).
    const values = checkValues(code(migration(NOTIFY_MIGRATION)));

    expect(values).toContain("'career_application'");
  });

  it("CHECK listesi `radar_scan_digest`'i de içerir", () => {
    // 🔴 Canlı kusur: radar-news-scan bu tiple kuyruğa yazıyordu ama değer
    // listede yoktu; mail 19 Eylül'den beri hiç gitmemişti.
    const values = checkValues(code(migration(NOTIFY_MIGRATION)));

    expect(values).toContain("'radar_scan_digest'");
  });

  it("CHECK listesi mevcut tipleri DÜŞÜRMEZ", () => {
    // Kısıt `drop constraint` + `add constraint` ile yeniden kuruluyor;
    // eksik bırakılan bir değer o olayın kuyruğunu sessizce kapatır.
    const values = checkValues(code(migration(NOTIFY_MIGRATION)));

    for (const event of [
      "new_member",
      "admin_update",
      "member_welcome",
      "revision_request",
      "revision_request_completed",
      "relocation_tool_report",
      "relocation_tool_abandonment",
    ]) {
      expect(values, event).toContain(`'${event}'`);
    }
  });

  it("ayar · abonelik sütunu · trigger üçü de kurulu", () => {
    const sql = code(migration(NOTIFY_MIGRATION));

    expect(sql).toContain("'email.career_application.enabled'");
    expect(sql).toContain("add column if not exists career_application_email");
    expect(sql).toContain("after insert on public.career_applications");
  });

  it("payload'a dosya yolu KONMAZ", () => {
    // Kova private; maile gömülen bağlantı mail kutusunda süresiz kalır.
    const sql = code(migration(NOTIFY_MIGRATION));
    const payloadBlock = sliceBetween(sql, "jsonb_build_object", "on conflict (dedupe_key)", "payload bloğu");

    expect(payloadBlock).not.toContain("cv_path");
    expect(payloadBlock).not.toContain("presentation_path");
    expect(payloadBlock).not.toContain("cover_letter_path");
  });

  it("kuyruk satırı tekilleştirilir", () => {
    const sql = code(migration(NOTIFY_MIGRATION));

    expect(sql).toContain("'career_application:' || new.id::text");
    expect(sql).toContain("on conflict (dedupe_key) do nothing");
  });
});

describe("kariyer bildirimi — alıcılar TÜM yöneticiler", () => {
  it("abonelik satırı olmayan yönetici de alır (opt-out)", () => {
    // ⚠️ Diğer olay tipleri abonelik tablosundan gelir: satırı olmayan hiç
    // dönmez. Kariyer bildirimi bilerek bu kuraldan ayrıldı — yeni atanan bir
    // yönetici satır açılana kadar hiçbir başvurudan haberdar olmazdı.
    const sql = code(migration(ADMINS_MIGRATION));

    expect(sql).toContain("if p_event_type = 'career_application' then");
    expect(sql).toContain("from auth.users u");
    expect(sql).toContain("left join public.admin_notification_subscriptions s");
    expect(sql).toContain("coalesce(s.career_application_email, true)");
  });

  it("kapı `is_admin`, `is_moderator` DEĞİL", () => {
    const sql = code(migration(ADMINS_MIGRATION));
    const careerBranch = sliceBetween(
      sql,
      "if p_event_type = 'career_application' then",
      "return query\n  select s.user_id",
      "kariyer dalı",
    );

    expect(careerBranch).toContain("public.is_admin(u.id)");
    expect(careerBranch).not.toContain("is_moderator");
  });

  it("diğer olay tiplerinin kuralı DEĞİŞMEDİ", () => {
    const sql = code(migration(ADMINS_MIGRATION));

    expect(sql).toContain("when 'new_member' then s.new_member_email");
    expect(sql).toContain("when 'revision_request' then s.revision_request_email");
    expect(sql).toContain("public.is_moderator(s.user_id)");
  });
});

describe("kariyer bildirimi — edge function tarafı", () => {
  it("olay tipi · ayar anahtarı · şablon kolu üçü de bağlı", () => {
    const source = read(EDGE);

    expect(source).toContain('career_application: "email.career_application.enabled"');
    expect(source).toContain('| "career_application"');
    expect(source).toContain('case "career_application":');
    expect(source).toContain("buildCareerApplicationEmail(row.payload, resolveSiteUrl())");
  });

  it("şablon dosyası `src/` altından import ETMEZ", () => {
    // Edge deploy yalnız supabase/functions/ klasörünü yükler; src/ importu
    // canlıda modül bulunamadı hatasıyla düşer.
    const template = read("supabase/functions/_shared/emails/career-application.ts");

    expect(template).not.toContain('from "@/');
    expect(template).not.toContain("../../../src/");
  });
});
