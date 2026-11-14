/**
 * L10b sözleşmeleri — profil doluluk hatırlatma e-postası (profile_completion_reminder).
 *
 * Bildirim hattı parçalıdır ve biri eksik kalırsa HATA VERMEZ, yalnız mail gitmez
 * (CLAUDE.md Kariyer md.8). Bu üye-yönlü olayda abone sütunu/eşlemesi YOKTUR (alıcı
 * payload.email); onun yerine "alıcı doğrudan" kablolaması (directEvents + directRecipient)
 * ve cron işi kilitlenir. Özellik KAPALI doğar: bayrak testi gevşetme.
 *
 * ⚠️ Bu testler mutasyonla sınandı (L10b inceleme turu): yorum satırına/bloğuna alınmış
 * bir koruma "var" sayılmasın diye SQL'den `--` ve `/* … *\/`, edge'den `//` ve blok
 * yorumları ATILIR; kime mail gideceğini belirleyen koşullar BİREBİR metinle kilitlenir.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween, sliceFrom } from "@/test/source-slice";
import { stripSourceComments } from "@/test/strip-source-comments";

const EVENT = "profile_completion_reminder";
const MIGRATION = "20261109100000_profile_completion_reminder.sql";
const MIGRATION_DIR = "supabase/migrations/applied";
const CHECK_MARKER = "add constraint notification_email_outbox_event_type_check";
const EDGE = "supabase/functions/send-notification-emails/index.ts";
const FLAG_KEY = "email.profile_completion_reminder.enabled";

const read = (path: string) => readFileSync(path, "utf8");

/**
 * SQL yorumlarını atar: `--` (satır başında ya da satır sonunda) ve `/* … *\/` blokları.
 * Soldan sağa TEK tarama: hangisi önce gelirse o yorumdur (blok içindeki `--` ya da
 * `--` satırındaki `/*` diğerini yanlış tetiklemez).
 */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\/|--[^\n]*/g, "");

const flat = (source: string) => source.replace(/\s+/g, " ");

const migrationPath = `${MIGRATION_DIR}/${MIGRATION}`;
const migrationCode = () => flat(code(read(migrationPath)));

const checkValues = (sql: string): string[] => {
  const block = sliceBetween(code(sql), CHECK_MARKER, "));", "CHECK listesi");
  return [...block.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
};

const countOf = (haystack: string, needle: string) => haystack.split(needle).length - 1;

describe("L10b · migration dosyası", () => {
  it("applied/ altında yaşar", () => {
    expect(existsSync(migrationPath)).toBe(true);
  });

  it("(a) CHECK listesi bir ÖNCEKİ tanımın üst kümesidir — hiçbir değer düşmez", () => {
    // Önceki tanım = bu dosyadan ÖNCEKİ, CHECK'i yeniden kuran en son migration.
    // (20261005100500 bir kez weekly_city_digest'i düşürmüştü.)
    const previousFile = readdirSync(MIGRATION_DIR)
      .filter((file) => file.endsWith(".sql") && file < MIGRATION)
      .filter((file) => read(`${MIGRATION_DIR}/${file}`).includes(CHECK_MARKER))
      .sort()
      .at(-1);
    expect(previousFile, "önceki CHECK tanımı bulunamadı").toBeDefined();

    const previous = checkValues(read(`${MIGRATION_DIR}/${previousFile}`));
    const next = checkValues(read(migrationPath));

    expect(previous.length, "önceki liste boş okunmuş olmasın").toBeGreaterThanOrEqual(20);
    for (const value of previous) {
      expect(next, `CHECK'ten düşen değer: ${value}`).toContain(value);
    }
    expect(next).toContain(EVENT);
    expect(next.length).toBe(previous.length + 1);
  });

  it("(c) ayar anahtarı KAPALI (false) seed edilir; açık seed / sonradan açma YOK", () => {
    const sql = migrationCode();

    expect(sql).toContain(`'${FLAG_KEY}', 'false'::jsonb`);
    expect(sql).not.toContain(`'${FLAG_KEY}', 'true'`);
    // Anahtar kodda YALNIZ iki yerde geçer: seed satırı + fonksiyondaki guard. Üçüncü bir
    // geçiş (ör. `update … set value='true' where key=…`) bayrağı migration içinde açar.
    expect(countOf(sql, FLAG_KEY), "bayrak anahtarının kod geçiş sayısı").toBe(2);
    expect(sql).not.toContain("update public.notification_settings");
    expect(sql).not.toContain("on conflict (key) do update");
    expect(sql).toContain("on conflict (key) do nothing");
  });

  it("eşik, takvim, tolerans ve sınır ayar satırıdır — değerleri kilitli", () => {
    const sql = migrationCode();

    expect(sql).toContain("'profile_completion_reminder.threshold_percent', '60'::jsonb");
    expect(sql).toContain("'profile_completion_reminder.schedule_days', '[0,3,10]'::jsonb");
    expect(sql).toContain("'profile_completion_reminder.grace_days', '2'::jsonb");
    expect(sql).toContain("'profile_completion_reminder.batch_limit', '200'::jsonb");
  });

  it("fonksiyon SECURITY DEFINER + sabit search_path", () => {
    expect(migrationCode()).toMatch(
      /create or replace function public\.enqueue_profile_completion_reminders\(\) returns integer language plpgsql volatile security definer set search_path = public, auth as \$\$/,
    );
  });

  it("(d) bayrak KAPALIYKEN ya da satırı YOKKEN hiçbir şey yazmadan 0 döner (fail-closed)", () => {
    const fn = sliceFrom(
      code(read(migrationPath)),
      "create or replace function public.enqueue_profile_completion_reminders()",
      "enqueue fonksiyonu",
    );
    const flagAt = fn.indexOf(`notification_setting_enabled('${FLAG_KEY}')`);
    const firstReturnAt = fn.indexOf("return 0;");
    const firstInsertAt = fn.indexOf("insert into public.notification_email_outbox");

    expect(flagAt, "bayrak okunmuyor").toBeGreaterThan(-1);
    expect(firstReturnAt, "erken dönüş yok").toBeGreaterThan(-1);
    expect(firstInsertAt, "insert yok").toBeGreaterThan(-1);
    expect(flagAt).toBeLessThan(firstReturnAt);
    expect(firstReturnAt).toBeLessThan(firstInsertAt);
    // `is not true`: satır yokken fonksiyon NULL döner; `if not NULL` dalı ÇALIŞMAZ.
    expect(flat(fn)).toMatch(
      /if public\.notification_setting_enabled\('email\.profile_completion_reminder\.enabled'\) is not true then return 0; end if;/,
    );
    expect(flat(fn)).not.toMatch(/if not public\.notification_setting_enabled/);
  });

  it("ayar eksik/bozuk/durdur-niyetliyse FAIL-CLOSED (0 döner), varsayılan uydurmaz", () => {
    const fn = migrationCode();

    expect(fn).toMatch(
      /if v_threshold is null or v_grace is null or v_limit is null or v_days is null or jsonb_typeof\(v_days\) <> 'array' or jsonb_array_length\(v_days\) = 0 then return 0; end if;/,
    );
    expect(fn).toContain("if v_limit <= 0 or v_grace < 1 or v_threshold not between 1 and 100 then return 0; end if;");
  });

  it("ALICI elemesi: doğrulanmış, silinmemiş, banlanmamış, sahte olmayan adres", () => {
    const sql = migrationCode();

    expect(sql).toContain("where u.email_confirmed_at is not null and u.email is not null");
    expect(sql).toContain("and u.deleted_at is null");
    expect(sql).toContain("and (u.banned_until is null or u.banned_until <= now())");
    expect(sql).toContain("and u.email not ilike '%@wa.local'");
    expect(sql).toContain("and u.created_at > now() - make_interval(days => v_max_day + v_grace + 1)");
  });

  it("ZAMANLAMA: pencere [gün, gün+grace), üye başına tek (en geç) adım, kayıt sırası, tavan", () => {
    const sql = migrationCode();

    expect(sql).toContain("select distinct on (c.id) c.*, st.step, st.day from cand c");
    expect(sql).toContain(
      "join steps st on c.age_days >= st.day and c.age_days < st.day + v_grace order by c.id, st.day desc",
    );
    expect(sql).toContain("where s.pct < v_threshold order by s.created_at limit greatest(1, least(v_limit, 500))");
  });

  it("YÜZDE get_current_user_profile ile aynı: required+enabled+active, approved, full_name onaysız, floor", () => {
    const sql = migrationCode();

    expect(sql).toContain("on rar.role_id = ura.role_id and rar.is_enabled and rar.is_required");
    expect(sql).toContain("join public.afs_attributes ac on ac.id = rar.attribute_id and ac.is_active");
    expect(sql).toContain("and upa.approval_status = 'approved'");
    expect(sql).toContain("on fn.user_id = n.id and fn.attribute_id = ac.id and ac.key = 'full_name'");
    expect(countOf(sql, "(ac.key = 'full_name' and coalesce(fn.value_text, '') <> '')")).toBe(2);
    expect(sql).toContain("floor((cp.required_completed::numeric / cp.required_total::numeric) * 100)::integer as pct");
    expect(sql).toContain("where cp.required_total > 0");
  });

  it("(e) dedupe_key GÜNE bağlı (sıraya değil) ve anti-join ile insert BİREBİR aynı", () => {
    const sql = migrationCode();

    expect(sql).toMatch(
      /o\.dedupe_key = 'profile_completion_reminder:' \|\| d\.id::text \|\| ':d' \|\| d\.day::text \)/,
    );
    expect(sql).toMatch(
      /'profile_completion_reminder', 'profile_completion_reminder:' \|\| s\.id::text \|\| ':d' \|\| s\.day::text, jsonb_build_object\(/,
    );
    // Üçüncü, ayrışan bir anahtar ifadesi yok.
    expect(countOf(sql, "'profile_completion_reminder:' ||")).toBe(2);
    expect(sql).toContain("on conflict (dedupe_key) do nothing");
  });

  it("payload: alıcı adresi, yüzde, eşik ve eksik zorunlu alan etiketleri", () => {
    const sql = migrationCode();

    expect(sql).toContain("'email', s.email");
    expect(sql).toContain("'percentage', s.pct");
    expect(sql).toContain("'threshold', v_threshold");
    expect(sql).toContain("'missing_labels', s.missing_labels");
  });

  it("fonksiyon yalnız service_role'e açık; anon/authenticated çalıştıramaz", () => {
    const sql = migrationCode();

    expect(sql).toContain(
      "revoke all on function public.enqueue_profile_completion_reminders() from public, anon, authenticated;",
    );
    expect(sql).toContain("grant execute on function public.enqueue_profile_completion_reminders() to service_role;");
  });

  it("günlük pg_cron işi kurulur ve fonksiyonu çağırır", () => {
    const sql = migrationCode();

    expect(sql).toContain("'profile-completion-reminder'");
    expect(sql).toContain("select public.enqueue_profile_completion_reminders()");
    // Günlük: gün/ay/hafta alanları '*'.
    expect(sql).toMatch(/'\d{1,2} \d{1,2} \* \* \*'/);
  });
});

describe("L10b · (b) olay anahtarı tüm hat parçalarında (yorumlar ATILMIŞ edge kaynağında)", () => {
  const edge = stripSourceComments(read(EDGE));

  it("1) outbox CHECK listesi", () => {
    expect(checkValues(read(migrationPath))).toContain(EVENT);
  });

  it("2) ayar anahtarı: migration seed + edge SETTING_KEY_BY_EVENT bloğunun İÇİNDE", () => {
    expect(migrationCode()).toContain(`'${FLAG_KEY}'`);
    const settings = sliceBetween(edge, "const SETTING_KEY_BY_EVENT", "};", "SETTING_KEY_BY_EVENT");
    expect(settings).toContain(`${EVENT}: "${FLAG_KEY}"`);
  });

  it("3-4) alıcı doğrudan: abone eşlemesi YOK, directEvents + directRecipient VAR", () => {
    const direct = sliceBetween(edge, "const directEvents = new Set<string>([", "]);", "directEvents");
    expect(direct).toContain(`"${EVENT}"`);

    const recipient = sliceBetween(edge, "const directRecipient =", ";", "directRecipient");
    expect(recipient).toContain(`row.event_type === "${EVENT}"`);

    // Admin abonelik RPC'sine dayanan bir olay DEĞİL: sütun eklenmemiş olmalı.
    expect(migrationCode()).not.toContain("admin_notification_subscriptions");
  });

  it("5) buildEmail kolu şablonu DOĞRUDAN çağırır (araya başka kol düşmez) + tip birliği + knownEventTypes", () => {
    expect(edge).toMatch(
      /case "profile_completion_reminder":\s*return buildProfileCompletionReminderEmail\(row\.payload, resolveSiteUrl\(\)\);/,
    );
    expect(edge).toContain(
      'import { buildProfileCompletionReminderEmail } from "../_shared/emails/profile-completion-reminder.ts";',
    );

    const union = sliceBetween(edge, "type EventType =", ";", "EventType");
    expect(union).toContain(`| "${EVENT}"`);

    const known = sliceBetween(edge, "const knownEventTypes = new Set<string>([", "]);", "knownEventTypes");
    expect(known).toContain(`"${EVENT}"`);
  });
});
