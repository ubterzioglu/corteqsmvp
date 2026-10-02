/**
 * `public.group_settings` sözleşmesi (G09).
 *
 * ⚠️ **TS tarafında ayna modül BİLEREK YOK.** Tek kaynak migration'dır; eşiği
 * değiştirmek bir SQL `update`'idir, kod değişikliği değil. Bir ayna modül
 * bugün hiçbir üretim dosyasından kullanılmayacağı için `check:dead` onu
 * erişilemez sayar (N01'de yaşanan tuzak) ve dahası "kodda 5 yazıyor, demek ki
 * canlıda da 5" yanılgısını besler (Cadde'de yaşandı: sabit 10/5/10 derken canlı
 * değer 0/0/0'dı). Eşikleri TS'ten okuyan ilk üretim kodu geldiğinde (G12+) o
 * batch modülü gerçek tüketicisiyle birlikte ekler ve aşağıdaki `allowed`
 * listesine yazar.
 *
 * Buradaki beklenen tablo testin KENDİ iddiasıdır — migration'ı kendisiyle
 * karşılaştıran vakum test değildir.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261001120000_group_settings.sql";

/** Kaynak: `docs/dijital-gruplar/02_motor-tasarimi.md` (satır başına kaynak migration'da yazılı). */
const EXPECTED_SEED: Record<string, unknown> = {
  "groups.fast_lane_enabled": false,
  "groups.fast_lane_suggest_threshold": 100,
  "groups.daily_submit_limit": 5,
  "groups.claim_attempt_limit": 3,
  "groups.claim_attempt_window_minutes": 10,
  "groups.invite_open_daily_limit": 20,
  "groups.claim_code_ttl_minutes": 10,
  "groups.report_threshold": 3,
  "groups.report_require_phone": true,
  "groups.report_min_account_age_days": 7,
  "groups.report_same_group_cooldown_days": 30,
  "groups.blocklist_keywords": ["vize", "oturum", "garanti", "sinyal", "yatırım getirisi", "kredi"],
  "groups.health_score_min_days_published": 7,
  "groups.trusted_member_min_approved_posts": 5,
  // Pakette sayı YOK — ihtiyatlı tavan, G05'te kullanıcıyla teyit edilecek.
  "groups.otp_rate_limits": {
    per_user_per_day: 5,
    per_user_per_hour: 3,
    resend_cooldown_seconds: 60,
    max_verify_attempts: 5,
  },
};

const migrationPaths = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];

const migrationSql = () => {
  const path = migrationPaths.find((candidate) => existsSync(candidate));
  if (!path) {
    throw new Error(
      `${MIGRATION} bulunamadı. Migration dosyası applied/ altında yaşar; parent ` +
        "supabase/migrations/ sürüm karşılaştırmasına girmez.",
    );
  }
  return readFileSync(path, "utf8");
};

/** `('groups.x', '<literal>'::jsonb)` çiftlerini migration metninden çıkarır. */
const seededRows = (sql: string): Record<string, unknown> => {
  const rows: Record<string, unknown> = {};
  for (const match of sql.matchAll(/\('(groups\.[a-z_]+)',\s*'([^']*)'::jsonb\)/g)) {
    rows[match[1]] = JSON.parse(match[2]) as unknown;
  }
  return rows;
};

const sourceFiles = (dir = "src"): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });

describe("group_settings sözleşmesi", () => {
  it("migration tam olarak beklenen anahtar ve seed değerleri yazar", () => {
    // Çift yönlü: eksik satır da, beklenmeyen fazladan satır da düşürür.
    expect(seededRows(migrationSql())).toEqual(EXPECTED_SEED);
  });

  it("15 anahtarın hepsi `groups.` önekli ve tekil", () => {
    const keys = Object.keys(EXPECTED_SEED);

    expect(keys).toHaveLength(15);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^groups\.[a-z_]+$/);
  });

  it("ayar tablosu istemciye kapalı, RLS açık", () => {
    const sql = migrationSql();

    expect(sql).toContain("alter table public.group_settings enable row level security");
    expect(sql).toContain("revoke all on table public.group_settings from anon, authenticated");
  });

  it("kara liste okuma yardımcısı istemciye AÇILMAZ, sayısal olanlar açılır", () => {
    // Kara listeyi okuyabilen kullanıcı onu atlatacak metni yazar; tarama ön
    // eleme olduğu için gizli kalmalıdır.
    const sql = migrationSql();

    expect(sql).toContain(
      "revoke all on function public.group_setting_json(text, jsonb) from public, anon, authenticated",
    );
    expect(sql).not.toContain("grant execute on function public.group_setting_json");

    expect(sql).toContain("grant execute on function public.group_setting_bool(text, boolean) to authenticated");
    expect(sql).toContain("grant execute on function public.group_setting_int(text, integer) to authenticated");
  });

  // ⚠️ timeout bilerek 60 sn: tarama src/ altındaki ~1000 dosyayı tek tek okur.
  // Ölçüldü (02.10): tek başına ~4 sn, tam takım yükü altında 17.9 sn → varsayılan
  // 15 sn'lik testTimeout'u aşıp SAHTE KIRMIZI üretti (ihlal yok, süre var).
  it("kaynak ağacında çıplak `groups.<anahtar>` metni yok", { timeout: 60_000 }, () => {
    // Yanlış yazılmış anahtar HATA VERMEZ: group_setting_* sessizce varsayılana
    // düşer ve ürün kuralı sessizce yanlış çalışır. Anahtarı kullanan ilk üretim
    // kodu tek bir modülden okumalı ve o modül buraya yazılmalıdır.
    const allowed = new Set([
      "src/lib/group-settings.test.ts",
      // G12: durum makinesi sözleşme testi `groups.suspension_days` anahtarını
      // migration metninde kilitler. Üretim tüketicisi SQL tarafında
      // (set_group_status_v1 → group_setting_int); TS'ten okuyan ilk üretim kodu
      // geldiğinde modülünü buraya O batch ekler.
      "src/lib/group-status-machine.test.ts",
      // G13: sahiplik sözleşme testi claim anahtarlarını kilitler
      // (claim_start_daily_limit · claim_code_ttl_minutes · claim_attempt_*).
      "src/lib/group-claims-schema.test.ts",
      // G15: uyarı sistemi sözleşme testi strike eşiklerini kilitler
      // (strike_suspend_threshold · strike_remove_threshold · terminal_redlines).
      "src/lib/group-strikes-schema.test.ts",
      // G16: gönderi sözleşme testi post anahtarlarını kilitler
      // (post_escalation_hours · post_max_chars · trusted_member_min_approved_posts).
      "src/lib/group-posts-schema.test.ts",
    ]);
    const offenders = sourceFiles().filter((file) => {
      if (allowed.has(file.replace(/\\/g, "/"))) return false;
      return /["'`]groups\.[a-z_]+["'`]/.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });
});
