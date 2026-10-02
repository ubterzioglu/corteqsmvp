/**
 * G21 sözleşmesi — sahip paneli migration'ı (`group_owner_panel_state` +
 * `group_owner_update_v1`).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Panelin sahip-olmayana veri sızdırması.** `owner_user_id` view'da YOK;
 *     panel durumu RPC'si sahiplik kontrolünü VERİDEN ÖNCE yapmazsa kuyruk,
 *     skor ve düzenleme alanları herkese açılır.
 *   2. **Sahip düzenlemesinin motor alanlarına uzanması.** group_score,
 *     ownership, listing_status, invite_code, link yazılabiliyorsa panel
 *     guard v3'ün etrafından dolanır (RPC security definer!).
 *   3. **G06 kilidinin panel yolunda delinmesi** (aile-cocuk G18'de kilitli —
 *     düzenleme de aynı kilidi taşımak zorunda).
 *   4. **Legacy etiket kuyruğunun kaybı:** canlı eski paket description'daki
 *     `[Platform:]/[Badge …]` etiketlerini okuyor; düzenleme onları silerse
 *     deploy'a kadar kartlar bozulur.
 *   5. **Kaldırma isteğinin G12 owner yolundan sapması** (kabul #9: anında
 *     hidden, reason owner_request, gerekçe sorulmaz).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002100000_group_owner_panel.sql";

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

const panelFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_owner_panel_state",
    "comment on function public.group_owner_panel_state",
    "panel_state",
  );

const updateFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_owner_update_v1",
    "comment on function public.group_owner_update_v1",
    "owner_update",
  );

describe("G21 · salt ekleme", () => {
  it("kolon/tablo/fonksiyon DÜŞÜRÜLMEZ, mevcut politika değişmez", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toMatch(/drop\s+policy/i);
    expect(sql).not.toContain("drop view");
  });
});

describe("G21 · panel durumu sızıntısız", () => {
  it("sahiplik kontrolü VERİDEN ÖNCE; sahip değilse tek alan döner", () => {
    const fn = panelFn();

    expect(fn).toContain("w.ownership = 'verified'");
    expect(fn).toContain("w.owner_user_id = v_uid");
    // İki erken çıkış da yalnız is_owner:false taşır
    const earlyReturns = fn.match(/return jsonb_build_object\('is_owner', false\);/g) ?? [];
    expect(earlyReturns).toHaveLength(2);
    // Kontrol satırı, iç veri select'lerinden ÖNCE (tek select'te WHERE ile birleşik):
    expect(fn.indexOf("w.owner_user_id = v_uid")).toBeLessThan(fn.indexOf("group_health_score_compute"));
    expect(fn.indexOf("w.owner_user_id = v_uid")).toBeLessThan(fn.indexOf("from public.group_posts"));
  });

  it("kuyruk YALNIZ pending_group_admin (sahibin kuyruğu — G16 dili)", () => {
    expect(panelFn()).toContain("gp.post_status = 'pending_group_admin'");
  });

  it("skor kırılımı G17 compute'tan (ikinci formül UYDURULMAZ)", () => {
    expect(panelFn()).toContain("public.group_health_score_compute(p_landing_id)");
  });

  it("grant yalnız authenticated", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_owner_panel_state(uuid) to authenticated;",
    );
  });
});

describe("G21 · sahip düzenlemesi motor alanlarına UZANAMAZ", () => {
  it("UPDATE set listesi yalnız içerik alanları", () => {
    const fn = updateFn();
    // Dilim: update ifadesinden son `where id = p_landing_id;`'ye (RETURNING yok).
    const updateStmt = sliceBetween(fn, "update public.whatsapp_landings", "where id = p_landing_id;", "owner update");

    expect(updateStmt).not.toContain("group_score");
    expect(updateStmt).not.toContain("ownership");
    expect(updateStmt).not.toContain("listing_status");
    expect(updateStmt).not.toContain("invite_code");
    expect(updateStmt).not.toContain("whatsapp_link");
    expect(updateStmt).not.toContain("platform");
    expect(updateStmt).not.toContain("has_approved_badge");
    expect(updateStmt).not.toContain("strike_count");
  });

  it("sahiplik kapısı: verified + owner_user_id = çağıran", () => {
    const fn = updateFn();

    expect(fn).toContain("ownership = 'verified' and owner_user_id = v_uid");
    expect(fn).toContain("group_owner_forbidden");
  });

  it("aile-cocuk kilidi G18 ile aynı (G06/K09)", () => {
    const fn = updateFn();

    // ⚠️ Yalnız raise'i değil KOŞULU da kilitle: mutasyon turunda ölçüldü —
    // koşul 'olmayan-xx'e çevrilince raise var diye test geçiyordu (M3 dersi).
    expect(fn).toContain("if p_category = 'aile-cocuk' then");
    expect(fn).toContain("group_owner_category_locked");
    expect(fn.indexOf("group_owner_category_locked")).toBeLessThan(
      fn.indexOf("group_owner_invalid_category"),
    );
  });

  it("160 sınırı + geo doğrulaması (kategori/ülke/şehir G18 deseninde)", () => {
    const fn = updateFn();

    expect(fn).toContain("char_length(v_short) > 160");
    expect(fn).toContain("from public.geo_countries");
    expect(fn).toContain("country_id = v_country.id");
    expect(fn).toContain("group_owner_city_not_found");
  });

  it("legacy description etiket kuyruğu KORUNUR (paralel sistem)", () => {
    const fn = updateFn();

    expect(fn).toContain("regexp_match(coalesce(v_old.description, '')");
    expect(fn).toContain("v_short || coalesce(v_tags, '')");
    expect(fn).toContain("v_city_name := 'Genel'");
  });

  it("atanmamış record alanı OKUNMAZ (G18 canlı dersi: düz text taşınır)", () => {
    const fn = updateFn();

    expect(fn).toContain("v_country_code text := null;");
    expect(fn).toContain("coalesce(v_country_code, v_old.country_code)");
    expect(fn).not.toContain("coalesce(v_country.code");
  });

  it("grant yalnız authenticated", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_owner_update_v1(uuid, text, text, text, text, uuid, boolean, text, text) to authenticated;",
    );
  });
});

describe("G21 · kaldırma isteği G12 owner yolundan gider (kabul #9)", () => {
  it("istemci set_group_status_v1 + owner_request çağırır — yeni kapı YOK", () => {
    const src = readFileSync("src/lib/group-owner-panel.ts", "utf8");
    const fn = sliceBetween(src, "export async function requestGroupRemoval(", "\n}", "requestGroupRemoval");

    expect(fn).toContain('supabase.rpc("set_group_status_v1" as never');
    expect(fn).toContain('p_to_status: "hidden"');
    expect(fn).toContain('p_reason: "owner_request"');
    // Migration bu geçiş için YENİ fonksiyon tanımlamaz (G12 tek kapı):
    expect(code()).not.toContain("create or replace function public.group_owner_remove");
  });

  it("tasarım §3.C: gerekçe SORULMAZ — RPC notu sabit, kullanıcıdan metin almaz", () => {
    const src = readFileSync("src/lib/group-owner-panel.ts", "utf8");
    const fn = sliceBetween(src, "export async function requestGroupRemoval(", "\n}", "requestGroupRemoval");

    expect(fn).not.toContain("reason: string");
    expect(fn).toContain("Sahip paneli: gruptan kaldırma isteği");
  });
});
