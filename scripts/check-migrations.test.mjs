import { describe, expect, it } from "vitest";

import { diffMigrations, expectedVersionsFor, versionOf } from "./check-migrations.mjs";

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
