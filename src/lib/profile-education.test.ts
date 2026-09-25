import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EDUCATION_ATTRIBUTE_KEYS,
  EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY,
  EDUCATION_LAST_SCHOOL_LABEL,
  EDUCATION_LEVEL_ATTRIBUTE_KEY,
  EDUCATION_LEVEL_LABEL,
  EDUCATION_LEVEL_OPTIONS,
  getAttributeSelectOptions,
  getEducationLevelLabel,
  isEducationAttributeKey,
  isEducationLevelValue,
} from "@/lib/profile-education";

const MIGRATION_PATH = "supabase/migrations/applied/20260925100000_profil_ogrenim_alanlari.sql";
const migrationSql = () => readFileSync(MIGRATION_PATH, "utf8");

describe("profile-education sözlüğü", () => {
  it("öğrenim durumu seçeneklerini Türkçe etiketleriyle ve doğru sırayla tanımlar", () => {
    expect(EDUCATION_LEVEL_OPTIONS.map((option) => option.label)).toEqual([
      "İlköğretim",
      "Ortaöğretim",
      "Lise",
      "Ön lisans",
      "Lisans",
      "Yüksek lisans",
      "Doktora",
    ]);
  });

  it("DB'ye yazılan değerler ASCII slug'dır ve tekildir", () => {
    const values = EDUCATION_LEVEL_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toMatch(/^[a-z_]+$/);
    }
  });

  it("alan etiketleri Türkçe karakterleri eksiksiz taşır", () => {
    expect(EDUCATION_LEVEL_LABEL).toBe("Öğrenim durumu");
    expect(EDUCATION_LAST_SCHOOL_LABEL).toBe("Son bitirdiği üniversite/okul");
  });

  it("etiket çözümü bilinmeyen değeri kaybetmez", () => {
    expect(getEducationLevelLabel("yuksek_lisans")).toBe("Yüksek lisans");
    expect(getEducationLevelLabel("bilinmeyen")).toBe("bilinmeyen");
    expect(getEducationLevelLabel("")).toBe("");
    expect(getEducationLevelLabel(null)).toBe("");
  });

  it("değer ve anahtar yardımcıları", () => {
    expect(isEducationLevelValue("lisans")).toBe(true);
    expect(isEducationLevelValue("Lisans")).toBe(false);
    expect(isEducationLevelValue(3)).toBe(false);
    expect(isEducationAttributeKey(EDUCATION_LEVEL_ATTRIBUTE_KEY)).toBe(true);
    expect(isEducationAttributeKey(EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY)).toBe(true);
    expect(isEducationAttributeKey("school")).toBe(false);
    expect(EDUCATION_ATTRIBUTE_KEYS).toEqual([EDUCATION_LEVEL_ATTRIBUTE_KEY, EDUCATION_LAST_SCHOOL_ATTRIBUTE_KEY]);
    expect(getAttributeSelectOptions(EDUCATION_LEVEL_ATTRIBUTE_KEY)).toBe(EDUCATION_LEVEL_OPTIONS);
    expect(getAttributeSelectOptions("country")).toBeNull();
  });
});

describe("20260925100000 öğrenim migration sözleşmesi", () => {
  it("validation_schema.enum TS seçenek değerleriyle birebir aynıdır", () => {
    const sql = migrationSql();
    const enumMatch = sql.match(/'enum',\s*jsonb_build_array\(([\s\S]*?)\)/);
    expect(enumMatch).not.toBeNull();
    const sqlValues = [...(enumMatch?.[1] ?? "").matchAll(/'([^']+)'/g)].map((match) => match[1]);
    expect(sqlValues).toEqual(EDUCATION_LEVEL_OPTIONS.map((option) => option.value));
  });

  it("iki attribute'u doğru tip ve Türkçe etiketle tanımlar", () => {
    const sql = migrationSql();
    expect(sql).toMatch(/'education_level',\s*'Öğrenim durumu',[\s\S]*?'select'/);
    expect(sql).toMatch(/'education_last_school',\s*'Son bitirdiği üniversite\/okul',[\s\S]*?'text'/);
  });

  it("kurallar tüm aktif rollere isteğe bağlı, gizli varsayılan ve gizlenebilir eklenir", () => {
    const sql = migrationSql();
    expect(sql).toContain("r.is_active = true");
    expect(sql).toContain("r.deleted_at is null");
    // is_enabled, is_required, is_public_default, user_can_edit, user_can_hide, requires_admin_approval
    expect(sql).toMatch(/r\.id, a\.id, true, false, false,\s*true, true, false,/);
    expect(sql).toMatch(/false, true, true, 'private'/);
    expect(sql).toContain("and not exists");
    expect(sql).toContain("on conflict (key) do update");
  });
});
