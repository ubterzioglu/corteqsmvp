// 21 Eylül 2026 (T20) ve 25 Eylül 2026 (T21) toplantılarının Komuta Merkezi kayıtlarını kilitler.
//
// Seed migration'ları üretimde değiştirilemez; bu testler seed metnini TS tarafındaki
// sabitlerle (MEETING_SOURCES, kategori kimlikleri, assignee CHECK kümesi) hizada tutar.
// Beklenen satır sayıları migration içindeki `raise exception` bloklarıyla aynıdır —
// birini değiştirirseniz diğerini de değiştirin, testi gevşetmeyin.
//
// T20 iki dosyadan oluşur: özetten kurulan ilk seed (24) + tam transkriptten gelen ek (7).

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MEETING_CATEGORIES, MEETING_SOURCES, SOURCE_COLORS } from "./meeting-notes-data";
import { TODO_ASSIGNEES } from "./todo-items";

const MIGRATIONS = "supabase/migrations/applied";
const STATUSES = ["Baslanmadi", "Beklemede", "Devam ediyor", "Tamamlandi"];

interface MeetingSeedCase {
  code: "T20" | "T21";
  dateLabel: string;
  files: { name: string; rows: number }[];
  total: number;
  decisions: number;
}

const CASES: MeetingSeedCase[] = [
  {
    code: "T20",
    dateLabel: "21 Eylül 2026",
    files: [
      { name: "20260925193000_seed_command_center_meeting_t20.sql", rows: 24 },
      { name: "20260925194000_seed_command_center_meeting_t20_ek.sql", rows: 7 },
    ],
    total: 31,
    decisions: 7,
  },
  {
    code: "T21",
    dateLabel: "25 Eylül 2026",
    files: [{ name: "20260925195000_seed_command_center_meeting_t21.sql", rows: 28 }],
    total: 28,
    decisions: 9,
  },
];

const read = (name: string) => readFileSync(`${MIGRATIONS}/${name}`, "utf8");

describe.each(CASES)("$code komuta merkezi seed'i", ({ code, dateLabel, files, total, decisions }) => {
  const allSql = () => files.map(({ name }) => read(name)).join("\n");

  it("meeting-notes-data.ts içinde tanımlıdır", () => {
    const source = MEETING_SOURCES.find((entry) => entry.key === code);
    expect(source).toBeDefined();
    expect(source?.date).toBe(dateLabel);
    expect(SOURCE_COLORS[code]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("her dosya beklenen sayıda satır ekler ve toplamı SQL içinde doğrular", () => {
    for (const { name, rows } of files) {
      const matches = read(name).match(new RegExp(`'meeting_notes', '${code}', '${dateLabel}'`, "g")) ?? [];
      expect(matches, name).toHaveLength(rows);
    }
    expect(files.reduce((sum, file) => sum + file.rows, 0)).toBe(total);
    expect(read(files[files.length - 1].name)).toContain(`) <> ${total} then`);
  });

  it("her dosya idempotent guard içerir", () => {
    for (const { name } of files) {
      const sql = read(name);
      expect(sql, name).toContain("skipping");
      expect(sql, name).toMatch(/if exists \(/);
    }
    expect(read(files[0].name)).toContain(`legacy_source_date_label = '${dateLabel}'`);
  });

  it("yalnız geçerli assignee ve status değerlerini kullanır", () => {
    const pairs = Array.from(
      allSql().matchAll(new RegExp(`'${dateLabel}', '([^']+)', '([^']+)', 5, null`, "g")),
    ).map((match) => ({ assignee: match[1], status: match[2] }));

    expect(pairs).toHaveLength(total);
    for (const { assignee, status } of pairs) {
      expect(TODO_ASSIGNEES).toContain(assignee as (typeof TODO_ASSIGNEES)[number]);
      expect(STATUSES).toContain(status);
    }
  });

  it("karar satırları ortak (B+B) ve Beklemede durumundadır", () => {
    const rows = Array.from(allSql().matchAll(/\('meeting_note', 'KARAR: [^\n]+/g)).map((m) => m[0]);

    expect(rows).toHaveLength(decisions);
    for (const row of rows) {
      expect(row).toContain(`'${dateLabel}', 'B+B', 'Beklemede'`);
    }
  });

  it("yalnız tanımlı toplantı kategorilerini kullanır", () => {
    const categoryIds = new Set(MEETING_CATEGORIES.map((category) => category.id));
    const used = Array.from(
      allSql().matchAll(new RegExp(`'meeting_notes', '${code}', '${dateLabel}', '([^']+)'`, "g")),
    ).map((match) => match[1]);

    expect(used).toHaveLength(total);
    for (const category of used) {
      expect(categoryIds).toContain(category);
    }
  });
});
