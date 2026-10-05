/**
 * G24 sözleşmesi — moderatör paneli migration'ı (`admin_set_group_setting` +
 * `group_moderator_summary`).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Ayar yazma yüzeyinin genişlemesi.** Beyaz liste TEK anahtar
 *      (`groups.fast_lane_enabled`); listede olmayan anahtar yazılabiliyorsa
 *      G09 doktrini ("eşikler ürün kararıdır, SQL update ister") panelden
 *      delinir — eşikler moderatör ekranından sessizce değişir.
 *   2. **Admin kapısının kalkması** (is_admin → raise).
 *   3. **Şikayet sayacının bayatlaması.** G24'te `group_reports` yoktu (sabit 0);
 *      G14 tabloyu kurup summary'yi yeniden tanımladı → test EN SON tanımın gerçek
 *      sayaç olduğunu kilitler (G24 metnine bakmak bayat sonuç verirdi).
 *   4. **cron.job_run_details'ın istemciye doğrudan açılması** (özet RPC'si
 *      security definer olmalı; cron şeması grant'sız kalır).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002130000_group_moderator_panel.sql";

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

const setSettingFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.admin_set_group_setting",
    "comment on function public.admin_set_group_setting",
    "admin_set_group_setting",
  );

const summaryFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_moderator_summary",
    "comment on function public.group_moderator_summary",
    "group_moderator_summary",
  );

describe("G24 · salt ekleme", () => {
  it("kolon/tablo/fonksiyon DÜŞÜRÜLMEZ, mevcut kapılar değişmez", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toContain("create or replace function public.set_group_status_v1");
    expect(sql).not.toContain("create or replace function public.admin_review_group_claim");
    expect(sql).not.toContain("create or replace function public.group_post_review");
    expect(sql).not.toContain("create or replace function public.admin_record_group_strike");
  });
});

describe("G24 · admin_set_group_setting — dar yazma yüzeyi", () => {
  it("is_admin kapısı + 42501 (set_notification_setting deseni)", () => {
    const fn = setSettingFn();

    expect(fn).toContain("public.is_admin(v_uid)");
    expect(fn).toContain("raise exception 'forbidden' using errcode = '42501'");
  });

  it("beyaz liste TEK anahtar: groups.fast_lane_enabled", () => {
    const fn = setSettingFn();

    expect(fn).toContain("p_key not in ('groups.fast_lane_enabled')");
    expect(fn).toContain("raise exception 'unknown_setting_key'");
    // İkinci bir anahtar sızmasın
    expect(fn.match(/'groups\.[a-z_]+'/g)).toEqual(["'groups.fast_lane_enabled'"]);
  });

  it("değer tip kontrolü: yalnız boolean + updated_by izi", () => {
    const fn = setSettingFn();

    expect(fn).toContain("jsonb_typeof(p_value) <> 'boolean'");
    expect(fn).toContain("updated_by = v_uid");
  });

  it("grant yalnız authenticated (anon çağırabilir ama is_admin kapısı düşürür)", () => {
    expect(flat()).toContain(
      "grant execute on function public.admin_set_group_setting(text, jsonb) to authenticated;",
    );
  });
});

describe("G24 · group_moderator_summary — üst şerit", () => {
  it("admin kapısı var; sayaçlar doğru kaynaklardan", () => {
    const fn = summaryFn();

    expect(fn).toContain("group_moderator_forbidden");
    expect(fn).toContain("listing_status = 'pending_review'");
    expect(fn).toContain("status = 'pending' and method = 'screenshot'");
    expect(fn).toContain("post_status = 'pending_platform'");
    expect(fn).toContain("group_setting_int('groups.fast_lane_suggest_threshold'");
    expect(fn).toContain("group_setting_bool('groups.fast_lane_enabled'");
  });

  it("G14 ÇEVRİLDİ: şikayet sayacı artık GERÇEK — summary'yi en son G14 tanımlar ve group_reports'tan sayar", () => {
    // G24 tanımı tarihsel olarak sabit 0'dı (tablo yoktu). G14 fonksiyonu yeniden
    // tanımladı; bu test G24 metnine değil EN SON tanıma bakar (bayatlama kapanı).
    expect(summaryFn()).toContain("'pending_reports', 0");
    const applied = "supabase/migrations/applied/";
    const definers = readdirSync(applied)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .filter((name) => readFileSync(applied + name, "utf8").includes("create or replace function public.group_moderator_summary"));
    const latest = definers.at(-1) ?? "";

    expect(latest).toBe("20261005200000_group_reports.sql");
    const latestFn = sliceBetween(
      readFileSync(applied + latest, "utf8"),
      "create or replace function public.group_moderator_summary",
      "comment on function public.group_moderator_summary",
      "G14 summary",
    );
    expect(latestFn).toMatch(/from public\.group_reports where status = 'open'/);
    expect(latestFn).toContain("'pending_reports', v_pending_reports");
    expect(latestFn).not.toContain("'pending_reports', 0");
  });

  it("görev koşuları cron.job_run_details'tan (security definer — istemci cron şemasına erişemez)", () => {
    const fn = summaryFn();

    expect(fn).toContain("from cron.job j");
    expect(fn).toContain("cron.job_run_details d");
    expect(fn).toContain("j.jobname like 'group\\_%'");
    // ⚠️ Dosya-geneli değil FONKSİYON-KAPSAMLI kilit (G21/G24 mutasyon dersi:
    // diğer fonksiyondaki 'security definer' bu iddiayı hep geçiriyordu).
    expect(fn).toContain("security definer");
    // cron şemasına grant VERİLMEZ (özet RPC yeter)
    expect(code()).not.toMatch(/grant[^;]+on (table |all tables in schema )?cron\./);
  });

  it("moderasyon sayacı published sayısı (x/100 önerisi buradan)", () => {
    const fn = summaryFn();

    expect(fn).toContain("listing_status = 'published'");
    expect(fn).toContain("'moderated_count', v_moderated");
  });
});
