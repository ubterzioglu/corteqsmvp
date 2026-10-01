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

  it("kaynak ağacında çıplak `groups.<anahtar>` metni yok", () => {
    // Yanlış yazılmış anahtar HATA VERMEZ: group_setting_* sessizce varsayılana
    // düşer ve ürün kuralı sessizce yanlış çalışır. Anahtarı kullanan ilk üretim
    // kodu tek bir modülden okumalı ve o modül buraya yazılmalıdır.
    const allowed = new Set(["src/lib/group-settings.test.ts"]);
    const offenders = sourceFiles().filter((file) => {
      if (allowed.has(file.replace(/\\/g, "/"))) return false;
      return /["'`]groups\.[a-z_]+["'`]/.test(readFileSync(file, "utf8"));
    });

    expect(offenders).toEqual([]);
  });
});
