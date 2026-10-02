import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// Sözleşme testi — gevşetme, dosyayı düzelt.
//
// 19 Eylül 2026'da `submitLanding` insert yüküne `platform: input.platform ?? null`
// eklendi. `whatsapp_landings` tablosunda öyle bir sütun YOK (ne baseline dump'ta,
// ne 397 migration'ın herhangi birinde, ne de üretilen `types.ts` içinde). Yük
// `as TablesInsert<"whatsapp_landings">` ile CAST edildiği için tsc sustu ve hata
// yalnız canlıda, herkese açık grup ekleme formunda görünecekti:
//
//   PGRST204 — Could not find the 'platform' column of 'whatsapp_landings'
//
// Bu test iki şeyi kilitler: (1) yük hâlâ `satisfies` ile DOĞRULANIYOR (cast değil),
// (2) yükün her anahtarı `types.ts`'teki gerçek Insert sözleşmesinde var.
//
// GÜNCELLEME (2 Ekim 2026, G10): `20261002020000_whatsapp_landings_group_schema`
// migration'ı `platform` sütununu ekledi ve types.ts yeniden üretildi — yukarıdaki
// "sütun YOK" tespiti tarihîdir. Yeni sözleşme üçüncü testte: sütun VAR, ama yük
// entegrasyon işine dek platformu `description` etiketinden saklamaya devam eder.

const LANDINGS_SOURCE = resolve(process.cwd(), "src/lib/whatsapp-landings.ts");
const TYPES_SOURCE = resolve(process.cwd(), "src/integrations/supabase/types.ts");

/** `types.ts` içindeki `whatsapp_landings` → `Insert: { ... }` bloğunun alan adları. */
function readInsertColumns(): string[] {
  const source = readFileSync(TYPES_SOURCE, "utf8");
  const tableStart = source.indexOf("      whatsapp_landings: {");
  expect(tableStart, "types.ts içinde whatsapp_landings tanımı bulunamadı").toBeGreaterThan(-1);

  const insertStart = source.indexOf("        Insert: {", tableStart);
  expect(insertStart, "whatsapp_landings için Insert bloğu bulunamadı").toBeGreaterThan(-1);

  const insertEnd = source.indexOf("\n        }", insertStart);
  expect(insertEnd, "Insert bloğu kapanışı bulunamadı").toBeGreaterThan(-1);

  const block = source.slice(insertStart, insertEnd);

  return [...block.matchAll(/^\s{10}(\w+)\??:/gm)].map((match) => match[1]);
}

/** `submitLanding` içindeki `const payload = { ... }` bloğunun anahtarları. */
function readPayloadKeys(): string[] {
  const source = readFileSync(LANDINGS_SOURCE, "utf8");
  const start = source.indexOf("  const payload = {");
  expect(start, "submitLanding içinde payload bloğu bulunamadı").toBeGreaterThan(-1);

  const end = source.indexOf("\n  } satisfies TablesInsert<\"whatsapp_landings\">;", start);
  expect(end, "payload bloğu `satisfies TablesInsert<...>` ile kapanmıyor").toBeGreaterThan(-1);

  const block = source.slice(start, end);
  return [...block.matchAll(/^\s{4}(\w+):/gm)].map((match) => match[1]);
}

describe("whatsapp_landings insert sözleşmesi", () => {
  it("yük tip CAST'i ile değil `satisfies` ile doğrulanır", () => {
    const source = readFileSync(LANDINGS_SOURCE, "utf8");
    expect(source).not.toContain('} as TablesInsert<"whatsapp_landings">');
    expect(source).toContain('} satisfies TablesInsert<"whatsapp_landings">');
  });

  it("yükün her anahtarı tabloda gerçekten vardır", () => {
    const columns = new Set(readInsertColumns());
    const payloadKeys = readPayloadKeys();

    expect(payloadKeys.length).toBeGreaterThan(5);
    expect(payloadKeys.filter((key) => !columns.has(key))).toEqual([]);
  });

  it("`platform` sütunu var ama yük ona yazmaz — geçiş entegrasyon işinde", () => {
    // G10 sütunu ekledi; canlı paket ve moderasyon akışı platformu hâlâ
    // `description` etiketinde tutuyor. İki kaynağın aynı anda yazılması değeri
    // ayrıştırır, bu yüzden sütuna geçiş tek bir entegrasyon işinde yapılacak.
    expect(readInsertColumns()).toContain("platform");
    expect(readPayloadKeys()).not.toContain("platform");
  });

  it("platform bilgisi description etiketi üzerinden saklanmaya devam eder", () => {
    const source = readFileSync(LANDINGS_SOURCE, "utf8");
    expect(source).toContain("[Platform: ");
    expect(source).toContain('parseTagValue(row.description, "Platform")');
  });
});
