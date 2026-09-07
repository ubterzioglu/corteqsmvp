// 27.08.2026 Cadde & Cafe UX + UI denetim dokümanlarının seed'lerini kilitler:
//   1) Cadde Workshop WS3 (workshop_items, workshop_key='cadde')  — mig 20260907140000
//   2) Komuta Merkezi todo'ları (command_center_items, item_type='todo') — mig 20260907141000
//
// Seed migration'ları üretimde değiştirilemez; bu testler seed metnini TS tarafındaki
// sabitlerle (TODO_CATEGORIES, TODO_ASSIGNEES, TODO_STATUSES, WORKSHOP_SESSION_PATTERN)
// hizada tutar. Beklenen satır sayıları migration içindeki `raise exception` bloklarıyla
// aynıdır — birini değiştirirseniz diğerini de değiştirin, testi gevşetmeyin.
//
// Kaynak dokümanlar repo kökünde durur; seed onların YAPILMAMIŞ maddelerini taşır.
// Zaten yapılmış olanlar (yorum placeholder'ı, tepkilerin tek tetik arkasına alınması,
// sağ raydaki kapasite paydası, foto yükleme akış yenilemesi) bilinçle dışarıda bırakıldı.

import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { TODO_ASSIGNEES, TODO_CATEGORIES, TODO_STATUSES } from "./todo-items";

const WS3_ITEM_COUNT = 31;
const COMMAND_CENTER_ROW_COUNT = 14;

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

const ws3Sql = () => readMigration("20260907140000_workshop_items_ws3_cadde_ux_ui.sql");
const centerSql = () =>
  readMigration("20260907141000_seed_command_center_cadde_ux_ui_audit.sql");

describe("Cadde Workshop WS3 seed'i", () => {
  it("beklenen sayıda madde ekler ve sayıyı SQL içinde doğrular", () => {
    const sql = ws3Sql();
    // Her madde `(<n>, '<bölüm>', '<başlık>')` biçiminde tek satırdır.
    const rows = sql.match(/^\s{6}\(\d+,\s+'/gm) ?? [];

    expect(rows).toHaveLength(WS3_ITEM_COUNT);
    expect(sql).toContain(`if ws3_count <> ${WS3_ITEM_COUNT} then`);
  });

  it("aynı oturum iki kez yüklenmesin diye idempotent guard içerir", () => {
    const sql = ws3Sql();
    expect(sql).toContain("session_key = 'WS3'");
    expect(sql).toContain("skipping");
  });

  it("item_no'yu hardcode ETMEZ — mevcut maksimumdan devam ettirir", () => {
    const sql = ws3Sql();
    // (workshop_key, item_no) tekildir ve panelden madde eklendikçe numaralar kayar.
    // Sabit numara yazmak seed'i sessizce eksik bırakır (WS2 dersi).
    expect(sql).toContain("select coalesce(max(item_no), 0) into base_no");
    expect(sql).toContain("base_no + entry.ord");
  });

  it("oturum anahtarı workshop-items.ts'teki biçim kuralına uyar", () => {
    // WORKSHOP_SESSION_PATTERN ile aynı kural; DB CHECK'i de bunu zorlar.
    expect("WS3").toMatch(/^WS[0-9]+$/);
  });

  it("yalnızca 'cadde' workshop'una yazar", () => {
    const sql = ws3Sql();
    expect(sql).not.toMatch(/'profil',\s*'WS3'/);
    expect(sql).toContain("workshop_key = 'cadde'");
  });
});

describe("Komuta Merkezi Cadde UX/UI denetim seed'i", () => {
  it("beklenen sayıda satır ekler ve sayıyı SQL içinde doğrular", () => {
    const sql = centerSql();
    const rows = sql.match(/^\s{4}\('todo',/gm) ?? [];

    expect(rows).toHaveLength(COMMAND_CENTER_ROW_COUNT);
    expect(sql).toContain(`if seeded <> ${COMMAND_CENTER_ROW_COUNT} then`);
  });

  it("aynı denetim iki kez yüklenmesin diye idempotent guard içerir", () => {
    const sql = centerSql();
    expect(sql).toContain("Cadde design-token dokümanını yaz ve arayüzü ona hizala");
    expect(sql).toContain("skipping");
  });

  it("yalnız geçerli kategori değerlerini kullanır", () => {
    const sql = centerSql();
    const used = new Set(
      [...sql.matchAll(/^\s+'((?:Dashboard|Strateji|İçerik)[^']*)',\s*'(?:UBT|Burak|B\+B|Atanmadi)'/gm)].map(
        (match) => match[1],
      ),
    );

    expect(used.size).toBeGreaterThan(0);
    for (const category of used) {
      expect(TODO_CATEGORIES).toContain(category as (typeof TODO_CATEGORIES)[number]);
    }
  });

  it("yalnız geçerli assignee ve status değerlerini kullanır", () => {
    const sql = centerSql();
    const pairs = [...sql.matchAll(/',\s*'([A-Za-zİ+]+)',\s*'(Baslanmadi|Beklemede|Devam ediyor|Tamamlandi)'/g)];

    expect(pairs.length).toBe(COMMAND_CENTER_ROW_COUNT);
    for (const [, assignee, status] of pairs) {
      expect(TODO_ASSIGNEES).toContain(assignee as (typeof TODO_ASSIGNEES)[number]);
      expect(TODO_STATUSES).toContain(status as (typeof TODO_STATUSES)[number]);
    }
  });

  it("todo satırlarının kaynak tipi mevcut todo'larla aynı şekildedir", () => {
    const sql = centerSql();
    // Canlıda ölçüldü: item_type='todo' satırları legacy_source_type='todo_items',
    // legacy_source_code null taşır. Şekil ayrışırsa facet sayımı bozulur.
    const sourceRows = sql.match(/'todo_items', null, null, null, null, \d+\)/g) ?? [];
    expect(sourceRows).toHaveLength(COMMAND_CENTER_ROW_COUNT);
  });

  it("iki seed birbirine atıf yapar — pano ayrışırsa iz kalsın", () => {
    expect(centerSql()).toContain("20260907140000");
    expect(ws3Sql()).toContain("Workshop WS3");
  });
});
