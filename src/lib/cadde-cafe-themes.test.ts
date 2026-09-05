// Kafe açış formundaki tema kataloğunun sözleşme testi (revizyon 1c5b3049).
//
// Neden metin testi: tema listesi KOD'da değil, DB'de (`public.cadde_cafe_themes`).
// Form da, `create_cadde_cafe_v1` doğrulaması da o tabloyu okur. Bu yüzden burada
// iki şey kilitlenir:
//   1) Migration metni — istenen 11 temayı üreten satırlar silinmesin.
//   2) Frontend'de sabit tema listesi geri gelmesin (eski hâli 7 sabit öneriydi:
//      IT, Hekimler, Profesyoneller… — kategori gibi duran, DB'siz bir listeydi).
//
// Ölçülen canlı durum (2026-09-05, migration sonrası): 17 aktif tema, istenen 11'i tam.
// Tablo kolonları: key, label_tr, icon_key, sort_order, is_active — "label" kolonu YOK.

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const readFirstExisting = (paths: readonly string[]): string =>
  readFileSync(paths.find((path) => existsSync(path)) ?? paths[0], "utf8");

const seedSql = () =>
  readFirstExisting([
    "supabase/migrations/applied/20260730150000_cadde_v1_005_cafe_themes_brands.sql",
    "supabase/migrations/20260730150000_cadde_v1_005_cafe_themes_brands.sql",
  ]);

const fixSql = () =>
  readFirstExisting([
    "supabase/migrations/applied/20260905160000_cadde_cafe_theme_is_ik.sql",
    "supabase/migrations/20260905160000_cadde_cafe_theme_is_ik.sql",
  ]);

/** Üründe istenen 11 tema. Sıra ürün kararı; burada yalnız VARLIK kilitlenir. */
const REQUIRED_THEME_KEYS = [
  "spor",
  "saglik",
  "gusto",
  "hobi",
  "girisim",
  "party",
  "meslek",
  "is",
  "hr", // etiketi "İK"; anahtar 'hr' KALIR — cadde_cafes.theme_key='hr' kayıtları bozulmasın.
  "muzik",
  "gundem",
] as const;

describe("cadde kafe tema kataloğu", () => {
  it("istenen 11 temanın hepsini migration'lar üretir", () => {
    const combined = `${seedSql()}\n${fixSql()}`;

    for (const key of REQUIRED_THEME_KEYS) {
      expect(combined, `'${key}' teması hiçbir migration'da tanımlı değil`).toContain(`('${key}',`);
    }
  });

  it("'is' temasını meslek ile hr arasına ekler", () => {
    const sql = fixSql();

    // U&'\0130\015F' = "İş". Türkçe karakter unicode escape ile yazılır: migration
    // psql'e stdin üzerinden geçer, Windows'ta client_encoding UTF-8 olmayabilir.
    expect(sql).toContain("insert into public.cadde_cafe_themes");
    expect(sql).toContain(String.raw`('is', U&'\0130\015F'`);
    expect(sql).toContain("65"); // meslek 60 < is 65 < hr 70
  });

  it("'hr' temasının etiketini Türkçeleştirir ama anahtarını DEĞİŞTİRMEZ", () => {
    const sql = fixSql();

    // U&'\0130K' = "İK" (İnsan Kaynakları). Ürün dili Türkçe; "HR" İngilizceydi.
    expect(sql).toContain(String.raw`set label_tr = U&'\0130K'`);
    expect(sql).toContain("where key = 'hr'");
    // Anahtar rename'i mevcut kafeleri düşürürdü: theme_key FK'sız ama RPC doğruluyor.
    expect(sql).not.toContain("set key =");
    expect(sql).not.toContain("key = 'ik'");
  });

  it("frontend tema listesini DB'den okur, sabit liste tutmaz", () => {
    const api = readFileSync("src/lib/cadde-cafe-api.ts", "utf8");
    const form = readFileSync("src/components/cadde/CreateCafeForm.tsx", "utf8");

    expect(api).toContain('.from("cadde_cafe_themes")');
    expect(api).toContain('.select("key, label_tr, icon_key, sort_order")');
    expect(api).toContain('.eq("is_active", true)');
    expect(api).toContain('.order("sort_order"');

    // Form seçenekleri yalnız sorgudan gelmeli.
    expect(form).toContain("listCaddeCafeThemes");
    expect(form).toContain("themesQuery.data");

    // Sabit etiket listesi geri gelirse bu düşer. İ=İ, ş=ş, ğ=ğ, ü=ü.
    const hardcodedLabels = [
      "Girişim",
      "Sağlık",
      "Müzik",
      "Gündem",
      "İK",
      "İş",
    ];
    for (const label of hardcodedLabels) {
      expect(form, `Form'da sabit tema etiketi var: ${label}`).not.toContain(`"${label}"`);
      expect(form, `Form'da sabit tema etiketi var: ${label}`).not.toContain(`>${label}<`);
    }
  });
});
