/**
 * G13 sözleşmesi — sahiplik doğrulama (`group_claims`) + guard v2.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Kendini doğrulama.** `Users can update own landings` politikası canlıda
 *      (ölçüldü 02.10): guard ownership'i korumazsa kullanıcı kendi satırına
 *      `ownership='verified'` yazar. Guard v2'nin düşmesi = açık kapı.
 *   2. **Doğrulama sonucunun istemciye açılması.** `group_claim_record_verification`
 *      authenticated'a grant'lanırsa kullanıcı `p_code_found=true`'yu kendi yazar.
 *      Grant'ın service_role'e ÖZGÜ kalması şart.
 *   3. **Rol ezme.** `user_role_assignments` PK=(user_id) — ölçüldü. Atama mevcut
 *      rolü ezerse Admin_SuperAdmin bir grup sahiplenince SüperAdminliği giderdi.
 *   4. **Davet linkinin sızması.** G08 kural 8: link ne claims ne reads tablosuna
 *      ne de log'a yazılır. Kolon adları bunu kilitler.
 *   5. **Eşiklerin koda sabitlenmesi.** TTL/deneme/pencere `group_settings`'ten.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002040000_group_claims.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık sızdırmayı YASAKLADIĞI linki anlatıyor. */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

/** Çok satırlı deyimleri de eşlemek için boşluk düzleştirilmiş metin. */
const flat = () => code().replace(/\s+/g, " ");

describe("G13 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });

  it("G12 guard mesajı KORUNUR (create or replace ile genişler)", () => {
    expect(code()).toContain("group_status_direct_update_forbidden");
  });
});

describe("G13 · group_claims tablosu", () => {
  const table = () =>
    sliceBetween(code(), "create table if not exists public.group_claims", ");", "claims tablosu");

  it("tasarım §4 alanları: kod · son geçerlilik · deneme · yöntem · durum", () => {
    for (const column of [
      "landing_id",
      "user_id",
      "method",
      "code",
      "code_expires_at",
      "attempt_count",
      "last_attempt_at",
      "status",
      "is_contested",
      "screenshot_path",
      "platform_name_read",
      "role_assigned",
      "role_skipped_reason",
      "reviewed_by",
      "reviewed_at",
      "review_note",
    ]) {
      expect(table(), column).toContain(column);
    }
  });

  it("kod deseni CQ+4 hane ile kısıtlı", () => {
    expect(table()).toContain("^CQ[0-9]{4}$");
  });

  it("davet linki kolonu YOK (G08 kural 8)", () => {
    expect(table()).not.toContain("whatsapp_link");
    expect(table()).not.toContain("invite_url");
  });

  it("aktif TEK kod + kullanıcı başına TEK açık talep (kısmi tekil indeksler)", () => {
    const sql = code();

    expect(sql).toContain("create unique index if not exists group_claims_one_active_code_per_group");
    expect(sql).toContain("where status = 'pending' and method = 'code'");
    expect(sql).toContain("create unique index if not exists group_claims_one_pending_per_user");
  });

  it("istemciye select kendi/admin, yazma yolu yok (RLS + revoke)", () => {
    const sql = code();

    expect(sql).toContain("alter table public.group_claims enable row level security");
    expect(sql).toContain("revoke all on table public.group_claims from anon, authenticated");
    expect(sql).toContain("user_id = auth.uid() or public.is_admin(auth.uid())");
  });
});

describe("G13 · group_invite_reads denetimi", () => {
  const table = () =>
    sliceBetween(code(), "create table if not exists public.group_invite_reads", ");", "reads tablosu");

  it("link kolonu YOK — yalnız landing_id, platform, sonuç, ad", () => {
    expect(table()).not.toContain("whatsapp_link");
    expect(table()).not.toContain("url");
    for (const column of ["landing_id", "platform", "result", "name_read", "read_at"]) {
      expect(table(), column).toContain(column);
    }
  });

  it("result G08'in üç durumu: ok · invalid · unknown", () => {
    expect(table()).toContain("'ok', 'invalid', 'unknown'");
  });

  it("istemciye tamamen kapalı", () => {
    const sql = code();

    expect(sql).toContain("alter table public.group_invite_reads enable row level security");
    expect(sql).toContain("revoke all on table public.group_invite_reads from anon, authenticated");
  });
});

describe("G13 · kod yolu RPC'leri", () => {
  const startCode = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_claim_start_code",
      "comment on function public.group_claim_start_code",
      "start_code",
    );

  it("verified grup kod yoluna KAPALI (otomatik devir yok, tasarım §3.B.6)", () => {
    expect(startCode()).toContain("group_already_verified");
  });

  it("kod CQ+4 hane, TTL group_settings'ten", () => {
    expect(startCode()).toContain("'CQ' || lpad(");
    expect(startCode()).toContain("group_setting_int('groups.claim_code_ttl_minutes'");
  });

  it("günlük talep sınırı group_settings'ten (kodda sabit yok)", () => {
    expect(startCode()).toContain("group_setting_int('groups.claim_start_daily_limit'");
    expect(flat()).toContain("('groups.claim_start_daily_limit', '10'::jsonb)");
  });

  it("record_verification YALNIZ service_role'e açık", () => {
    const sql = flat();

    expect(sql).toContain(
      "revoke all on function public.group_claim_record_verification(uuid, boolean, text, text) from public, anon, authenticated;",
    );
    expect(sql).toContain(
      "grant execute on function public.group_claim_record_verification(uuid, boolean, text, text) to service_role;",
    );
    expect(sql).not.toContain(
      "grant execute on function public.group_claim_record_verification(uuid, boolean, text, text) to authenticated",
    );
  });

  it("invalid/unknown deneme SAYMAZ (G08 kural 5) — erken dönüşler attempt mantığından önce", () => {
    const body = sliceBetween(
      code(),
      "create or replace function public.group_claim_record_verification",
      "comment on function public.group_claim_record_verification",
      "record_verification",
    );
    const invalidAt = body.indexOf("'invalid_link'");
    const attemptAt = body.indexOf("group_setting_int('groups.claim_attempt_limit'");

    expect(invalidAt).toBeGreaterThan(-1);
    expect(body).toContain("'unknown'");
    expect(attemptAt).toBeGreaterThan(-1);
    expect(invalidAt, "invalid erken dönüşü attempt sayacından ÖNCE olmalı").toBeLessThan(attemptAt);
  });

  it("deneme eşiği ve penceresi group_settings'ten", () => {
    const body = sliceBetween(
      code(),
      "create or replace function public.group_claim_record_verification",
      "comment on function public.group_claim_record_verification",
      "record_verification",
    );

    expect(body).toContain("group_setting_int('groups.claim_attempt_limit'");
    expect(body).toContain("group_setting_int('groups.claim_attempt_window_minutes'");
  });
});

describe("G13 · rol ataması mevcut rolü EZMEZ", () => {
  const applyVerified = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_claim_apply_verified",
      "comment on function public.group_claim_apply_verified",
      "apply_verified",
    );

  it("iç yardımcı dışarıdan çağrılamaz (herkesten revoke, service_role dahil)", () => {
    expect(flat()).toContain(
      "revoke all on function public.group_claim_apply_verified(uuid) from public, anon, authenticated, service_role;",
    );
  });

  it("üç platform rolü de case eşlemesinde", () => {
    for (const role of ["Community_TelegramAdmin", "Community_DiscordAdmin", "Community_WhatsAppAdmin"]) {
      expect(applyVerified(), role).toContain(role);
    }
  });

  // ⚠️ BU TEST G13 DÖNEMİNİN DAVRANIŞINI ANLATIR, CANLIYI DEĞİL.
  // K10a (`20261003090000_group_claim_role_upgrade.sql`, 03.10.2026) fonksiyonu
  // yeniden tanımladı: VARSAYILAN rol (`User_DiasporaMember`) artık YÜKSELTİLİR,
  // yalnız varsayılan dışındaki roller atlanır. Buradaki iddialar hâlâ doğrudur
  // çünkü okudukları DOSYA (20261002040000) değişmedi — ama güncel sözleşme
  // `group-claim-role-upgrade.test.ts` dosyasındadır. Oradaki "bayatlama kapanı"
  // testi, fonksiyonu yeniden tanımlayan en son migration'ı kilitler.
  it("G13 dönemi: mevcut rol varsa atlanır ve sebebi yazılır (PK user_id — tek rol)", () => {
    const body = applyVerified();

    expect(body).toContain("elsif v_has_role then");
    expect(body).toContain("role_skipped_reason");
    expect(body).toContain("ezilmedi");
  });

  it("ownership guard bayrağıyla yazılır", () => {
    const body = applyVerified();

    expect(body).toContain("set_config('group_status.via_rpc', 'on', true)");
    expect(body).toContain("ownership = 'verified'");
    expect(body).toContain("owner_user_id = v_claim.user_id");
  });
});

describe("G13 · ekran görüntüsü yolu", () => {
  it("yükleme anahtarı kullanıcının KENDİ klasöründe olmalı", () => {
    const body = sliceBetween(
      code(),
      "create or replace function public.group_claim_submit_screenshot",
      "comment on function public.group_claim_submit_screenshot",
      "submit_screenshot",
    );

    expect(body).toContain("split_part(p_screenshot_path, '/', 1) <> v_uid::text");
    expect(body).toContain("group_claim_path_forbidden");
  });

  it("verified gruba talep is_contested işaretlenir (moderatöre, devir YOK)", () => {
    const body = sliceBetween(
      code(),
      "create or replace function public.group_claim_submit_screenshot",
      "comment on function public.group_claim_submit_screenshot",
      "submit_screenshot",
    );

    expect(body).toContain("v_contested := (v_ownership = 'verified')");
  });

  it("moderatör kararı is_admin kapılı, approve/reject", () => {
    const body = sliceBetween(
      code(),
      "create or replace function public.admin_review_group_claim",
      "comment on function public.admin_review_group_claim",
      "admin_review",
    );

    expect(body).toContain("public.is_admin(v_uid)");
    expect(body).toContain("group_claim_forbidden");
    expect(body).toContain("'approve', 'reject'");
    expect(body).toContain("public.group_claim_apply_verified(p_claim_id)");
  });

  it("kova PRIVATE, boyut/MIME sınırlı, yükleme kendi klasörüne", () => {
    const sql = flat();

    expect(sql).toContain("'group-claim-screenshots', false, 10485760");
    expect(sql).toContain("array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']");
    expect(sql).not.toContain("'application/octet-stream'");

    const upload = sliceBetween(code(), 'create policy "group claim screenshots upload"', ";", "upload politika");
    expect(upload).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(upload).toContain("screenshot-");
  });

  it("silme yalnız admin (kanıt korunur)", () => {
    const del = sliceBetween(
      code(),
      'create policy "group claim screenshots admin delete"',
      ";",
      "delete politika",
    );

    expect(del).toContain("public.is_admin(auth.uid())");
  });
});

describe("G13 · guard v2 — ownership + motor alanları", () => {
  const guard = () =>
    sliceBetween(
      code(),
      "create or replace function public.whatsapp_landings_guard_listing_status",
      "comment on function public.whatsapp_landings_guard_listing_status",
      "guard v2",
    );

  it("ownership/owner_user_id doğrudan yazıma KAPALI (kendini doğrulama kapatıldı)", () => {
    const body = guard();

    expect(body).toContain("new.ownership is distinct from old.ownership");
    expect(body).toContain("new.owner_user_id is distinct from old.owner_user_id");
    expect(body).toContain("group_ownership_direct_update_forbidden");
  });

  it("motor sayaçları doğrudan yazıma KAPALI", () => {
    const body = guard();

    expect(body).toContain("group_engine_field_direct_update_forbidden");
    for (const field of [
      "new.hidden_reason",
      "new.submitted_as_admin",
      "new.review_flags",
      "new.strike_count",
      "new.link_fail_count",
      "new.link_checked_at",
      "new.invite_code",
      "new.platform",
      "new.suspended_until",
      "new.owner_renewal_due",
      "new.published_at",
    ]) {
      expect(body, field).toContain(field);
    }
  });

  it("legacy/içerik alanları SERBEST kalmaya devam eder", () => {
    const body = guard();

    expect(body).not.toContain("new.status");
    expect(body).not.toContain("new.tagline");
    expect(body).not.toContain("new.group_name");
    expect(body).not.toContain("new.description");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// K10a (03.10.2026) — sahiplik doğrulanınca VARSAYILAN rolün yükseltilmesi.
// Ayrı dosyaya konmadı: ajan araç kataloğu `src/lib/**` altındaki her yeni
// dosyayı girdi sayıyor ve `ingest:tools:check` CI'da koşuyor; aynı ailenin
// sözleşmesini tek dosyada tutmak hem kataloğu hem okuyucuyu sadeleştiriyor.
// ─────────────────────────────────────────────────────────────────────────────

const K10A_MIGRATION = "20261003090000_group_claim_role_upgrade.sql";
const K10A_APPLIED_DIR = "supabase/migrations/applied";
const K10A_REDEFINE_ANCHOR = "create or replace function public.group_claim_apply_verified";

const k10aMigrationSql = () => {
  const candidates = [`${K10A_APPLIED_DIR}/${K10A_MIGRATION}`, `supabase/migrations/${K10A_MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${K10A_MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorum satırları atılır: iddia GÖVDEYİ tutmalı, açıklamayı değil. */
const k10aCode = () =>
  k10aMigrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const k10aApplyVerified = () =>
  sliceBetween(
    k10aCode(),
    K10A_REDEFINE_ANCHOR,
    "comment on function public.group_claim_apply_verified",
    "k10a_apply_verified",
  );

describe("K10a · varsayılan rol yükseltilir", () => {
  it("yükseltme dalı VARDIR ve gerçek bir UPDATE yapar", () => {
    const body = k10aApplyVerified();
    const branch = sliceBetween(body, "c_default_role_key then", "elsif v_has_role then", "yükseltme dalı");

    expect(branch).toContain("update public.user_role_assignments");
    expect(branch).toContain("set role_id = v_role_id");
    // Yeni satır EKLEMEZ: PK (user_id) tek rol modelidir.
    expect(branch).not.toContain("insert into public.user_role_assignments");
  });

  it("yükseltme YALNIZ varsayılan role açıktır — diğer roller korunur", () => {
    const body = k10aApplyVerified();

    // Koşulsuz `elsif v_has_role then` yükseltmeye BAĞLANAMAZ: o dal atlama dalıdır.
    expect(body).toContain("elsif v_has_role and v_existing_role_key = c_default_role_key then");

    const skip = sliceBetween(body, "elsif v_has_role then", "else", "atlama dalı");
    expect(skip).toContain("role_assigned = false");
    expect(skip).toContain("role_skipped_reason");
    expect(skip).not.toContain("update public.user_role_assignments");
  });

  it("varsayılan rol anahtarı signup trigger'ının atadığı rolle aynıdır", () => {
    // Kayarsa yükseltme sessizce hiç çalışmaz — hata vermez, sadece olmaz.
    expect(k10aApplyVerified()).toContain("c_default_role_key constant text := 'User_DiasporaMember';");
  });

  it("yükseltmede updated_at tazelenir (tabloda bunu yapan trigger YOK)", () => {
    const branch = sliceBetween(k10aApplyVerified(), "c_default_role_key then", "elsif v_has_role then", "yükseltme dalı");
    expect(branch).toContain("updated_at = now()");
  });

  it("hedef rol yoksa EN ÖNCE elenir — yanlış rol atanamaz", () => {
    const body = k10aApplyVerified();
    const nullCheck = body.indexOf("if v_role_id is null then");
    const upgrade = body.indexOf("c_default_role_key then");

    expect(nullCheck).toBeGreaterThan(-1);
    expect(upgrade).toBeGreaterThan(-1);
    expect(nullCheck).toBeLessThan(upgrade);
  });

  it("G13'ün kapalı grant matrisi ve ownership guard'ı AYNEN korunur", () => {
    const body = k10aApplyVerified();

    expect(body).toContain("set_config('group_status.via_rpc', 'on', true)");
    expect(body).toContain("ownership = 'verified'");
    expect(k10aCode()).toContain(
      "revoke all on function public.group_claim_apply_verified(uuid)\n  from public, anon, authenticated, service_role;",
    );
  });

  it("üç platform rolü eşlemesi bozulmadı", () => {
    for (const role of ["Community_TelegramAdmin", "Community_DiscordAdmin", "Community_WhatsAppAdmin"]) {
      expect(k10aApplyVerified(), role).toContain(role);
    }
  });
});

describe("K10a · bayatlama kapanı", () => {
  it("fonksiyonu yeniden tanımlayan EN SON migration bu dosyadır", () => {
    const redefiners = readdirSync(K10A_APPLIED_DIR)
      .filter((file) => file.endsWith(".sql"))
      .filter((file) => readFileSync(`${K10A_APPLIED_DIR}/${file}`, "utf8").includes(K10A_REDEFINE_ANCHOR))
      .sort();

    expect(redefiners.length).toBeGreaterThanOrEqual(2); // G13 + K10a
    // Yeni bir redefine eklenirse BU test düşer ve sözleşmenin güncellenmesini zorlar.
    expect(redefiners.at(-1)).toBe(K10A_MIGRATION);
  });
});
