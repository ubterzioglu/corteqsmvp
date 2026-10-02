/**
 * G23 sözleşmesi — bildirim migration'ı + edge kablolaması.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **KR09 dersi (CHECK):** `event_type` CHECK'i genişletilmeden TS birliği
 *      genişlerse satırlar 23514 ile SESSİZCE reddedilir. 9 eski + 8 yeni değer
 *      burada kilitli.
 *   2. **Çift bildirim:** hızlı şerit yayını hem "alındı" hem "yayında" üretirse
 *      kullanıcı iki mail alır; fast_lane log satırı (from_status NULL) ayrıca
 *      tetiklenirse üçüncü de gelir. İki kilit de burada.
 *   3. **Kural 8:** trigger fonksiyonları `whatsapp_link`/`invite_code`'a
 *      DOKUNAMAZ — payload'a giren her alan mail'e girer.
 *   4. **Spam:** `group_post_pending` gün damgalı dedupe olmadan her gönderide
 *      mail atar.
 *   5. **Toplu işlem patlaması:** skip bayrağı olmadan G11/G10c migration'ları
 *      yüzlerce bildirim üretir.
 *   6. **Edge kablolaması:** anahtar/birlik/şablon/alıcı dörtlüsünden biri
 *      eksikse mail sessizce `skipped` ya da yanlış alıcıya gider.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002120000_group_notifications.sql";
const FIX_MIGRATION = "20261002140000_group_strike_notification.sql";
const EDGE = "supabase/functions/send-notification-emails/index.ts";

const GROUP_EVENTS = [
  "group_submission_received",
  "group_published",
  "group_rejected",
  "group_ownership_verified",
  "group_post_pending",
  "group_link_dead",
  "group_score_badge",
  "group_strike_warning",
] as const;

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

describe("G23 · CHECK genişletmesi (KR09 dersi)", () => {
  it("9 eski değer KORUNUR + 8 yeni değer eklenir", () => {
    const constraint = sliceBetween(
      code(),
      "add constraint notification_email_outbox_event_type_check",
      "));",
      "event_type check",
    );

    for (const legacy of [
      "new_member", "admin_update", "member_welcome", "revision_request",
      "revision_request_completed", "relocation_tool_report", "relocation_tool_abandonment",
      "radar_scan_digest", "career_application",
    ]) {
      expect(constraint, `eski tip korunmalı: ${legacy}`).toContain(`'${legacy}'`);
    }
    for (const event of GROUP_EVENTS) {
      expect(constraint, `yeni tip eklenmeli: ${event}`).toContain(`'${event}'`);
    }
  });

  it("8 genel anahtar notification_settings'e seed edilir", () => {
    const sql = flat();
    for (const event of GROUP_EVENTS) {
      expect(sql, `ayar anahtarı: email.${event}.enabled`).toContain(`'email.${event}.enabled', 'true'::jsonb`);
    }
  });
});

describe("G23 · enqueue yardımcısı", () => {
  const helper = () =>
    sliceBetween(
      code(),
      "create or replace function public.enqueue_group_notification",
      "comment on function public.enqueue_group_notification",
      "enqueue helper",
    );

  it("security definer + skip bayrağı + maili yoksa SATIR YAZMAZ", () => {
    const fn = helper();

    expect(code()).toContain("security definer");
    expect(fn).toContain("corteqs.skip_group_notify");
    expect(fn).toContain("select email into v_email from auth.users where id = p_recipient_user");
    expect(fn).toContain("if v_email is null or btrim(v_email) = '' then");
  });

  it("dedupe idempotent + yalnız YENİ satırda dispatcher dürtülür", () => {
    const fn = helper();

    expect(fn).toContain("on conflict (dedupe_key) do nothing");
    expect(fn).toContain("if found then");
    expect(fn).toContain("public.poke_notification_dispatcher()");
  });

  it("grant authenticated + service_role (trigger çağıranları), anon YOK", () => {
    expect(flat()).toContain(
      "grant execute on function public.enqueue_group_notification(text, text, uuid, jsonb) to authenticated, service_role;",
    );
  });
});

describe("G23 · trigger zinciri", () => {
  it("5 trigger doğru tablolarda", () => {
    const sql = code();

    expect(sql).toContain("after insert on public.whatsapp_landings");
    expect(sql).toContain("after insert on public.group_moderation_log");
    expect(sql).toContain("after update on public.group_claims");
    expect(sql).toContain("after insert on public.group_posts");
    expect(sql).toContain("after update on public.whatsapp_landings");
    expect(sql).toContain("when (new.status = 'verified' and old.status is distinct from 'verified')");
    expect(sql).toContain("when (new.post_status = 'pending_group_admin')");
    expect(sql).toContain("when (new.has_approved_badge is true and coalesce(old.has_approved_badge, false) is false)");
  });

  it("çift bildirim YOK: fast_lane log satırı atlanır + published insert 'alındı'yı atlar", () => {
    const logFn = sliceBetween(
      code(),
      "create or replace function public.group_notify_moderation_log",
      "drop trigger if exists trg_group_notify_moderation_log",
      "log trigger",
    );
    expect(logFn).toContain("if new.from_status is null then");

    const insertFn = sliceBetween(
      code(),
      "create or replace function public.group_notify_landing_insert",
      "drop trigger if exists trg_group_notify_landing_insert",
      "insert trigger",
    );
    expect(insertFn).toContain("if new.listing_status = 'published' then");
  });

  it("post_pending günde grup başına TEK mail (gün damgalı dedupe)", () => {
    const fn = sliceBetween(
      code(),
      "create or replace function public.group_notify_post_pending",
      "drop trigger if exists trg_group_notify_post_pending",
      "post trigger",
    );

    expect(fn).toContain("to_char(now(), 'YYYY-MM-DD')");
    expect(fn).toContain("'group_post_pending:' || new.landing_id::text");
  });

  it("kural 8: hiçbir trigger fonksiyonu link/invite_code OKUMAZ", () => {
    const triggerFns = [
      sliceBetween(code(), "create or replace function public.group_notify_landing_insert", "drop trigger if exists trg_group_notify_landing_insert", "insert trigger"),
      sliceBetween(code(), "create or replace function public.group_notify_moderation_log", "drop trigger if exists trg_group_notify_moderation_log", "log trigger"),
      sliceBetween(code(), "create or replace function public.group_notify_claim_verified", "drop trigger if exists trg_group_notify_claim_verified", "claim trigger"),
      sliceBetween(code(), "create or replace function public.group_notify_post_pending", "drop trigger if exists trg_group_notify_post_pending", "post trigger"),
      sliceBetween(code(), "create or replace function public.group_notify_badge_earned", "drop trigger if exists trg_group_notify_badge_earned", "badge trigger"),
      sliceBetween(code(), "create or replace function public.enqueue_group_notification", "comment on function public.enqueue_group_notification", "helper"),
    ];

    for (const fn of triggerFns) {
      expect(fn).not.toContain("whatsapp_link");
      expect(fn).not.toContain("invite_code");
    }
  });

  it("sahip yoksa alıcı submitted_by'a düşer (sessiz kayıp yok)", () => {
    const sql = code();

    expect(sql).toContain("coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id)");
    expect(sql).toContain("coalesce(new.owner_user_id, new.submitted_by, new.user_id)");
  });
});

describe("G23 · edge kablolaması (dörtlü: anahtar + birlik + şablon + alıcı)", () => {  const edge = () => readFileSync(EDGE, "utf8");

  it("8 olay SETTING_KEY_BY_EVENT'te", () => {
    for (const event of GROUP_EVENTS) {
      expect(edge(), `ayar anahtarı: ${event}`).toContain(`${event}: "email.${event}.enabled"`);
    }
  });

  it("8 olay EventType birliğinde (GroupNotificationEventType)", () => {
    expect(edge()).toContain("| GroupNotificationEventType;");
    const template = readFileSync("supabase/functions/_shared/emails/group-notifications.ts", "utf8");
    for (const event of GROUP_EVENTS) {
      expect(template, `birlik üyesi: ${event}`).toContain(`| "${event}"`);
    }
  });

  it("8 olay buildEmail switch'inde şablona bağlı", () => {
    const edgeSrc = edge();
    for (const event of GROUP_EVENTS) {
      expect(edgeSrc, `case: ${event}`).toContain(`case "${event}":`);
    }
    expect(edgeSrc).toContain("buildGroupNotificationEmail(row.event_type, row.payload, resolveSiteUrl())");
  });

  it("8 olay payload.email alıcı yolunda (admin aboneliğine bakmaz)", () => {
    const recipients = sliceBetween(edge(), "const resolveRecipients = async", "let sent = 0;", "resolveRecipients");
    for (const event of GROUP_EVENTS) {
      expect(recipients, `direct alıcı: ${event}`).toContain(`"${event}"`);
    }
  });

  it("şablon import edilir", () => {
    // Satır sonu farklarına (CRLF) dayanıklı parça parça kilit:
    expect(edge()).toContain("buildGroupNotificationEmail,");
    expect(edge()).toContain("type GroupNotificationEventType,");
    expect(edge()).toContain('from "../_shared/emails/group-notifications.ts";');
  });
});

// ─── G25 düzeltmesi: uyarı bildirimi group_strikes'a taşındı ────────────────
//
// QA #13 canlı ölçümde yakaladı: G15 merdiveninin İLK basamağı (warning) durum
// geçişi yapmaz → moderation_log satırı YAZILMAZ (G12: no-op log yazmaz) →
// G23'ün log-trigger kancası uyarı mailini HİÇ göndermiyordu. Düzeltme:
// tek kanca `group_strikes` AFTER INSERT; log trigger'ının strike dalı
// KALDIRILDI (strike_2/3'te çift mail riski de kapanır).

const fixSql = () => {
  const candidates = [
    `supabase/migrations/applied/${FIX_MIGRATION}`,
    `supabase/migrations/${FIX_MIGRATION}`,
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${FIX_MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
};

describe("G25 düzeltmesi · uyarı bildirimi tek kancada", () => {
  it("log trigger'ı strike dalı OLMADAN yeniden tanımlanır (çift mail kilidi)", () => {
    const logFn = sliceBetween(
      fixSql(),
      "create or replace function public.group_notify_moderation_log",
      "comment on function public.group_notify_moderation_log",
      "log trigger (fix)",
    );

    expect(logFn).not.toContain("strike_1");
    expect(logFn).not.toContain("group_strike_warning");
    // Diğer üç dal birebir korunur
    expect(logFn).toContain("new.to_status = 'published'");
    expect(logFn).toContain("new.to_status = 'rejected'");
    expect(logFn).toContain("new.reason = 'link_dead'");
  });

  it("group_strikes AFTER INSERT trigger'ı kurulur — her ihlal = 1 mail", () => {
    const sql = fixSql();

    expect(sql).toContain("after insert on public.group_strikes");
    expect(sql).toContain("execute function public.group_notify_strike()");
    expect(sql).toContain("'group_strike_warning:' || new.id::text");
  });

  it("outcome {sebep} içine işlenir (2./3. ihlalde cümle yanlış anlaşılmasın)", () => {
    const fn = sliceBetween(
      fixSql(),
      "create or replace function public.group_notify_strike",
      "comment on function public.group_notify_strike",
      "strike trigger",
    );

    expect(fn).toContain("when 'suspended' then v_reason || ' — grup 30 gün askıya alındı'");
    expect(fn).toContain("when 'removed' then v_reason || ' — grup listeden kaldırıldı'");
    expect(fn).toContain("'kırmızı çizgi ' || new.redline_number");
    expect(fn).toContain("coalesce(v_landing.owner_user_id, v_landing.submitted_by, v_landing.user_id)");
  });
});
