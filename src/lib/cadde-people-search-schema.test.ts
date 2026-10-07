/**
 * M38 sözleşmesi — search_cadde_people_v1 Admin/Moderator dışlama koruması.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Admin/Moderator arama sonuçlarında görünür.** Fonksiyon gövdesinde
 *      `not exists (select 1 from user_role_assignments ... where key ilike 'Admin_%'
 *      or key ilike 'Moderator_%')` koruması var; bu kod silinirse admin/moderatör
 *      kullanıcıları "İnsanları Keşfet" aramasında görünür olur (KVKK + güvenlik).
 *   2. **2 karakterden kısa sorgu tüm listeyi döker.** `char_length(v_query) < 2`
 *      kontrolü enumeration koruması; kaldırılırsa tek karakterlik sorgu tüm üyeleri
 *      dökebilir.
 *   3. **Anon kullanıcı arama yapabilir.** `auth.uid() is null` kontrolü fonksiyonun
 *      başında; kaldırılırsa oturumsuz kullanıcı arama yapabilir.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20260802100000_cadde_people_search.sql";

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
    .join("\n")
    .toLowerCase();

const flat = () => code().replace(/\s+/g, " ");

describe("M38 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("M38 · search_cadde_people_v1 güvenlik korumaları", () => {
  const fn = () =>
    code().includes("create or replace function public.search_cadde_people_v1")
      ? code().split("create or replace function public.search_cadde_people_v1")[1]
      : "";

  it("fonksiyon tanımlı", () => {
    expect(fn()).not.toBe("");
  });

  it("SECURITY DEFINER (auth.users RLS'i bypass eder)", () => {
    expect(fn()).toContain("security definer");
  });

  it("auth zorunlu: auth.uid() is null kontrolü", () => {
    expect(fn()).toContain("auth.uid() is null");
    expect(fn()).toContain("raise exception 'authentication required'");
  });

  it("2 karakterden kısa sorgu engellenir (enumeration koruması)", () => {
    expect(fn()).toContain("char_length(v_query) < 2");
    expect(fn()).toContain("return;");
  });

  it("Admin/Moderator rol sahipleri DIŞLANIR (KVKK + güvenlik)", () => {
    const body = fn();

    // Koruma: not exists (select 1 from user_role_assignments ... where key ilike 'admin_%' or 'moderator_%')
    expect(body).toContain("not exists");
    expect(body).toContain("user_role_assignments");
    expect(body).toContain("admin_%");
    expect(body).toContain("moderator_%");
  });

  it("Admin/Moderator dışlama koruması otomatik taşınmaz (açıkça kopyalanır)", () => {
    // 20260730220000'daki dizin korumasının birebir kopyası olmalı
    // (denetçi: koruma otomatik taşınmaz, açıkça kopyalanır)
    const body = fn();

    // r_x.key ilike 'admin_%' or r_x.key ilike 'moderator_%' deseni
    expect(body).toMatch(/r_x\.key\s+ilike\s+'admin_%'/);
    expect(body).toMatch(/r_x\.key\s+ilike\s+'moderator_%'/);
  });
});

describe("M38 · yetki kontrolü", () => {
  it("anon'a grant YOK (yalnız authenticated + service_role)", () => {
    expect(flat()).toContain("revoke all on function public.search_cadde_people_v1(text, integer) from public, anon");
    expect(flat()).toContain("grant execute on function public.search_cadde_people_v1(text, integer) to authenticated, service_role");
  });
});
