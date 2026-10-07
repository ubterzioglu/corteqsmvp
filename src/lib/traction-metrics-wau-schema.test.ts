/**
 * M14 sözleşmesi — metrics_weekly_active_users view (WAU tanımı).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **WAU tanımı değişir.** View gövdesinde "son 7 gün aktif (giriş VEYA içerik)"
 *      tanımı var; bu değişirse traction panosu yanlış sayı gösterir.
 *   2. **Admin guard kaldırılır.** View `where public.is_admin(auth.uid())` ile
 *      kilitli; kaldırılırsa non-admin kullanıcılar gerçek veri görür.
 *   3. **Anon grant eklenir.** View'a anon grant eklenirse oturumsuz kullanıcılar
 *      veri okuyabilir.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = "20261003120000_traction_metrics_views.sql";

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

describe("M14 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("M14 · metrics_weekly_active_users view (WAU)", () => {
  const view = () =>
    code().includes("create or replace view public.metrics_weekly_active_users")
      ? code().split("create or replace view public.metrics_weekly_active_users")[1].split(";")[0]
      : "";

  it("view tanımlı", () => {
    expect(view()).not.toBe("");
  });

  it("WAU tanımı: son 7 gün aktif (giriş VEYA içerik)", () => {
    const body = view();

    // 7 gün penceresi
    expect(body).toContain("interval '7 days'");

    // Giriş (auth.users.last_sign_in_at)
    expect(body).toContain("auth.users");
    expect(body).toContain("last_sign_in_at");

    // İçerik üretimi (events, carsi_items, cadde_posts, group_posts)
    expect(body).toContain("public.events");
    expect(body).toContain("public.carsi_items");
    expect(body).toContain("public.cadde_posts");
    expect(body).toContain("public.group_posts");

    // DISTINCT kullanıcı sayısı
    expect(body).toContain("count(distinct uid)");
  });

  it("admin guard: is_admin(auth.uid()) zorunlu", () => {
    expect(view()).toContain("public.is_admin(auth.uid())");
  });

  it("MATERIALIZED VIEW YASAK (1 GB RAM'de refresh riski)", () => {
    expect(flat()).not.toContain("create materialized view");
  });
});

describe("M14 · yetki kontrolü", () => {
  it("anon grant YOK (yalnız authenticated)", () => {
    // View'lar admin-only (is_admin guard); anon'a SELECT verilmez
    expect(flat()).not.toMatch(/grant\s+select\s+on.*metrics_weekly_active_users.*to.*anon/i);
  });

  it("view yorumu admin-only + MATERIALIZED DEGIL notu", () => {
    expect(flat()).toContain("admin-only");
    expect(flat()).toContain("materialized degil");
  });
});
