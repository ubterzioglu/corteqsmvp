import { describe, expect, it } from "vitest";

import {
  diffMigrations,
  expectedVersionsFor,
  findStrayParentMigrations,
  versionOf,
} from "./check-migrations.mjs";

describe("versionOf", () => {
  it("dosya adından zaman damgasını ayıklar", () => {
    expect(versionOf("20260804160000_revision_request_notification.sql")).toBe("20260804160000");
  });

  it("alt çizgisiz dosya adında .sql uzantısını atar", () => {
    expect(versionOf("20260804160000.sql")).toBe("20260804160000");
  });
});

describe("expectedVersionsFor", () => {
  it("tek dosyalı damga için yalnız kendisini bekler", () => {
    expect(expectedVersionsFor("20260804160000", 1)).toEqual(["20260804160000"]);
  });

  it("çakışan damga için ardışık sürümler bekler (canlıda ikincisi +1 kaydedilir)", () => {
    expect(expectedVersionsFor("20260718120000", 2)).toEqual(["20260718120000", "20260718120001"]);
  });

  it("saniye taşmasında sayısal artışı korur", () => {
    // Not: damga tarih DEĞİL sayı gibi artar — 59'dan sonra 60 gelir. Canlıdaki kayıt da
    // böyle oluştuğu için karşılaştırma tutar; burada beklenti gerçeği yansıtır.
    expect(expectedVersionsFor("20260718125959", 2)).toEqual(["20260718125959", "20260718125960"]);
  });
});

describe("diffMigrations", () => {
  it("dosyalar ve canlı kayıtlar birebir eşleşince temiz döner", () => {
    const result = diffMigrations({
      fileVersions: ["20260101000000", "20260102000000"],
      dbVersions: ["20260101000000", "20260102000000"],
    });
    expect(result.ok).toBe(true);
    expect(result.missingInDb).toEqual([]);
    expect(result.missingLocally).toEqual([]);
  });

  it("canlıda kaydı olmayan migration'ı yakalar", () => {
    const result = diffMigrations({
      fileVersions: ["20260101000000", "20260102000000"],
      dbVersions: ["20260101000000"],
    });
    expect(result.ok).toBe(false);
    expect(result.missingInDb).toEqual(["20260102000000"]);
  });

  it("canlıda olup dosyası olmayan kaydı yakalar", () => {
    const result = diffMigrations({
      fileVersions: ["20260101000000"],
      dbVersions: ["20260101000000", "20260109000000"],
    });
    expect(result.ok).toBe(false);
    expect(result.missingLocally).toEqual(["20260109000000"]);
  });

  it("çakışan damgayı yanlış alarm ÜRETMEDEN kabul eder", () => {
    const result = diffMigrations({
      fileVersions: ["20260718120000", "20260718120000"],
      dbVersions: ["20260718120000", "20260718120001"],
    });
    expect(result.ok).toBe(true);
    expect(result.duplicateTimestamps).toEqual([{ version: "20260718120000", count: 2 }]);
  });

  it("çakışan damganın İKİNCİ kaydı eksikse yine de sapma bildirir", () => {
    const result = diffMigrations({
      fileVersions: ["20260718120000", "20260718120000"],
      dbVersions: ["20260718120000"],
    });
    expect(result.ok).toBe(false);
    expect(result.missingInDb).toEqual(["20260718120001"]);
  });

  it("parent dizinde bekleyen dosya diffMigrations'ı ETKİLEMEZ — ayrı sinyaldir", () => {
    // Bu, 2026-08-05'te yaşanan sessiz başarısızlığın kaydı: parent dizindeki dosya
    // applied/archive taramasına girmediği için diffMigrations onu hiç görmez ve
    // "sapma yok" der. Doğru cevap findStrayParentMigrations'tan gelir, buradan değil.
    const result = diffMigrations({
      fileVersions: ["20260101000000"],
      dbVersions: ["20260101000000"],
    });
    expect(result.ok).toBe(true);
  });

  it("canlıdaki gerçek durumu (352 dosya / 350 benzersiz damga) temiz sayar", () => {
    // 2026-08-04'te ölçülen gerçek şekil: iki damga ikişer dosya taşıyor,
    // canlıda karşılıkları ...0000 ve ...0001 olarak duruyor.
    const fileVersions = [
      "20260718120000",
      "20260718120000",
      "20260718130000",
      "20260718130000",
      "20260804160000",
    ];
    const dbVersions = [
      "20260718120000",
      "20260718120001",
      "20260718130000",
      "20260718130001",
      "20260804160000",
    ];
    expect(diffMigrations({ fileVersions, dbVersions }).ok).toBe(true);
  });
});

describe("findStrayParentMigrations", () => {
  // NEDEN VAR: 2026-08-05'te `20260805200000_cadde_geo_bridge_backfill.sql` parent
  // dizinde (supabase/migrations/) kaldı. MIGRATION_DIRS yalnız applied/ + archive/
  // tarıyor, dolayısıyla denetim dosyayı HİÇ görmedi ve "sapma yok" raporladı — oysa
  // migration canlıya uygulanmamıştı. Bu, CLAUDE.md'nin "sessiz başarısızlık" sınıfı.

  it("parent dizinde .sql yokken temiz döner", () => {
    expect(findStrayParentMigrations(["applied", "archive"])).toEqual([]);
  });

  it("parent dizinde kalan .sql dosyasını yakalar", () => {
    expect(
      findStrayParentMigrations(["applied", "archive", "20260805200000_cadde_geo_bridge_backfill.sql"]),
    ).toEqual(["20260805200000_cadde_geo_bridge_backfill.sql"]);
  });

  it("birden fazla dosyayı ada göre sıralı döndürür", () => {
    expect(findStrayParentMigrations(["20260901000000_b.sql", "20260801000000_a.sql"])).toEqual([
      "20260801000000_a.sql",
      "20260901000000_b.sql",
    ]);
  });

  it(".sql olmayan girdileri yok sayar", () => {
    expect(findStrayParentMigrations(["applied", "archive", "README.md", "notlar.txt"])).toEqual([]);
  });

  it("boş listede patlamaz", () => {
    expect(findStrayParentMigrations([])).toEqual([]);
  });
});
