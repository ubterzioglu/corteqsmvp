// SQL↔TS sözleşmesi: her `raise exception 'cadde_*'` kodunun Türkçe karşılığı olmalı.
//
// CLAUDE.md kuralı: "Yeni cadde_* RPC hata kodları cadde-rules.ts Türkçe mesaj
// haritasına EKLENMELİ." Bu kural bugüne kadar elle takip ediliyordu ve iki kod
// (cadde_invalid_carsi_contact, cadde_invalid_carsi_video) sessizce atlanmıştı —
// kullanıcı Türkçe mesaj yerine ham hata kodunu görüyordu.
//
// Test migration dosyalarının METNİNİ tarar; yeni bir RPC hatası eklenip haritaya
// yazılmazsa burada düşer. Testi susturma, haritaya satır ekle.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATION_DIRS = ["supabase/migrations/applied", "supabase/migrations/archive"];

const collectSqlErrorCodes = (): Map<string, string> => {
  const codes = new Map<string, string>();
  for (const dir of MIGRATION_DIRS) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith(".sql"));
    } catch {
      continue; // dizin yoksa (ör. kısmi checkout) sessizce atla
    }
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      for (const match of sql.matchAll(/raise\s+exception\s+'(cadde_[a-z0-9_]+)'/gi)) {
        if (!codes.has(match[1])) codes.set(match[1], `${dir}/${file}`);
      }
    }
  }
  return codes;
};

const collectMappedCodes = (): Set<string> => {
  const source = readFileSync("src/lib/cadde-rules.ts", "utf8");
  return new Set([...source.matchAll(/^\s{2}(cadde_[a-z0-9_]+):/gm)].map((match) => match[1]));
};

describe("cadde RPC hata kodu ↔ Türkçe mesaj sözleşmesi", () => {
  const sqlCodes = collectSqlErrorCodes();
  const mapped = collectMappedCodes();

  it("migration dosyalarından hata kodu toplayabiliyor (tarama boşa düşmesin)", () => {
    // Regex/yol bozulursa test sessizce "hiç eksik yok" der; bu koruma onu engeller.
    expect(sqlCodes.size).toBeGreaterThan(30);
    expect(mapped.size).toBeGreaterThan(30);
  });

  it("her SQL hata kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes.entries()]
      .filter(([code]) => !mapped.has(code))
      .map(([code, file]) => `${code} (${file})`);

    expect(missing).toEqual([]);
  });
});
