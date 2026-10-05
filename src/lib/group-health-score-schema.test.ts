/**
 * G17 sözleşmesi — Grup Sağlık Skoru (`group_recommendations` + motor).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Formül kayması.** Tasarım §5'in altı kalemi (15+15+15+15+20+20) skoru
 *      ve dolayısıyla rozeti belirler; bir ağırlığın/eşiğin değişmesi karttaki
 *      "Onaylı Grup" rozetini sessizce yanlış gruba verir.
 *   2. **Histerezisin çökmesi.** Rozet 70'te kazanılır, 65'İN ALTINDA kaybedilir;
 *      tek eşik yapılırsa rozet 65-70 bandında her gün gidip gelir (tasarımın
 *      "sürekli gidip gelmesin" notu).
 *   3. **İlk 7 gün null kuralının (kabul #11) delinmesi.** Grace dalı düşerse
 *      yeni grup ilk gün "skorsuz" yerine düşük skorla görünür.
 *   4. **G14'ten önce şema uydurulması.** `group_reports` canlıda YOK; compute
 *      BAKAMAZ (G16 deseni). G14 genişletirken bu test bilinçli güncellenecek.
 *   5. **Skorun istemciden yazılması.** Guard v3: sahip kendi `group_score`'unu
 *      yükseltemez; admin muafiyeti canlı paket clobber'ı için ZORUNLU
 *      (updateLanding 1a3310a1'den beri her moderasyon kaydında null gönderiyor).
 *   6. **Tavsiye tablosuna istemci yazma yolu açılması** (grant/politika sızması).
 *   7. **src clobber'ının geri gelmesi** (updateLanding → group_score yazımı).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002070000_group_health_score.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, YASAKLADIĞI şeyleri anlatıyor (sahte eşleşmesin). */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

const computeFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_health_score_compute",
    "comment on function public.group_health_score_compute",
    "compute",
  );

const recomputeFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_health_score_recompute",
    "comment on function public.group_health_score_recompute",
    "recompute",
  );

const recommendationFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_recommendation_set",
    "comment on function public.group_recommendation_set",
    "recommendation_set",
  );

const guardFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.whatsapp_landings_guard_listing_status",
    "comment on function public.whatsapp_landings_guard_listing_status",
    "guard v3",
  );

describe("G17 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });

  it("yeni kolonlar if-not-exists ile eklenir, group_score MEVCUT kolona yazar", () => {
    const sql = code();

    expect(sql).toContain("add column if not exists has_approved_badge boolean not null default false");
    expect(sql).toContain("add column if not exists group_score_computed_at timestamptz");
    expect(sql).toContain("add column if not exists group_score_breakdown jsonb");
    // Motor mevcut kolona yazar (tasarım §4 "health_score" kavramsal addır).
    expect(sql).toContain("set group_score = v_score");
    expect(sql).not.toContain("add column if not exists health_score");
  });
});

describe("G17 · group_recommendations tablosu", () => {
  const table = () =>
    sliceBetween(
      code(),
      "create table if not exists public.group_recommendations",
      ");",
      "recommendations tablosu",
    );

  it("kullanıcı + grup TEKİL (tasarım §4)", () => {
    expect(table()).toContain("unique (landing_id, user_id)");
  });

  it("istemciye yazma yolu YOK: grant yalnız select, yazma politikası yok", () => {
    const sql = flat();

    expect(sql).toContain(
      "revoke all on table public.group_recommendations from anon, authenticated;",
    );
    expect(sql).toContain(
      "grant select on table public.group_recommendations to anon, authenticated;",
    );
    expect(sql).not.toContain("grant insert");
    expect(sql).not.toContain("grant update");
    expect(sql).not.toContain("grant delete");
    expect(code()).not.toMatch(
      /create policy[^;]*on public\.group_recommendations[^;]*for (insert|update|delete)/i,
    );
  });

  it("select görünürlüğü: kendi satırı + admin", () => {
    const policy = sliceBetween(
      code(),
      "create policy group_recommendations_select_own",
      ";",
      "select politika",
    );

    expect(policy).toContain("user_id = auth.uid()");
    expect(policy).toContain("public.is_admin(auth.uid())");
  });
});

describe("G17 · tavsiye RPC'si (tek kapı)", () => {
  it("anonim yazamaz; yalnız published grup; olmayan grup reddedilir", () => {
    const rpc = recommendationFn();

    expect(rpc).toContain("group_recommendation_auth_required");
    expect(rpc).toContain("group_not_published");
    expect(rpc).toContain("group_not_found");
    expect(rpc).toContain("v_listing <> 'published'");
  });

  it("idempotent: açarken on-conflict yut, kapatarken kendi satırını sil", () => {
    const rpc = recommendationFn();

    expect(rpc).toContain("on conflict (landing_id, user_id) do nothing");
    expect(rpc).toContain("where landing_id = p_landing_id and user_id = v_uid");
  });

  it("authenticated'a açık, anon'a kapalı", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_recommendation_set(uuid, boolean) to authenticated;",
    );
  });
});

describe("G17 · formül tasarım §5 birebir", () => {
  it("altı kalem ağırlıkları 15+15+15+15+20+20", () => {
    const fn = computeFn();

    expect(fn).toContain("'profile', case when v_profile then 15 else 0 end");
    expect(fn).toContain("'rules', case when v_rules then 15 else 0 end");
    expect(fn).toContain("'moderation', case when v_moderation then 15 else 0 end");
    expect(fn).toContain("'link', case when v_link then 15 else 0 end");
    expect(fn).toContain("'reports', case when v_reports then 20 else 0 end");
    expect(fn).toContain("round(20.0 * least(v_rec_count, v_cap) / greatest(v_cap, 1))::integer");
  });

  it("kalem 1: açıklama + kategori + (şehir veya global)", () => {
    const fn = computeFn();

    expect(fn).toContain("v_landing.short_description");
    expect(fn).toContain("v_landing.category");
    expect(fn).toContain("v_landing.city_id is not null or v_landing.is_global");
  });

  it("kalem 3: verified VE 90 gün penceresinde 48 saat aşımı yok", () => {
    const fn = computeFn();

    expect(fn).toContain("v_landing.ownership = 'verified' and not v_queue_overdue");
    expect(fn).toContain("group_setting_int('groups.health_score_queue_window_days'");
    expect(fn).toContain("gp.escalate_at <= now()");
    expect(fn).toContain("gp.post_status = 'pending_platform' and gp.reviewed_by is null");
  });

  it("ESKİ tanım (G14 öncesi, 20261002070000) group_reports'a BAKAMAZ — güncel tanım aşağıdaki G17b bloğunda", () => {
    // Bu test GEÇMİŞ migration'ı kilitler: o dosya canlıya o hâliyle uygulandı ve değişmez.
    // Fonksiyonun GÜNCEL hâli 20261005500000'dadır ve ayrıca kilitlidir.
    expect(computeFn()).not.toContain("group_reports");
  });

  it("link kalemi bugün link_fail_count'tan (tarihçe tablosu uydurulmaz)", () => {
    const fn = computeFn();

    expect(fn).toContain("v_link := coalesce(v_landing.link_fail_count, 0) = 0");
    expect(code()).not.toMatch(/create table[^;]*link_check/i);
  });
});

describe("G17 · eşikler group_settings'ten (kodda sabit yok)", () => {
  it("dört yeni anahtar seed edilir (7 gün G09'da zaten var)", () => {
    const sql = flat();

    expect(sql).toContain("('groups.health_score_badge_award', '70'::jsonb)");
    expect(sql).toContain("('groups.health_score_badge_revoke', '65'::jsonb)");
    expect(sql).toContain("('groups.health_score_recommendation_cap', '10'::jsonb)");
    expect(sql).toContain("('groups.health_score_queue_window_days', '90'::jsonb)");
  });

  it("compute üç eşiği de ayarlardan okur", () => {
    const fn = computeFn();

    expect(fn).toContain("group_setting_int('groups.health_score_min_days_published'");
    expect(fn).toContain("group_setting_int('groups.health_score_recommendation_cap'");
    expect(fn).toContain("group_setting_int('groups.health_score_queue_window_days'");
  });

  it("histerezis eşikleri recompute'ta ayarlardan — 70/65 FONKSİYONDA SABİT DEĞİL", () => {
    const fn = recomputeFn();

    expect(fn).toContain("group_setting_int('groups.health_score_badge_award'");
    expect(fn).toContain("group_setting_int('groups.health_score_badge_revoke'");
    // Varsayılan argümanlar (70/65) yalnız group_setting_int çağrısının
    // yedek değeridir; karşılaştırmalar v_award/v_revoke üzerinden yapılmalı.
    expect(fn).toContain("when v_score >= v_award then true");
    expect(fn).toContain("when v_score < v_revoke then false");
    expect(fn).toContain("else v_old_badge");
  });
});

describe("G17 · kabul #11 — ilk 7 gün null", () => {
  it("grace dalı published_at'tan; skor null, rozet false", () => {
    const fn = computeFn();

    expect(fn).toContain(
      "v_landing.published_at > now() - make_interval(days => v_min_days)",
    );
    expect(fn).toContain("when v_in_grace then null");
    // Grace'te rozet de yok (skor null → false) + computed_at yazılmaz.
    expect(recomputeFn()).toContain("when v_score is null then false");
    expect(recomputeFn()).toContain(
      "group_score_computed_at = case when v_score is null then null else now() end",
    );
  });
});

describe("G17 · yazma yetkisi ve guard v3", () => {
  it("recompute + recompute_all YALNIZ service_role (cron G22)", () => {
    const sql = flat();

    expect(sql).toContain(
      "revoke all on function public.group_health_score_recompute(uuid) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.group_health_score_recompute(uuid) to service_role;",
    );
    expect(sql).toContain(
      "revoke all on function public.group_health_scores_recompute_all() from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.group_health_scores_recompute_all() to service_role;",
    );
  });

  it("recompute guard'ı via_rpc bayrağıyla geçer", () => {
    const fn = recomputeFn();

    expect(fn).toContain("set_config('group_status.via_rpc', 'on', true)");
    expect(fn).toContain("set_config('group_status.via_rpc', '', true)");
  });

  it("guard v3 dört skor kolonunu korur; sahip/anonim yazamaz", () => {
    const guard = guardFn();

    expect(guard).toContain("new.group_score is distinct from old.group_score");
    expect(guard).toContain("new.has_approved_badge is distinct from old.has_approved_badge");
    expect(guard).toContain(
      "new.group_score_computed_at is distinct from old.group_score_computed_at",
    );
    expect(guard).toContain(
      "new.group_score_breakdown is distinct from old.group_score_breakdown",
    );
    expect(guard).toContain("group_score_direct_update_forbidden");
  });

  it("admin muafiyeti VAR (canlı paket clobber'ı kırılmasın) — via_rpc erken dönüşü korunur", () => {
    const guard = guardFn();

    expect(guard).toContain("and not public.is_admin(auth.uid())");
    expect(guard).toContain("current_setting('group_status.via_rpc', true)");
  });

  it("G12/G13 korumaları GERİLETİLMEDİ (guard v3 üstüne ekler)", () => {
    const guard = guardFn();

    expect(guard).toContain("group_status_direct_update_forbidden");
    expect(guard).toContain("group_ownership_direct_update_forbidden");
    expect(guard).toContain("group_engine_field_direct_update_forbidden");
  });
});

// ── G17b · şikayet kalemi (mig 20261005500000) ─────────────────────────────
// compute'u yeniden tanımlayan GÜNCEL migration. Eski dosyayı okuyan yukarıdaki testler bu
// tanımı GÖRMEZ; bu blok olmasa canlıya gidecek fonksiyonu hiçbir sözleşme korumazdı.
const REPORTS_MIGRATION = "supabase/migrations/applied/20261005500000_g17_health_score_reports.sql";
const REPORTS_TABLE_MIGRATION = "supabase/migrations/applied/20261005200000_group_reports.sql";

const commentless = (sql: string) =>
  sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const newComputeFn = () =>
  sliceBetween(
    commentless(readFileSync(REPORTS_MIGRATION, "utf8")),
    "create or replace function public.group_health_score_compute",
    "comment on function public.group_health_score_compute",
    "compute (G17b)",
  );

describe("G17b · şikayet kalemi group_reports'u okur (mig 20261005500000)", () => {
  it("compute'u yeniden tanımlayan EN SON migration budur (bayatlama kapanı)", async () => {
    const { readdirSync } = await import("node:fs");
    const redefining = readdirSync("supabase/migrations/applied")
      .filter((file) => file.endsWith(".sql"))
      .filter((file) =>
        readFileSync(`supabase/migrations/applied/${file}`, "utf8").includes(
          "create or replace function public.group_health_score_compute",
        ),
      )
      .sort();

    expect(redefining.length).toBeGreaterThanOrEqual(2);
    // Daha yeni bir migration fonksiyonu yeniden tanımlarsa bu test BİLEREK kırılır:
    // o dosyayı yukarıdaki sabite taşı, yoksa güncel tanım sessizce kilitsiz kalır.
    expect(redefining.at(-1)).toBe("20261005500000_g17_health_score_reports.sql");
  });

  it("yalnız onaylanmış (upheld) şikayeti ve reviewed_at penceresini sayar; open/rejected sayılmaz", () => {
    // Yalnız şikayet ifadesi: fonksiyonun başka yerinde (kuyruk kalemi) created_at meşru geçer.
    const statement = sliceBetween(newComputeFn(), "v_reports := not exists", "v_in_grace :=", "v_reports");

    expect(statement).toContain("from public.group_reports");
    expect(statement).toContain("landing_id = v_landing.id");
    expect(statement).toContain("status = 'upheld'");
    expect(statement).toContain("reviewed_at >= now() - make_interval(days => v_report_days)");
    expect(statement).not.toContain("'open'");
    expect(statement).not.toContain("'rejected'");
    expect(statement).not.toContain("created_at");
  });

  it("şikayet penceresi KUYRUK penceresinden bağımsız ayardır (v_queue_days şikayete bulaşmaz)", () => {
    const fn = newComputeFn();

    expect(fn).toContain("group_setting_int('groups.health_score_report_window_days', 90)");
    // sliceBetween çıpa bulunamazsa FIRLATIR (sessiz boş dilim yok), bu yüzden test sahte geçemez.
    const reportStatement = sliceBetween(fn, "v_reports := not exists", "v_in_grace :=", "v_reports");
    expect(reportStatement).toContain("v_report_days");
    expect(reportStatement).not.toContain("v_queue_days");
  });

  it("kullandığı sütunlar ve 'upheld' değeri G14 tablosunda GERÇEKTEN var (şema uydurma yasağı)", () => {
    const table = readFileSync(REPORTS_TABLE_MIGRATION, "utf8");

    expect(table).toContain("landing_id uuid not null references public.whatsapp_landings(id)");
    expect(table).toContain("reviewed_at timestamptz");
    expect(table).toContain("check (status in ('open', 'upheld', 'rejected'))");
  });

  it("diğer beş kalem ESKİ tanımla satır satır AYNI (yalnız `v_reports := true` değişti)", () => {
    const oldBody = computeFn()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !/^v_reports := true;/.test(line));
    const newFlat = newComputeFn().replace(/\s+/g, " ");

    expect(oldBody.length).toBeGreaterThan(40);
    const missing = oldBody.filter((line) => !newFlat.includes(line.replace(/\s+/g, " ")));
    expect(missing).toEqual([]);
  });

  it("imza, güvenlik ve yetkiler eski tanımla aynı (stable + security definer, çıktı anahtarları)", () => {
    const fn = newComputeFn();

    expect(fn).toContain("returns jsonb");
    expect(fn).toContain("security definer");
    expect(fn).toContain("set search_path = public");
    for (const key of ["'score'", "'in_grace'", "'recommendation_count'", "'components'", "'reports'"]) {
      expect(fn).toContain(key);
    }
  });

  it("migration salt ekleme: tablo/kolon düşürmez, yalnız create or replace", () => {
    const sql = commentless(readFileSync(REPORTS_MIGRATION, "utf8"));

    expect(sql).not.toMatch(/drop\s+(table|column|function)/i);
    expect(sql).not.toMatch(/\balter\s+table\b/i);
  });
});

describe("G17 · src clobber düzeltmesi", () => {
  it("updateLanding artık group_score YAZMIYOR (motor alanı)", () => {
    const source = readFileSync("src/lib/whatsapp-landings.ts", "utf8");
    const updateFn = sliceBetween(
      source,
      "export async function updateLanding(",
      "export async function updateCurrentUserEditableLanding(",
      "updateLanding",
    );

    expect(updateFn).not.toContain("group_score");
    expect(updateFn).not.toContain("groupScore");
  });
});
