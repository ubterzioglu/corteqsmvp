import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  EVENT_COVER_ACCEPT,
  EVENT_COVER_MAX_BYTES,
  EVENT_COVER_MIME_TYPES,
  validateEventCoverFile,
} from "./event-media";

const makeFile = (type: string, size: number, name = "kapak.jpg"): File => {
  const file = new File(["x"], name, { type });
  // `File` boyutu içerikten gelir; testte gerçek MB üretmemek için boyutu sabitliyoruz.
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("validateEventCoverFile", () => {
  it("izin verilen türleri ve sınır altındaki boyutu kabul eder", () => {
    for (const mime of EVENT_COVER_MIME_TYPES) {
      expect(validateEventCoverFile(makeFile(mime, 1024))).toBeNull();
    }
    expect(validateEventCoverFile(makeFile("image/jpeg", EVENT_COVER_MAX_BYTES))).toBeNull();
  });

  it("izin verilmeyen türü reddeder", () => {
    // ⚠️ `accept` niteliği yalnız bir ÖNERİDİR; dosya seçicide "Tüm dosyalar"a geçen
    // kullanıcı PDF de gönderebilir. Kapı burada da durmak zorunda.
    expect(validateEventCoverFile(makeFile("application/pdf", 1024, "belge.pdf"))).toContain("Yalnız");
    expect(validateEventCoverFile(makeFile("image/gif", 1024, "hareketli.gif"))).toContain("Yalnız");
    expect(validateEventCoverFile(makeFile("", 1024, "uzantisiz"))).toContain("Yalnız");
  });

  it("sınırı BİR bayt aşan dosyayı reddeder", () => {
    const problem = validateEventCoverFile(makeFile("image/jpeg", EVENT_COVER_MAX_BYTES + 1));
    expect(problem).toContain("5MB");
  });
});

// Bucket ile istemci AYNA sözleşmesindedir. Ayrışmanın bedeli ölçülmüştür: m94'te
// (Cadde videosu) istemci sınırı ile bucket tavanı ayrı ayrı değiştirildiğinde
// kullanıcı istemcide kabul edilen dosyada sunucudan anlamsız hata alıyordu.
//
// ✅ Bucket 2026-09-28'de CANLIYA UYGULANDI ve dosya `applied/` altına taşındı.
// ⚠️ Test yine de yalnız SQL METNİNİ denetler, canlı durumu değil — testin yeşil
// olması bucket'ın canlıda var olduğunu KANITLAMAZ.
describe("event-covers bucket'ı istemci denetimiyle hizada (A10a)", () => {
  const sql = readFileSync(
    "supabase/migrations/applied/20260928140000_event_covers_bucket.sql",
    "utf8",
  );

  it("boyut tavanı istemcideki 5 MB ile AYNI", () => {
    expect(sql).toContain("5242880");
    expect(EVENT_COVER_MAX_BYTES).toBe(5242880);
    expect(EVENT_COVER_MAX_BYTES).toBe(5 * 1024 * 1024);
  });

  it("bucket'ın izin verdiği MIME listesi istemciyle BİREBİR aynı", () => {
    for (const mime of EVENT_COVER_MIME_TYPES) {
      expect(sql).toContain(`'${mime}'`);
    }
    // Ters yön: SQL'de istemcinin tanımadığı bir tür OLMAMALI, yoksa sunucu
    // istemcinin reddettiği bir dosyayı sessizce kabul eder.
    const sqlMimes = sql.match(/'image\/[a-z0-9+.-]+'/g) ?? [];
    const uniqueSqlMimes = [...new Set(sqlMimes.map((raw) => raw.replaceAll("'", "")))];
    expect(uniqueSqlMimes.sort()).toEqual([...EVENT_COVER_MIME_TYPES].sort());
  });

  it("yazma kuralı kullanıcıyı KENDİ klasörüne hapseder", () => {
    // ⚠️ Yalnız `bucket_id`ye bakan bir kural, kullanıcı A'nın kullanıcı B'nin
    // klasörüne yazmasına izin verir — `service-attachments`'taki B2 kusuru buydu.
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it("bucket public READ'tir (kapak anonim etkinlik sayfasında gösteriliyor)", () => {
    expect(sql).toContain("'event-covers',\n  true,");
    expect(sql).toContain("for select to anon, authenticated");
  });
});

describe("EVENT_COVER_ACCEPT", () => {
  it("tek kaynaktan türetilir, elle yazılmaz", () => {
    expect(EVENT_COVER_ACCEPT).toBe(EVENT_COVER_MIME_TYPES.join(","));
  });
});
