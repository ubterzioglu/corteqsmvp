import { describe, expect, it } from "vitest";

import { gzipSync } from "node:zlib";

import {
  CHUNK_LIMIT_EXCEPTIONS,
  INITIAL_JS_GZIP_BUDGET_BYTES,
  MAX_JS_BYTES,
  exceedsInitialBudget,
  extractInitialScriptPaths,
  findOversizedChunks,
  measureInitialGzip,
} from "./check-bundle-size.mjs";

const KB = 1024;

describe("findOversizedChunks", () => {
  it("genel sınır 500 KB'tır ve aşan parça yakalanır", () => {
    expect(MAX_JS_BYTES).toBe(500 * KB);
    const out = findOversizedChunks([
      { name: "index-abc.js", size: 501 * KB },
      { name: "small-abc.js", size: 100 * KB },
    ]);
    expect(out.map((o) => o.name)).toEqual(["index-abc.js"]);
  });

  it("js olmayan dosyalar sayılmaz", () => {
    expect(findOversizedChunks([{ name: "hero.png", size: 5000 * KB }])).toEqual([]);
  });

  it("istisna yalnız ÖNEKİ eşleşen parçaya uygulanır, kendi tavanıyla", () => {
    const out = findOversizedChunks([
      { name: "admin-updates-X1.js", size: 900 * KB },
      { name: "admin-updates-X2.js", size: 1100 * KB },
      { name: "admin-other-X3.js", size: 600 * KB },
    ]);
    expect(out.map((o) => o.name)).toEqual(["admin-updates-X2.js", "admin-other-X3.js"]);
  });

  it("istisna listesi dar kalır: yalnız admin-updates, 1 MB", () => {
    expect(CHUNK_LIMIT_EXCEPTIONS).toEqual([{ prefix: "admin-updates-", maxBytes: 1024 * KB }]);
  });
});

describe("extractInitialScriptPaths", () => {
  const html = `
    <script src="/env-config.js" defer></script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-X"></script>
    <script src="/analytics.js" defer></script>
    <script type="module" crossorigin src="/assets/main-AAA.js"></script>
    <script crossorigin type="module" src="/assets/vendor-BBB.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/Landing-CCC.js">
    <link crossorigin href="/assets/Other-DDD.js" rel="modulepreload">
    <link rel="stylesheet" href="/assets/main-EEE.css">
    <link rel="modulepreload" href="/assets/main-AAA.js">
  `;

  it("modül betiklerini ve modulepreload bağlantılarını, öznitelik sırasından bağımsız toplar", () => {
    expect(extractInitialScriptPaths(html)).toEqual([
      "/assets/main-AAA.js",
      "/assets/vendor-BBB.js",
      "/assets/Landing-CCC.js",
      "/assets/Other-DDD.js",
    ]);
  });

  it("dış betikleri, düz /analytics.js'i ve css'i saymaz; yinelenenleri tek sayar", () => {
    const paths = extractInitialScriptPaths(html);
    expect(paths.some((p) => p.includes("googletagmanager") || p.includes("analytics") || p.endsWith(".css"))).toBe(
      false,
    );
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("measureInitialGzip", () => {
  it("ilk yükte gelen dosyaların gzip boyutlarını toplar; tembel (lazy) parçayı saymaz", () => {
    const eager = Buffer.from("a".repeat(5000));
    const lazy = Buffer.from("b".repeat(900000));
    const files = new Map([
      ["/assets/main-AAA.js", eager],
      ["/assets/Lazy-ZZZ.js", lazy],
    ]);
    const html = '<script type="module" src="/assets/main-AAA.js"></script>';
    const { totalGzipBytes, files: counted } = measureInitialGzip(html, (p) => files.get(p));
    expect(counted).toEqual(["/assets/main-AAA.js"]);
    expect(totalGzipBytes).toBe(gzipSync(eager).length);
  });

  it("HTML'in işaret ettiği dosya diskte yoksa AÇIKÇA düşer (sessizce 0 saymaz)", () => {
    expect(() => measureInitialGzip('<script type="module" src="/assets/yok.js"></script>', () => undefined)).toThrow(
      /yok\.js/,
    );
  });

  it("HTML hiç ilk-yük betiği içermiyorsa düşer (ayrıştırma bozulursa bütçe 0 KB ile geçmesin)", () => {
    expect(() => measureInitialGzip("<html></html>", () => Buffer.alloc(1))).toThrow(/ilk yük/);
  });
});

describe("INITIAL_JS_GZIP_BUDGET_BYTES", () => {
  it("bütçe = 8 Kasım 2026 ölçümü (258,2 KB gzip) × 1,05, KB'a yuvarlanmış; gevşetmek bilinçli karar ister", () => {
    // Üst sınır sabite BAĞLI: bütçe yükseltilirse bu test de bilerek güncellenmek zorunda kalır
    // (eskiden `<= 280 KB` ile 9 KB sessiz pay vardı).
    const MEASURED_GZIP_KB = 258.2;
    expect(INITIAL_JS_GZIP_BUDGET_BYTES).toBe(Math.round(MEASURED_GZIP_KB * 1.05) * KB);
  });
});
describe("exceedsInitialBudget", () => {
  it("bütçeyi aşan toplam yakalanır, tam bütçe ve altı geçer", () => {
    expect(exceedsInitialBudget(INITIAL_JS_GZIP_BUDGET_BYTES + 1)).toBe(true);
    expect(exceedsInitialBudget(INITIAL_JS_GZIP_BUDGET_BYTES)).toBe(false);
    expect(exceedsInitialBudget(1)).toBe(false);
  });

  it("açık bütçe parametresi varsayılanı geçersiz kılar", () => {
    expect(exceedsInitialBudget(101, 100)).toBe(true);
  });
});
