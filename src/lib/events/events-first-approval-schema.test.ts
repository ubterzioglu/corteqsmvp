/**
 * M02 sözleşmesi — etkinlik ilk-onay kuralı (`create_event_v1` + `event_settings`).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **T1'in RPC yakası:** ilk-onay kuralı İSTEMCİDE yazılırsa kural hiç var
 *      olmamış olur (plan ölçümü: PostgREST'e doğrudan status='published' POST
 *      onayı atlıyor). Kuralın SQL'de, security definer TEK kapıda olduğu burada
 *      kilitli; M03 doğrudan yazımı da kapatacak.
 *   2. **Eşiklerin koda sabitlenmesi** (G09 doktrini): aktif limit + bireysel rol
 *      anahtarı `event_settings`'ten okunmalı.
 *   3. **user_id'nin istemciden alınması** — RPC auth.uid() dışındaki bir kaynağı
 *      parametre olarak kabul ederse başkası adına etkinlik açılır.
 *   4. **Onay kuyruğu satırının düşmesi** — pending etkinlik approval_requests'e
 *      yazılmazsa admin paneli boş kalır, etkinlik sonsuza dek bekler.
 *   5. **Limitin errcode'suz raise'i** — istemci `event_active_limit`'i P0001
 *      üzerinden ayırt ediyor (M05 hata haritası).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261003010000_events_first_approval.sql";

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

const rpc = () =>
  sliceBetween(
    code(),
    "create or replace function public.create_event_v1",
    "comment on function public.create_event_v1",
    "create_event_v1",
  );

describe("M02 · salt ekleme", () => {
  it("kolon/tablo DÜŞÜRÜLMEZ; approval_requests CHECK'ine dokunulmaz", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    // 'event_create' zaten CHECK'te vardı (ölçüldü) — migration CHECK'i değiştirmez
    expect(sql).not.toContain("approval_requests_request_type_check");
  });

  it("approval_source eklenir + ('auto','admin') CHECK'i", () => {
    const sql = code();

    expect(sql).toContain("add column if not exists approval_source text");
    expect(sql).toContain("check (approval_source in ('auto', 'admin'))");
  });
});

describe("M02 · event_settings — eşikler ayarlardan (G09 doktrini)", () => {
  it("tablo RLS'li ve istemciye KAPALI; iki anahtar seed edilir", () => {
    const sql = code();

    expect(sql).toContain("create table if not exists public.event_settings");
    expect(sql).toContain("alter table public.event_settings enable row level security");
    expect(sql).toContain("revoke all on table public.event_settings from public, anon, authenticated");
    expect(sql).toContain("('events.active_limit', '2'::jsonb)");
    expect(sql).toContain("('events.first_approval_bireysel_key', '\"User_DiasporaMember\"'::jsonb)");
  });

  it("RPC limit + rol anahtarını AYARLARDAN okur (kodda sabit yok)", () => {
    const fn = rpc();

    expect(fn).toContain("event_setting_int('events.active_limit'");
    expect(fn).toContain("event_setting_text('events.first_approval_bireysel_key'");
    // Limit karşılaştırması sabit "2" ile DEĞİL ayar değeriyle:
    expect(fn).not.toMatch(/v_active\s*>=\s*2\b/);
  });
});

describe("M02 · create_event_v1 — ilk-onay kuralı SQL'de", () => {
  it("user_id YALNIZ auth.uid() — istemciden kullanıcı parametresi YOK", () => {
    const fn = rpc();

    expect(fn).toContain("v_uid uuid := auth.uid()");
    expect(fn).not.toContain("p_user_id");
    expect(fn).toContain("v_uid, btrim(p_title)");
    // İmzada uuid kullanıcı parametresi yok (ilk parametre başlık):
    expect(fn).toContain("p_title text,");
  });

  it("pending dalı approval_requests satırı YAZAR (event_create + target)", () => {
    const fn = rpc();

    // ⚠️ M2 mutasyon dersi (G21/G24 ile aynı sınıf): metin kilidi tek başına
    // yetmez — `if false then` içine gömülen insert de bu metinleri taşır.
    // KOŞUL da kilitlenir:
    expect(fn).toContain("if v_status = 'pending' then");
    expect(fn).toContain("'event_create'");
    expect(fn).toContain("'pending', 'event', v_id");
    expect(fn).toContain("jsonb_build_object('event_id', v_id, 'title', btrim(p_title))");
    // insert, koşula BAĞLI olmalı (koşul bloğu insert'i sarmalı)
    expect(fn.indexOf("if v_status = 'pending' then")).toBeLessThan(fn.indexOf("'event_create'"));
  });

  it("auto dalı published + approval_source='auto'; pending'de source NULL", () => {
    const fn = rpc();

    expect(fn).toContain("v_status := case when v_auto then 'published' else 'pending' end");
    expect(fn).toContain("case when v_auto then 'auto' else null end");
    expect(fn).toContain("v_auto := (not v_bireysel) or v_has_prior;");
    expect(fn).toContain("status = 'published'");
  });

  it("limit: insert'ten ÖNCE, P0001 + 'event_active_limit', yalnız gelecektekiler", () => {
    const fn = rpc();

    expect(fn).toContain("raise exception 'event_active_limit' using errcode = 'P0001'");
    expect(fn).toContain("event_date >= current_date");
    expect(fn.indexOf("event_active_limit")).toBeLessThan(fn.indexOf("insert into public.events"));
  });

  it("alan doğrulaması + grant yalnız authenticated", () => {
    expect(rpc()).toContain("raise exception 'event_field_required'");
    expect(flat()).toMatch(/grant execute on function public\.create_event_v1\([^)]*\) to authenticated;/);
  });

  it("security definer (kural istemciye emanet değil)", () => {
    const block = sliceBetween(
      code(),
      "create or replace function public.create_event_v1",
      "as $$",
      "create_event_v1 başlık",
    );

    expect(block).toContain("security definer");
  });
});
