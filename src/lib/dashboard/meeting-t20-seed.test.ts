// 21 Eylül 2026 toplantısının Komuta Merkezi kaydını (T20) kilitler.
//
// Seed migration'ı üretimde değiştirilemez; bu testler seed metnini TS tarafındaki
// sabitlerle (MEETING_SOURCES, kategori kimlikleri, assignee CHECK kümesi) hizada tutar.
// Beklenen satır sayısı migration içindeki `raise exception` bloğuyla aynıdır —
// birini değiştirirseniz diğerini de değiştirin, testi gevşetmeyin.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MEETING_CATEGORIES, MEETING_SOURCES, SOURCE_COLORS } from "./meeting-notes-data";
import { TODO_ASSIGNEES } from "./todo-items";

const T20_ROW_COUNT = 24;
const MEETING_DATE_LABEL = "21 Eylül 2026";

const t20Sql = () =>
  readFileSync(
    "supabase/migrations/applied/20260925193000_seed_command_center_meeting_t20.sql",
    "utf8",
  );

describe("T20 komuta merkezi seed'i", () => {
  it("T20 meeting-notes-data.ts içinde tanımlıdır", () => {
    const source = MEETING_SOURCES.find((entry) => entry.key === "T20");
    expect(source).toBeDefined();
    expect(source?.date).toBe(MEETING_DATE_LABEL);
    expect(SOURCE_COLORS.T20).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("beklenen sayıda satır ekler ve sayıyı SQL içinde doğrular", () => {
    const sql = t20Sql();
    const rows = sql.match(/'meeting_notes', 'T20', '21 Eylül 2026'/g) ?? [];

    expect(rows).toHaveLength(T20_ROW_COUNT);
    expect(sql).toContain(`raise exception 'T20 seed ${T20_ROW_COUNT} satır eklemeliydi.'`);
  });

  it("aynı toplantı iki kez yüklenmesin diye idempotent guard içerir", () => {
    const sql = t20Sql();
    expect(sql).toContain(`legacy_source_date_label = '${MEETING_DATE_LABEL}'`);
    expect(sql).toContain("skipping");
  });

  it("yalnız geçerli assignee ve status değerlerini kullanır", () => {
    const sql = t20Sql();
    const pairs = Array.from(
      sql.matchAll(/'21 Eylül 2026', '([^']+)', '([^']+)', 5, null/g),
    ).map((match) => ({ assignee: match[1], status: match[2] }));

    expect(pairs).toHaveLength(T20_ROW_COUNT);
    for (const { assignee, status } of pairs) {
      expect(TODO_ASSIGNEES).toContain(assignee as (typeof TODO_ASSIGNEES)[number]);
      expect(["Baslanmadi", "Beklemede", "Devam ediyor", "Tamamlandi"]).toContain(status);
    }
  });

  it("karar satırları ortak (B+B) ve Beklemede durumundadır", () => {
    const sql = t20Sql();
    const decisions = Array.from(sql.matchAll(/\('meeting_note', 'KARAR: [^\n]+/g)).map(
      (match) => match[0],
    );

    expect(decisions).toHaveLength(6);
    for (const row of decisions) {
      expect(row).toContain("'21 Eylül 2026', 'B+B', 'Beklemede'");
    }
  });

  it("yalnız tanımlı toplantı kategorilerini kullanır", () => {
    const sql = t20Sql();
    const categoryIds = new Set(MEETING_CATEGORIES.map((category) => category.id));
    const used = Array.from(
      sql.matchAll(/'meeting_notes', 'T20', '21 Eylül 2026', '([^']+)'/g),
    ).map((match) => match[1]);

    expect(used).toHaveLength(T20_ROW_COUNT);
    for (const category of used) {
      expect(categoryIds).toContain(category);
    }
  });
});
