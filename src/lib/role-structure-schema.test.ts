/**
 * B4 sözleşmesi — role_structure tablosu.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Tablonun kaldırılması.** role_structure tablosu migration'da tanımlı;
 *      düşerse UI'daki 3 adımlı seçici çalışmaz.
 *   2. **Seed'in eksik olması.** 259 satır Excel'den seed edilir; eksik satır
 *      varsa UI'da rol görünmez.
 *   3. **Fonksiyonların kaldırılması.** get_role_structure, get_ana_roller
 *      UI tarafından çağrılır; fonksiyon düşerse seçici çalışmaz.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261007130000_role_structure_table.sql";
const SEED = "20261007130000_role_structure_seed.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const seedSql = () => {
  const candidates = [`supabase/migrations/applied/${SEED}`, `supabase/migrations/${SEED}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${SEED} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

describe("B4 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("B4 · role_structure tablosu", () => {
  const table = () =>
    code().includes("create table if not exists public.role_structure")
      ? code().split("create table if not exists public.role_structure")[1].split(");")[0]
      : "";

  it("tablo tanımlı", () => {
    expect(table()).not.toBe("");
  });

  it("gerekli kolonlar: ana_rol, alt_rol, uzmanlik, yeni_kod, durum", () => {
    for (const column of ["ana_rol", "alt_rol", "uzmanlik", "yeni_kod", "durum"]) {
      expect(table()).toContain(column);
    }
  });

  it("yeni_kod UNIQUE (çift kayıt engeli)", () => {
    expect(table()).toContain("unique");
  });

  it("durum CHECK: onaylandi veya oneri", () => {
    expect(table()).toContain("check (durum in ('onaylandi', 'oneri'))");
  });

  it("RLS etkin, authenticated select", () => {
    expect(flat()).toContain("alter table public.role_structure enable row level security");
    expect(flat()).toContain("grant select on table public.role_structure to authenticated");
  });
});

describe("B4 · yardımcı fonksiyonlar", () => {
  it("get_role_structure fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.get_role_structure()");
  });

  it("get_ana_roller fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.get_ana_roller()");
  });

  it("get_role_structure_by_ana_rol fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.get_role_structure_by_ana_rol(p_ana_rol text)");
  });

  it("fonksiyonlar authenticated'a açık", () => {
    expect(flat()).toContain("grant execute on function public.get_role_structure() to authenticated");
    expect(flat()).toContain("grant execute on function public.get_ana_roller() to authenticated");
  });
});

describe("B4 · seed (Excel'den)", () => {
  it("seed SQL dosyası var", () => {
    const sql = seedSql();
    expect(sql).toContain("insert into public.role_structure");
  });

  it("259 satır seed edilir", () => {
    const sql = seedSql();
    const inserts = (sql.match(/insert into public\.role_structure/g) || []).length;
    expect(inserts).toBe(259);
  });

  it("7 ana rol seed edilir", () => {
    const sql = seedSql();
    const anaRoller = new Set<string>();
    for (const match of sql.matchAll(/values\s*\('([^']+)',/g)) {
      anaRoller.add(match[1]);
    }
    expect(anaRoller.size).toBe(7);
  });
});
