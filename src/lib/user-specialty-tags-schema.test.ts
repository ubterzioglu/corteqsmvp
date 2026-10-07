/**
 * B5 sözleşmesi — user_specialty_tags tablosu.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Tablonun kaldırılması.** user_specialty_tags tablosu migration'da tanımlı;
 *      düşerse UI'daki uzmanlık chip'leri çalışmaz.
 *   2. **RLS politikalarının kaldırılması.** Kullanıcı yalnız kendi etiketlerini
 *      görebilir/silebilir; politika düşerse veri sızar.
 *   3. **Fonksiyonların kaldırılması.** get/add/remove fonksiyonları UI tarafından
 *      çağrılır; fonksiyon düşerse uzmanlık ekleme/çıkarma çalışmaz.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261007140000_user_specialty_tags.sql";

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

describe("B5 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("B5 · user_specialty_tags tablosu", () => {
  const table = () =>
    code().includes("create table if not exists public.user_specialty_tags")
      ? code().split("create table if not exists public.user_specialty_tags")[1].split(");")[0]
      : "";

  it("tablo tanımlı", () => {
    expect(table()).not.toBe("");
  });

  it("gerekli kolonlar: user_id, specialty_slug, specialty_label", () => {
    for (const column of ["user_id", "specialty_slug", "specialty_label"]) {
      expect(table()).toContain(column);
    }
  });

  it("UNIQUE (user_id, specialty_slug) — çift kayıt engeli", () => {
    expect(table()).toContain("unique (user_id, specialty_slug)");
  });

  it("RLS etkin", () => {
    expect(flat()).toContain("alter table public.user_specialty_tags enable row level security");
  });

  it("select: kullanıcı yalnız kendi etiketlerini veya admin", () => {
    expect(flat()).toContain("user_specialty_tags_select_own_or_admin");
    expect(flat()).toContain("user_id = auth.uid() or public.is_admin(auth.uid())");
  });

  it("insert: kullanıcı yalnız kendi etiketlerini ekleyebilir", () => {
    expect(flat()).toContain("user_specialty_tags_insert_own");
    expect(flat()).toContain("with check (user_id = auth.uid())");
  });

  it("delete: kullanıcı yalnız kendi etiketlerini silebilir", () => {
    expect(flat()).toContain("user_specialty_tags_delete_own");
  });
});

describe("B5 · yardımcı fonksiyonlar", () => {
  it("get_user_specialty_tags fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.get_user_specialty_tags(");
  });

  it("add_user_specialty_tag fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.add_user_specialty_tag(");
  });

  it("remove_user_specialty_tag fonksiyonu tanımlı", () => {
    expect(flat()).toContain("create or replace function public.remove_user_specialty_tag(");
  });

  it("fonksiyonlar authenticated'a açık", () => {
    expect(flat()).toContain("grant execute on function public.get_user_specialty_tags(uuid) to authenticated");
    expect(flat()).toContain("grant execute on function public.add_user_specialty_tag(text, text) to authenticated");
    expect(flat()).toContain("grant execute on function public.remove_user_specialty_tag(text) to authenticated");
  });

  it("add_user_specialty_tag: ON CONFLICT do nothing (çift kayıt engeli)", () => {
    expect(flat()).toContain("on conflict (user_id, specialty_slug) do nothing");
  });
});
