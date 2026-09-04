// 3 Eylül 2026 "Profiller" toplantısının iki kaydını kilitler:
//   1) Komuta Merkezi T19 seed'i (command_center_items, item_type='meeting_note')
//   2) Profil Workshop WS1 seed'i (workshop_items, workshop_key='profil')
//
// Seed migration'ları üretimde değiştirilemez; bu testler seed metnini TS tarafındaki
// sabitlerle (MEETING_SOURCES, kategori kimlikleri, assignee CHECK kümesi) hizada tutar.
// Beklenen satır sayıları migration içindeki `raise exception` bloklarıyla aynıdır —
// birini değiştirirseniz diğerini de değiştirin, testi gevşetmeyin.

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MEETING_CATEGORIES, MEETING_SOURCES, SOURCE_COLORS } from "./meeting-notes-data";
import { TODO_ASSIGNEES } from "./todo-items";

const T19_ROW_COUNT = 24;
const PROFIL_ITEM_COUNT = 26;
const MEETING_DATE_LABEL = "3 Eylül 2026";

/** Seed dosyası uygulanınca `applied/` altına taşınır; her iki konumu da kabul et. */
function readMigration(fileName: string): string {
  const candidates = [
    `supabase/migrations/${fileName}`,
    `supabase/migrations/applied/${fileName}`,
  ];
  const found = candidates.find((path) => existsSync(path));
  if (!found) {
    throw new Error(`Migration bulunamadı: ${fileName}`);
  }
  return readFileSync(found, "utf8");
}

const t19Sql = () => readMigration("20260904120000_seed_command_center_meeting_t19.sql");
const profilSql = () => readMigration("20260904121000_workshop_items_profil.sql");

describe("T19 komuta merkezi seed'i", () => {
  it("T19 meeting-notes-data.ts içinde tanımlıdır", () => {
    const source = MEETING_SOURCES.find((entry) => entry.key === "T19");
    expect(source).toBeDefined();
    expect(source?.date).toBe(MEETING_DATE_LABEL);
    expect(SOURCE_COLORS.T19).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("beklenen sayıda satır ekler ve sayıyı SQL içinde doğrular", () => {
    const sql = t19Sql();
    const rows = sql.match(/'meeting_notes', 'T19', '3 Eylül 2026'/g) ?? [];

    expect(rows).toHaveLength(T19_ROW_COUNT);
    expect(sql).toContain(`raise exception 'T19 seed ${T19_ROW_COUNT} satır eklemeliydi.'`);
  });

  it("aynı toplantı iki kez yüklenmesin diye idempotent guard içerir", () => {
    const sql = t19Sql();
    expect(sql).toContain(`legacy_source_date_label = '${MEETING_DATE_LABEL}'`);
    expect(sql).toContain("skipping");
  });

  it("yalnız geçerli assignee değerlerini kullanır", () => {
    const sql = t19Sql();
    const used = new Set(
      Array.from(sql.matchAll(/'3 Eylül 2026', '([^']+)', '(?:Baslanmadi|Beklemede|Tamamlandi)'/g)).map(
        (match) => match[1],
      ),
    );

    expect(used.size).toBeGreaterThan(0);
    for (const assignee of used) {
      expect(TODO_ASSIGNEES).toContain(assignee as (typeof TODO_ASSIGNEES)[number]);
    }
  });

  it("yalnız tanımlı toplantı kategorilerini kullanır", () => {
    const sql = t19Sql();
    const categoryIds = new Set(MEETING_CATEGORIES.map((category) => category.id));
    const used = Array.from(
      sql.matchAll(/'meeting_notes', 'T19', '3 Eylül 2026', '([^']+)'/g),
    ).map((match) => match[1]);

    expect(used).toHaveLength(T19_ROW_COUNT);
    for (const category of used) {
      expect(categoryIds).toContain(category);
    }
  });
});

describe("Profil Workshop WS1 seed'i", () => {
  it("26 maddeyi 1'den başlayarak kesintisiz numaralandırır", () => {
    const sql = profilSql();
    const itemNumbers = Array.from(sql.matchAll(/\('profil', 'WS1', '[^']+', (\d+),/g)).map(
      (match) => Number.parseInt(match[1], 10),
    );

    expect(itemNumbers).toHaveLength(PROFIL_ITEM_COUNT);
    // (workshop_key, item_no) tekil olduğu için profil workshop'u 1'den başlar;
    // Cadde'nin 136 maddesiyle çakışmaz.
    expect(itemNumbers).toEqual(
      Array.from({ length: PROFIL_ITEM_COUNT }, (_value, index) => index + 1),
    );
    expect(sql).toContain(`Profil workshop WS1 seed ${PROFIL_ITEM_COUNT} madde olmalıydı`);
  });

  it("toplantıda konuşulan profil bölümlerini kapsar", () => {
    const sql = profilSql();
    const sections = new Set(
      Array.from(sql.matchAll(/\('profil', 'WS1', '([^']+)', \d+,/g)).map((match) => match[1]),
    );

    expect(sections).toEqual(
      new Set([
        "Profil Formu ve Alanlar",
        "Doğrulama ve Giriş",
        "Rol ve Etiket Mimarisi",
        "Referans Sistemi",
        "Paketleme ve Yetkiler",
        "Operasyon",
      ]),
    );
  });

  it("tekrar çalıştırılırsa madde çoğaltmaz", () => {
    expect(profilSql()).toContain("on conflict (workshop_key, item_no) do nothing");
  });
});
