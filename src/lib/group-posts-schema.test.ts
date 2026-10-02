/**
 * G16 sözleşmesi — grup sayfası gönderileri (`group_posts`) + moderasyon.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **İlk durum tablosunun kayması.** Tasarım §3.D'deki 4 yazan sınıfı
 *      (verified admin → published · güvenilir üye → published · sahipli grupta
 *      diğer → pending_group_admin · sahipsizde → pending_platform) moderasyon
 *      yükünün tamamını belirler; bir dalın düşmesi her gönderiyi yanlış kuyruğa atar.
 *   2. **48 saat eskalasyonunun kopması.** `escalate_at` doldurulmaz ya da
 *      `group_posts_escalate_due` yanlış durumu taşır ise sahipli grup kuyruğu
 *      sessizce çürür (kabul #7).
 *   3. **İstemciye yazma yolu açılması.** group_posts'a INSERT/UPDATE/DELETE
 *      grant'ı veya politikası eklenirse herkes kendi gönderisini yayınlayabilir.
 *   4. **Yetki uydurulması.** Sahibe tasarımda OLMAYAN yetki (published kaldırma,
 *      platform kuyruğu) verilmesi — matris kilitli.
 *   5. **G14'ten önce şema uydurulması.** Güvenilir üye helper'ı var olmayan
 *      `group_reports`'a BAKAMAZ (ölçüldü: tablo yok); G14 genişletirken bu testi
 *      bilinçli güncelleyecek.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002060000_group_posts.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, YASAKLADIĞI yetkileri anlatıyor (sahte eşleşmesin). */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

describe("G16 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("G16 · group_posts tablosu", () => {
  const table = () =>
    sliceBetween(code(), "create table if not exists public.group_posts", ");", "posts tablosu");

  it("alanlar tam: durum · eskalasyon saati · moderasyon izi", () => {
    for (const column of [
      "landing_id",
      "author_user_id",
      "body",
      "post_status",
      "escalate_at",
      "reviewed_by",
      "reviewed_at",
      "review_note",
      "created_at",
      "updated_at",
    ]) {
      expect(table(), column).toContain(column);
    }
  });

  it("post_status §3.D'deki beş değer", () => {
    expect(table()).toContain(
      "'published', 'pending_group_admin', 'pending_platform', 'rejected', 'removed'",
    );
  });

  it("eskalasyon cron'u için kısmi indeks (kabul #7 zemini)", () => {
    const sql = code();

    expect(sql).toContain("group_posts_escalate_idx");
    expect(sql).toContain("where post_status = 'pending_group_admin'");
  });

  it("güvenilir üye sayımı için kısmi indeks", () => {
    const sql = code();

    expect(sql).toContain("group_posts_author_idx");
  });
});

describe("G16 · istemciye yazma yolu YOK", () => {
  it("grant yalnız select; insert/update/delete grant'ı yok", () => {
    const sql = flat();

    expect(sql).toContain("revoke all on table public.group_posts from anon, authenticated;");
    expect(sql).toContain("grant select on table public.group_posts to anon, authenticated;");
    expect(sql).not.toContain("grant insert");
    expect(sql).not.toContain("grant update");
    expect(sql).not.toContain("grant delete");
  });

  it("group_posts'a insert/update/delete POLİTİKASI yok (yalnız select)", () => {
    expect(code()).not.toMatch(/create policy[^;]*on public\.group_posts[^;]*for (insert|update|delete)/i);
  });

  it("select görünürlüğü dört dal: published+published · yazar · admin · sahip kuyruğu", () => {
    const policy = sliceBetween(
      code(),
      "create policy group_posts_select_visible",
      ";",
      "select politika",
    );

    expect(policy).toContain("post_status = 'published'");
    expect(policy).toContain("w.listing_status = 'published'");
    expect(policy).toContain("author_user_id = auth.uid()");
    expect(policy).toContain("public.is_admin(auth.uid())");
    expect(policy).toContain("w.owner_user_id = auth.uid()");
  });
});

describe("G16 · eşikler group_settings'ten", () => {
  it("48 saat ve teknik tavan seed edilir", () => {
    const sql = flat();

    expect(sql).toContain("('groups.post_escalation_hours', '48'::jsonb)");
    expect(sql).toContain("('groups.post_max_chars', '10000'::jsonb)");
  });

  it("create RPC ikisini de ayarlardan okur", () => {
    const rpc = sliceBetween(
      code(),
      "create or replace function public.group_post_create",
      "comment on function public.group_post_create",
      "post_create",
    );

    expect(rpc).toContain("group_setting_int('groups.post_max_chars'");
    expect(rpc).toContain("group_setting_int('groups.post_escalation_hours'");
  });
});

describe("G16 · güvenilir üye (grup bazlı)", () => {
  const trusted = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_member_is_trusted",
      "comment on function public.group_member_is_trusted",
      "trusted helper",
    );

  it("eşik group_settings'ten, sayım O GRUBUN published gönderilerinden", () => {
    expect(trusted()).toContain("group_setting_int('groups.trusted_member_min_approved_posts'");
    expect(trusted()).toContain("post_status = 'published'");
  });

  it("G14'ten önce group_reports'a BAKAMAZ (şema uydurma yasağı)", () => {
    expect(trusted()).not.toContain("group_reports");
  });

  it("authenticated'a açık, anon'a kapalı (rozet gösterimi)", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_member_is_trusted(uuid, uuid) to authenticated;",
    );
  });
});

describe("G16 · ilk durum tablosu (tasarım §3.D)", () => {
  const rpc = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_post_create",
      "comment on function public.group_post_create",
      "post_create",
    );

  it("verified admin → published", () => {
    expect(rpc()).toContain("if v_ownership = 'verified' and v_owner = v_uid then");
  });

  it("güvenilir üye → published (sonradan denetlenir)", () => {
    expect(rpc()).toContain("v_trusted := public.group_member_is_trusted(p_landing_id, v_uid)");
    expect(rpc()).toContain("if v_trusted then");
  });

  it("sahipli grupta diğer → pending_group_admin + escalate_at dolu", () => {
    const body = rpc();

    expect(body).toContain("v_initial := 'pending_group_admin'");
    expect(body).toContain("make_interval(");
  });

  it("sahipsiz grupta → pending_platform", () => {
    expect(rpc()).toContain("v_initial := 'pending_platform'");
  });

  it("yalnız published gruba gönderi açılır", () => {
    expect(rpc()).toContain("group_not_published");
  });

  it("anonim yazamaz; boş/uzun gövde reddedilir", () => {
    const body = rpc();

    expect(body).toContain("group_post_auth_required");
    expect(body).toContain("group_post_body_required");
    expect(body).toContain("group_post_too_long");
  });
});

describe("G16 · moderasyon yetki matrisi (uydurma yetki YOK)", () => {
  const rpc = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_post_review",
      "comment on function public.group_post_review",
      "post_review",
    );

  it("kararlar approve/reject/remove ile sınırlı", () => {
    expect(rpc()).toContain("'approve', 'reject', 'remove'");
    expect(rpc()).toContain("group_post_invalid_decision");
  });

  it("remove yalnız published'a ve YALNIZ admin'e açık", () => {
    const body = rpc();

    expect(body).toContain("if p_decision = 'remove' then");
    expect(body).toContain("v_post.post_status <> 'published'");
    expect(body).toContain("if not v_is_admin then");
    expect(body).toContain("group_post_invalid_transition");
  });

  it("pending_platform yalnız admin; pending_group_admin sahip VEYA admin", () => {
    const body = rpc();

    expect(body).toContain("v_post.post_status = 'pending_platform' and not v_is_admin");
    expect(body).toContain("v_post.post_status = 'pending_group_admin' and not (v_is_admin or v_is_owner)");
    expect(body).toContain("group_post_forbidden");
  });

  it("onaylanan gönderide escalate_at temizlenir", () => {
    expect(rpc()).toContain("escalate_at = null");
  });
});

describe("G16 · 48 saat eskalasyonu (kabul #7)", () => {
  const fn = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_posts_escalate_due",
      "comment on function public.group_posts_escalate_due",
      "escalate_due",
    );

  it("yalnız süresi dolan pending_group_admin'ı taşır", () => {
    const body = fn();

    expect(body).toContain("post_status = 'pending_group_admin'");
    expect(body).toContain("escalate_at <= now()");
    expect(body).toContain("'pending_platform'");
  });

  it("YALNIZ service_role çağırabilir (cron G22)", () => {
    const sql = flat();

    expect(sql).toContain(
      "revoke all on function public.group_posts_escalate_due() from public, anon, authenticated;",
    );
    expect(sql).toContain("grant execute on function public.group_posts_escalate_due() to service_role;");
  });
});
