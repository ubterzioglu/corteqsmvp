/**
 * G12 sözleşmesi — grup durum makinesi + moderasyon logu.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Durum değişiminin loglanmaması.** Kabul testi #12: her `listing_status`
 *      değişimi `group_moderation_log`'a yazılmalı. RPC'den `insert` silinirse
 *      denetim izi sessizce kaybolur — moderatör "kim, ne zaman, neden"i göremez.
 *   2. **Guard trigger'ın kalkması.** `set_group_status_v1` TEK kapı olmalı;
 *      doğrudan `update ... set listing_status` (ör. reddedilmiş grubu zorla
 *      yayınlama) trigger ile engellenir. Trigger gevşetilirse durum makinesi
 *      atlanır ve log tutulmaz.
 *   3. **Geçiş tablosunun uydurulması.** İzinli/yasak geçişler tasarım §2'den
 *      birebir gelir; `removed` kalıcıdır, `published→rejected` YOKTUR.
 *   4. **Legacy `status`'ün kırılması.** Guard yalnız `listing_status` değişince
 *      engellemeli; eski paket `status`'ü günceller → serbest kalmalı (G10c'ye dek
 *      iki sistem paralel).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002030000_group_status_machine.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, yasakladığı işlemleri ANLATIYOR (sahte eşleşmesin). */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

describe("G12 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ (drop trigger/policy meşrudur)", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });

  it("legacy `status` kolonuna dokunulmaz", () => {
    const sql = code();

    expect(sql).not.toMatch(/alter\s+table[^;]*\bstatus\b[^;]*drop/i);
  });
});

describe("G12 · moderasyon logu (kabul testi #12 zemin)", () => {
  it("tablo §4 alanlarıyla kurulur: kim · önce · sonra · not · ne zaman", () => {
    const table = sliceBetween(code(), "create table if not exists public.group_moderation_log", ");", "log tablosu");

    for (const column of [
      "landing_id",
      "from_status",
      "to_status",
      "reason",
      "note",
      "actor_uid",
      "actor_kind",
      "created_at",
    ]) {
      expect(table, column).toContain(column);
    }
    expect(table).toContain("references public.whatsapp_landings(id)");
  });

  it("actor_kind üç değerle kısıtlı: system · moderator · owner", () => {
    const table = sliceBetween(code(), "create table if not exists public.group_moderation_log", ");", "log tablosu");

    for (const kind of ["system", "moderator", "owner"]) {
      expect(table, kind).toContain(`'${kind}'`);
    }
  });

  it("log istemciye kapalı, yalnız admin okur", () => {
    const sql = code();

    expect(sql).toContain("alter table public.group_moderation_log enable row level security");
    expect(sql).toContain("revoke all on table public.group_moderation_log from anon, authenticated");
    expect(sql).toContain("public.is_admin(auth.uid())");
  });
});

describe("G12 · geçiş tablosu tasarım §2'den birebir", () => {
  const fn = () =>
    sliceBetween(
      code(),
      "create or replace function public.group_status_transition_allowed",
      "comment on function public.group_status_transition_allowed",
      "geçiş fonksiyonu",
    );

  it("izinli geçişler tabloda", () => {
    const body = fn();

    expect(body).toContain("p_from = 'pending_review' and p_to in ('published', 'rejected')");
    expect(body).toContain("p_from = 'published' and p_to in ('hidden', 'suspended')");
    expect(body).toContain("p_from = 'hidden' and p_to = 'published'");
    expect(body).toContain("p_from = 'suspended' and p_to = 'published'");
  });

  it("herhangi → removed serbest, ama removed KALICI (çıkış yok)", () => {
    const body = fn();

    expect(body).toContain("p_to = 'removed' and p_from <> 'removed'");
  });

  it("rejected ve removed TERMINAL — bu durumlardan çıkan geçiş YOK", () => {
    // Tasarım §2: rejected yalnız removed'a gider (o da `p_to='removed'` kuralıyla);
    // removed kalıcıdır. `p_from = 'rejected'` / `p_from = 'removed'` diye bir kaynak
    // geçiş olamaz. Bu kilit, tabloya kaçak kenar ekleyen mutasyonu yakalar.
    const body = fn();

    expect(body).not.toContain("p_from = 'rejected'");
    expect(body).not.toContain("p_from = 'removed'");
  });

  it("fonksiyon immutable (geçiş kuralları durağan)", () => {
    const body = fn();

    expect(body).toContain("immutable");
  });
});

describe("G12 · tek kapı set_group_status_v1", () => {
  const rpc = () =>
    sliceBetween(
      code(),
      "create or replace function public.set_group_status_v1",
      "comment on function public.set_group_status_v1",
      "RPC",
    );

  it("security definer + sabit search_path", () => {
    const body = rpc();

    expect(body).toContain("security definer");
    expect(body).toContain("set search_path = public");
  });

  it("geçiş yasallığını helper ile zorunlu kılar", () => {
    const body = rpc();

    expect(body).toContain("public.group_status_transition_allowed(v_from, p_to_status)");
    expect(body).toContain("group_illegal_transition");
  });

  it("doğrulamalar NULL-safe (SQL üç-değerli mantık tuzağı kapalı)", () => {
    // `p_reason not in (...)` NULL reason'da NULL döner → `if NULL` raise'i
    // atlardı; hidden sebepsiz geçerdi. Canlı davranış testi bunu yakaladı (N6).
    const body = rpc();

    expect(body).toContain("p_to_status is null or p_to_status not in");
    expect(body).toContain("p_reason is null or p_reason not in ('link_dead', 'reports', 'owner_request')");
  });

  it("her değişimi LOGLAR (kabul testi #12)", () => {
    const body = rpc();

    expect(body).toContain("insert into public.group_moderation_log");
    // no-op aynı durum log YAZMAMALI
    expect(body).toContain("if v_from = p_to_status then");
  });

  it("yetkisiz çağrı reddedilir; sahip yalnız kendi grubunu gizleyebilir", () => {
    const body = rpc();

    expect(body).toContain("group_forbidden");
    expect(body).toContain("public.is_admin(v_uid)");
    expect(body).toContain("v_role = 'service_role'");
    expect(body).toContain("p_reason = 'owner_request'");
  });

  it("askı süresi group_settings'ten okunur (kodda sabit YOK)", () => {
    const body = rpc();
    const sql = code();

    expect(body).toContain("public.group_setting_int('groups.suspension_days'");
    expect(sql).toContain("('groups.suspension_days', '30'::jsonb)");
  });

  it("guard'ı transaction-local bayrakla açar, sonra kapatır", () => {
    const body = rpc();

    expect(body).toContain("set_config('group_status.via_rpc', 'on', true)");
    expect(body).toContain("set_config('group_status.via_rpc', '', true)");
  });

  it("anon'a kapalı; authenticated + service_role'e açık", () => {
    const sql = code();

    expect(sql).toContain(
      "revoke all on function public.set_group_status_v1(uuid, text, text, text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.set_group_status_v1(uuid, text, text, text) to authenticated, service_role",
    );
  });
});

describe("G12 · guard trigger doğrudan update'i engeller", () => {
  const guard = () =>
    sliceBetween(
      code(),
      "create or replace function public.whatsapp_landings_guard_listing_status",
      "comment on function public.whatsapp_landings_guard_listing_status",
      "guard fonksiyonu",
    );

  it("bayrak yoksa listing_status değişimini reddeder", () => {
    const body = guard();

    expect(body).toContain("group_status_direct_update_forbidden");
    expect(body).toContain("current_setting('group_status.via_rpc', true)");
  });

  it("YALNIZ listing_status değişirse engeller — legacy `status` serbest", () => {
    const body = guard();

    expect(body).toContain("new.listing_status is distinct from old.listing_status");
  });

  it("trigger BEFORE UPDATE, her satırda", () => {
    const sql = code();

    expect(sql).toContain("create trigger trg_guard_listing_status");
    expect(sql).toContain("before update on public.whatsapp_landings");
    expect(sql).toContain("for each row execute function public.whatsapp_landings_guard_listing_status()");
  });
});
