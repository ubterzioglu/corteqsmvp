/**
 * M03 sözleşmesi — T1 kapanışı (RLS status zorlaması + events_guard_status).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **T1'in geri açılması.** INSERT politikasındaki `status = 'pending'`
 *      koşulu düşerse doğrudan PostgREST insert'i yeniden 'published' açabilir
 *      (30.09 ölçümü: onay tamamen atlanıyordu).
 *   2. **Trigger'ın delinmesi.** RLS UPDATE'te eski satırı göremez — status
 *      korumasının TEK gerçek yolu trigger. raise/bayrak/admin üçlüsünden biri
 *      düşerse koruma sessizce kalkar.
 *   3. **approval_source'un korunmaması** — kullanıcı kendi kaydına 'auto'
 *      basıp onaylı görüntüsü verebilir.
 *   4. **İçerik düzenlemenin kazara bloklanması** — guard yalnız status/source
 *      değişimine bakmalı; başlık/tarih düzenlemesi serbest kalmalı.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261003020000_events_rls_status_guard.sql";

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

const guard = () =>
  sliceBetween(
    code(),
    "create or replace function public.events_guard_status",
    "comment on function public.events_guard_status",
    "events_guard_status",
  );

describe("M03 · INSERT politikası status='pending' zorlar (T1 birinci katman)", () => {
  it("politika aynı adla YENİDEN yaratılır ve status koşulu taşır", () => {
    const sql = code();

    expect(sql).toContain('drop policy if exists "Users can create own events" on public.events;');
    expect(sql).toContain('create policy "Users can create own events" on public.events');
    expect(sql).toContain("with check (auth.uid() = user_id and status = 'pending')");
  });

  it("create_event_v1'in auto-publish yolu ETKİLENMEZ (RPC security definer — M02 kilidi)", () => {
    // Bu migration RPC'yi YENİDEN TANIMLAMAZ; M02'deki security definer kalır
    // (tablo sahibi RLS'i bypass eder).
    expect(code()).not.toContain("create or replace function public.create_event_v1");
  });
});

describe("M03 · events_guard_status (T1 ikinci katman — UPDATE)", () => {
  it("status VE approval_source değişimi raise üretir", () => {
    const fn = guard();

    expect(fn).toContain("new.status is distinct from old.status");
    expect(fn).toContain("new.approval_source is distinct from old.approval_source");
    expect(fn).toContain("raise exception 'event_status_direct_update_forbidden'");
  });

  it("üç muafiyet: via_rpc bayrağı · is_admin · service_role", () => {
    const fn = guard();

    expect(fn).toContain("current_setting('event_status.via_rpc', true)");
    expect(fn).toContain("public.is_admin(auth.uid())");
    expect(fn).toContain("auth.role() = 'service_role'");
  });

  it("içerik alanları SERBEST — guard yalnız iki kolona bakar", () => {
    const fn = guard();

    // Fonksiyonda status/approval_source dışında kolon karşılaştırması YOK:
    expect(fn).not.toContain("new.title");
    expect(fn).not.toContain("new.event_date");
    expect(fn).not.toContain("new.description");
    expect(fn).toContain("return new;");
  });

  it("trigger BEFORE UPDATE FOR EACH ROW bağlanır", () => {
    const sql = code();

    expect(sql).toContain("create trigger trg_events_guard_status");
    expect(sql).toContain("before update on public.events");
    expect(sql).toContain("for each row execute function public.events_guard_status()");
  });
});

describe("M03 · salt ekleme", () => {
  it("kolon/tablo düşürmez; tek drop aynı adla geri yaratılan politika", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    const policyDrops = sql.match(/drop policy/gi) ?? [];
    expect(policyDrops).toHaveLength(1);
  });
});
