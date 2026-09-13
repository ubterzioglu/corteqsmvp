import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const CREATE_CAFE_FORM = readFileSync("src/components/cadde/CreateCafeForm.tsx", "utf8");
const MIGRATION_PATHS = [
  "supabase/migrations/20260913140000_cadde_cafe_async_first.sql",
  "supabase/migrations/applied/20260913140000_cadde_cafe_async_first.sql",
];

const migrationSql = () =>
  readFileSync(MIGRATION_PATHS.find((path) => existsSync(path)) ?? MIGRATION_PATHS[0], "utf8");

describe("Cafe async-first geçici ürün sözleşmesi", () => {
  it("yeni Cafe'leri 24 saat açık başlatır ve 1-7 gün seçenekleri sunar", () => {
    expect(CREATE_CAFE_FORM).toMatch(/durationHours:\s*24/);
    expect(CREATE_CAFE_FORM).toContain('{ hours: 24, label: "1 gün" }');
    expect(CREATE_CAFE_FORM).toContain('{ hours: 72, label: "3 gün" }');
    expect(CREATE_CAFE_FORM).toContain('{ hours: 168, label: "7 gün" }');
  });

  it("DB ayarları kararı, varsayılanı ve güvenlik üst sınırını kaydeder", () => {
    const sql = migrationSql();

    expect(sql).toContain("cadde.cafe.mode");
    expect(sql).toContain("async_first");
    expect(sql).toContain("cadde.cafe.default_duration_hours");
    expect(sql).toContain("cadde.cafe.max_duration_hours");
    expect(sql).toMatch(/default_duration_hours'[\s\S]*?'24'::jsonb/);
    expect(sql).toMatch(/max_duration_hours'[\s\S]*?'168'::jsonb/);
  });
});
