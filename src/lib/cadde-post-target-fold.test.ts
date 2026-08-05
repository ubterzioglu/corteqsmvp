import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { resolveCaddeRpcErrorMessage } from "./cadde-rules";

/**
 * SQL↔TS ayna sözleşmesi — Cadde paylaşım hedefi eşleşmesi.
 *
 * 2026-08-05'te ölçülen kusur: `create_cadde_post_v2` hedefi ülke/şehir adıyla
 * BİREBİR karşılaştırıyordu (`c.name = r.country_name`). Profil attribute'u
 * serbest metin olduğu için `Türkiye` katalogdaki `Turkiye` ile eşleşmiyor,
 * 43 üye hiç paylaşım yapamıyordu. Okuma tarafı (list_cadde_feed_v1,
 * cadde_resolve_viewer_location) 2026-07-29'dan beri `cadde_fold_text` kullanıyor;
 * yazma tarafı 20260805130000 ile hizalandı.
 *
 * Bu testler config METNİNİ denetler — çalışan DB'yi değil. Amaç, birinin
 * fonksiyonu tekrar `create or replace` ederken fold eşleşmesini sessizce
 * düşürmesini engellemek. Gevşetmek için düzenleme YAPMA; bozulan tarafı düzelt.
 */
const FOLD_MIGRATION = "supabase/migrations/applied/20260805130000_cadde_post_target_fold.sql";

const readSql = (path: string) => {
  expect(existsSync(path), `migration bulunamadı: ${path}`).toBe(true);
  return readFileSync(path, "utf8");
};

/**
 * `--` yorumlarını atar. Negatif iddialar YALNIZ yürütülebilir SQL'e bakmalı:
 * migration'ın başlığı düzeltilen kusuru bilerek alıntılıyor, bu bir regresyon değil.
 * (Basit sıyırma — bu dosyada `--` içeren string literal yok.)
 */
const readExecutableSql = (path: string) =>
  readSql(path)
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");

describe("cadde paylaşım hedefi — fold eşleşmesi", () => {
  it("ülke ve şehir join'leri cadde_fold_text kullanır", () => {
    const sql = readSql(FOLD_MIGRATION);

    expect(sql).toContain("create or replace function public.create_cadde_post_v2");
    expect(sql).toContain("public.cadde_fold_text(c.name) = public.cadde_fold_text(r.country_name)");
    expect(sql).toContain("public.cadde_fold_text(ci.name) = public.cadde_fold_text(r.city_name)");
  });

  it("birebir isim karşılaştırması geri gelmez", () => {
    const sql = readExecutableSql(FOLD_MIGRATION);

    // Kusurun tam metni — yürütülebilir SQL'e geri dönerse test patlar.
    expect(sql).not.toContain("c.name = r.country_name");
    expect(sql).not.toContain("ci.name = r.city_name");
  });

  it("NULL koruması korunur (fold boş string döndürdüğü için şart)", () => {
    const sql = readSql(FOLD_MIGRATION);

    expect(sql).toContain("on r.country_name is not null");
    expect(sql).toContain("on r.city_name is not null");
  });

  it("hedef doğrulama kuralları ve ayrıcalık kapıları aynen korunur", () => {
    const sql = readSql(FOLD_MIGRATION);

    // Fold değişikliği bir yetki gevşetmesi DEĞİLDİR; bu kapılar yerinde kalmalı.
    expect(sql).toContain("cadde_invalid_targets");
    expect(sql).toContain("v_is_privileged := public.is_admin(v_uid) or public.is_moderator(v_uid)");
    expect(sql).toContain("public.has_cadde_feature(v_uid, 'cadde.post.multi_target')");
    expect(sql).toContain("cadde_multi_target_premium_required");
    expect(sql).toContain("cadde_tr_scope_restricted");
    expect(sql).toContain("raise exception 'cadde_banned'");
    expect(sql).toContain("v_target_count > 2");
  });

  it("grant/revoke satırları imzayla birlikte korunur", () => {
    const sql = readSql(FOLD_MIGRATION);
    const signature = "public.create_cadde_post_v2(text,text,text,text,text,boolean,text,text[],uuid,text,jsonb,jsonb,jsonb)";

    expect(sql).toContain(`revoke all on function ${signature} from public, anon;`);
    expect(sql).toContain(`grant execute on function ${signature} to authenticated;`);
  });

  it("cadde_invalid_targets Türkçe mesaj haritasında kalır (RPC hatası düz nesnedir)", () => {
    // Regresyon koruması: RPC hataları supabase-js'te Error örneği DEĞİL, düz nesnedir.
    const rpcError = { code: "P0001", message: "cadde_invalid_targets", details: null, hint: null };

    expect(resolveCaddeRpcErrorMessage(rpcError)).toContain("Paylaşım hedefi geçersiz");
  });
});
