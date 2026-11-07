import { describe, expect, it } from "vitest";

import { CHUNK_LIMIT_EXCEPTIONS, MAX_JS_BYTES, findOversizedChunks } from "./check-bundle-size.mjs";

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
