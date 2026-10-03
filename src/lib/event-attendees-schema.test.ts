/**
 * M04 sözleşmesi — `event_attendees` + join/leave/sayaç RPC'leri.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Kapasite kontrolünün istemciye kayması / kilitsiz SQL.** Plan notu:
 *      "max_attendees kontrolü SQL'de (istemcide yarış olur)" — eşzamanlı iki
 *      join aynı anda sayarsa kapak aşılır. `for update` kilidi + SQL sayımı
 *      burada kilitli.
 *   2. **Katılımcı satırlarının istemciye açılması.** Sayaç AGGREGATE RPC ile
 *      gider; anon'a satır değil sayı görünür (mahremiyet yüzeyi).
 *   3. **İptalin satır SİLMESİ** — denetim izi kaybolur, yeniden katılım
 *      "ilk katılım" gibi görünür. leave yalnız `cancelled` yapar.
 *   4. **published-olmayan etkinliğe katılım** (onay kuyruğunu dolanır).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261003030000_event_attendees.sql";

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

const fn = (fnName: string, signature: string) =>
  sliceBetween(
    code(),
    `create or replace function public.${fnName}(${signature}`,
    `comment on function public.${fnName}(`,
    fnName,
  );

describe("M04 · tablo şekli", () => {
  it("(event_id,user_id) PK + status check + cascade", () => {
    const table = sliceBetween(code(), "create table if not exists public.event_attendees", ");", "tablo");

    expect(table).toContain("primary key (event_id, user_id)");
    expect(table).toContain("check (status in ('going', 'cancelled'))");
    expect(table).toContain("references public.events(id) on delete cascade");
    expect(table).toContain("references auth.users(id) on delete cascade");
  });

  it("RLS + dört politika: okuma sahip/admin/kendi, yazma yalnız kendi", () => {
    const sql = code();

    expect(sql).toContain("alter table public.event_attendees enable row level security");
    for (const policy of [
      "event_attendees_select_own_owner",
      "event_attendees_insert_own",
      "event_attendees_update_own",
      "event_attendees_delete_own",
    ]) {
      expect(sql, policy).toContain(`create policy ${policy} on public.event_attendees`);
    }
    expect(sql).toContain("with check (user_id = auth.uid() and status = 'going')");
  });
});

describe("M04 · sayaç aggregate RPC (satır değil sayı)", () => {
  it("jsonb döner — katılımcı listesi DÖNMEZ; anon okuyabilir", () => {
    const count = fn("event_attendee_count", "p_event_id uuid");

    expect(count).not.toContain("return query");
    expect(count).toContain("count(*)");
    expect(count).toContain("'viewer_status', v_status");
    expect(flat()).toContain(
      "grant execute on function public.event_attendee_count(uuid) to anon, authenticated;",
    );
  });
});

describe("M04 · join_event_v1 — kapasite SQL'de ve KİLİTLİ", () => {
  it("etkinlik satırı for update ile alınır (yarış durumu kilidi)", () => {
    const join = fn("join_event_v1", "p_event_id uuid");

    expect(join).toContain("for update;");
  });

  it("yalnız published + olmayan etkinlik event_not_found", () => {
    const join = fn("join_event_v1", "p_event_id uuid");

    expect(join).toContain("v_event.status <> 'published'");
    expect(join).toContain("raise exception 'event_not_published'");
    expect(join).toContain("raise exception 'event_not_found'");
  });

  it("kapak SQL'de: max_attendees + going sayımı + P0001", () => {
    const join = fn("join_event_v1", "p_event_id uuid");

    expect(join).toContain("v_event.max_attendees is not null and v_count > v_event.max_attendees");
    expect(join).toContain("raise exception 'event_attendee_limit' using errcode = 'P0001'");
    expect(join).not.toContain("p_max_attendees");
  });

  it("yeniden katılım upsert (iptal satırı canlanır)", () => {
    const join = fn("join_event_v1", "p_event_id uuid");

    expect(join).toContain("on conflict (event_id, user_id) do update");
    expect(join).toContain("set status = 'going', updated_at = now()");
  });

  it("grant yalnız authenticated", () => {
    expect(flat()).toContain(
      "grant execute on function public.join_event_v1(uuid) to authenticated;",
    );
  });
});

describe("M04 · leave_event_v1 — satır SİLİNMEZ", () => {
  it("cancelled'a çevirir; DELETE YOK; katılmamış → not_joined", () => {
    const leave = fn("leave_event_v1", "p_event_id uuid");

    expect(leave).toContain("set status = 'cancelled', updated_at = now()");
    expect(leave).not.toMatch(/delete from public\.event_attendees/i);
    expect(leave).toContain("raise exception 'event_attendee_not_joined'");
    expect(leave).toContain("and status = 'going'");
  });
});

describe("M04 · salt ekleme", () => {
  it("mevcut tablo/fonksiyon/politika DEĞİŞMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toContain("create or replace function public.create_event_v1");
    expect(sql).not.toContain("drop policy if exists \"Users can");
  });
});
