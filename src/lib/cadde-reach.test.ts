import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildCaddeReachRows,
  caddeGlobalThresholdText,
  caddeReachPercent,
  resolveCaddeReachState,
  type CaddeFeedReach,
} from "./cadde-reach";

// Migration dosyaları `applied/` altında yaşar (CLAUDE.md: parent dizinde bırakılan
// dosya sürüm karşılaştırmasına girmez). Yol buna göre sabittir.
const REACH_MIGRATION = "supabase/migrations/applied/20260806140000_cadde_feed_reach_rpc.sql";

/** 06.08.2026 canlı ölçümünün birebir kopyası — Antalya/Türkiye izleyici. */
const RESOLVED: CaddeFeedReach = {
  signedIn: true,
  resolved: true,
  countryName: "Turkiye",
  cityName: "Antalya",
  rawCountry: "Türkiye",
  rawCity: "Antalya",
  reach: { sameCity: 3, sameCountry: 41, unresolved: 46, total: 90, members: 158 },
  thresholds: { enabled: true, minReactions: 10, minComments: 5, minShares: 10 },
};

const UNRESOLVED: CaddeFeedReach = {
  ...RESOLVED,
  resolved: false,
  countryName: null,
  cityName: null,
  rawCountry: "Belirtilmedi",
  rawCity: "Belirtilmedi",
  reach: { sameCity: 0, sameCountry: 0, unresolved: 46, total: 46, members: 158 },
};

describe("resolveCaddeReachState", () => {
  it("veri yoksa veya oturum yoksa signed-out döner", () => {
    expect(resolveCaddeReachState(null)).toBe("signed-out");
    expect(resolveCaddeReachState({ ...RESOLVED, signedIn: false })).toBe("signed-out");
  });

  it("konumu çözülen izleyici resolved", () => {
    expect(resolveCaddeReachState(RESOLVED)).toBe("resolved");
  });

  it("konumu çözülemeyen izleyici unresolved", () => {
    expect(resolveCaddeReachState(UNRESOLVED)).toBe("unresolved");
  });
});

describe("caddeReachPercent", () => {
  it("erişimi üye sayısına oranlar ve tam sayıya yuvarlar", () => {
    // 90 / 158 = %56.96 -> 57
    expect(caddeReachPercent(RESOLVED.reach)).toBe(57);
  });

  it("üye sayısı 0 iken sıfıra düşer (bölme hatası yok)", () => {
    expect(caddeReachPercent({ ...RESOLVED.reach, members: 0 })).toBe(0);
  });

  it("erişim üye sayısını aşarsa 100'de sınırlanır", () => {
    expect(caddeReachPercent({ ...RESOLVED.reach, total: 200, members: 158 })).toBe(100);
  });
});

describe("buildCaddeReachRows", () => {
  it("sıfır olan dalları gizler, dolu dalları kapı sırasında verir", () => {
    const rows = buildCaddeReachRows(RESOLVED);
    expect(rows.map((row) => row.key)).toEqual(["sameCity", "sameCountry", "unresolved"]);
    // Etiketler bilinçli olarak Türkçe EK ALMAZ ("Antalya'daki" / "Berlin'deki" /
    // "Frankfurt'taki" ünlü+ünsüz uyumuna göre değişir; şehir adı veriden geliyor).
    expect(rows[0]).toMatchObject({ label: "Aynı şehir · Antalya", count: 3 });
    expect(rows[1]).toMatchObject({ label: "Aynı ülke · Turkiye", count: 41 });
    expect(rows[2]).toMatchObject({ label: "Konumu tanımsız üyeler", count: 46 });
  });

  it("şehri çözülmeyen izleyicide şehir satırı hiç çıkmaz", () => {
    const rows = buildCaddeReachRows(UNRESOLVED);
    expect(rows.map((row) => row.key)).toEqual(["unresolved"]);
  });

  it("şehir adı yoksa ülke satırı yine de doğru etiketlenir", () => {
    const rows = buildCaddeReachRows({
      ...RESOLVED,
      cityName: null,
      reach: { ...RESOLVED.reach, sameCity: 0 },
    });
    expect(rows.map((row) => row.key)).toEqual(["sameCountry", "unresolved"]);
  });
});

describe("caddeGlobalThresholdText", () => {
  it("üç eşiği okunur tek satırda birleştirir", () => {
    expect(caddeGlobalThresholdText(RESOLVED.thresholds)).toBe("10 reaksiyon · 5 yorum · 10 paylaşım");
  });

  it("global akış kapalıysa eşik yerine kapalı bilgisini verir", () => {
    expect(caddeGlobalThresholdText({ ...RESOLVED.thresholds, enabled: false })).toBe("Global akış şu an kapalı");
  });
});

// ── SQL ↔ TS ayna sözleşmesi (CLAUDE.md) ─────────────────────────────────────
// Kart ile feed aynı kuralı anlatmak zorunda. Bu testler RPC'nin metnini okur;
// birini değiştiren diğerini de güncellemek zorunda kalır.
describe("get_cadde_feed_reach_v1 ayna sözleşmesi", () => {
  const sql = readFileSync(REACH_MIGRATION, "utf8");

  it("kartın okuduğu üç eşik anahtarını da döndürür", () => {
    for (const key of ["minReactions", "minComments", "minShares"]) {
      expect(sql).toContain(key);
    }
    expect(sql).toContain("cadde.global.enabled");
  });

  it("sayım dalları list_cadde_feed_v1 kapısıyla aynı üç kategoridir", () => {
    for (const key of ["sameCity", "sameCountry", "unresolved"]) {
      expect(sql).toContain(key);
    }
  });

  it("çözümleme tek kaynaktan gelir — kart kendi eşleştirme kuralını yazmaz", () => {
    expect(sql).toContain("cadde_resolve_viewer_location(v_uid)");
    expect(sql).toContain("cadde_resolve_location_text(t.ulke, t.sehir)");
  });

  it("sayım DISTINCT-FIRST kalır (904 MB üretim örneği kuralı)", () => {
    expect(sql).toContain("select distinct ulke, sehir from ham");
  });

  it("şehir köprüsü geo_cities'i SÜRÜCÜ tablo yapmaz", () => {
    // geo_cities'ten başlayan bir join 76.990 satırda fold çalıştırma riski taşır.
    expect(sql).not.toMatch(/from\s+public\.geo_cities\s+g\s*\n\s*join\s+public\.cadde_cities/);
    expect(sql).toContain("join public.geo_cities g on g.id = cc.geo_city_id");
  });

  it("sürüm kaydını kendi içinde atar", () => {
    expect(sql).toContain("supabase_migrations.schema_migrations");
    expect(sql).toContain("'20260806140000'");
  });
});
