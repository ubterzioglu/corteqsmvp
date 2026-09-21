import { describe, expect, it } from "vitest";

import { KNOWLEDGE_SOURCES, findSource, isPlaceholderTitle, sourceKeys } from "./sources.mjs";

describe("isPlaceholderTitle", () => {
  it("[PLACEHOLDER] on ekli kaydi yakalar", () => {
    expect(isPlaceholderTitle("[PLACEHOLDER] Sehir Elcisi")).toBe(true);
    expect(isPlaceholderTitle("[placeholder] Egitim Kurumu")).toBe(true);
  });

  it("bastaki bosluga takilmaz", () => {
    expect(isPlaceholderTitle("  [PLACEHOLDER] Doktor")).toBe(true);
  });

  it("gercek kaydi ELEMEZ", () => {
    expect(isPlaceholderTitle("Ali Arouk")).toBe(false);
    expect(isPlaceholderTitle("Dortmund Turk Dernegi")).toBe(false);
  });

  it("on ek ORTADA geciyorsa elemez — yalniz basi sayilir", () => {
    expect(isPlaceholderTitle("Gercek Kayit [PLACEHOLDER] degil")).toBe(false);
  });

  it("bos ve tanimsiz degeri guvenle isler", () => {
    expect(isPlaceholderTitle("")).toBe(false);
    expect(isPlaceholderTitle(null)).toBe(false);
    expect(isPlaceholderTitle(undefined)).toBe(false);
  });
});

describe("kaynak kayit defteri", () => {
  it("her kaynagin benzersiz anahtari vardir", () => {
    const keys = sourceKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("her kaynak gecerli bir kitle etiketi tasir", () => {
    for (const source of KNOWLEDGE_SOURCES) {
      // Migration'daki CHECK kisitiyla ayni kume — ayrisirsa yazma aninda patlar.
      expect(["public", "member", "admin"]).toContain(source.audience);
    }
  });

  it("her kaynagin load fonksiyonu vardir", () => {
    for (const source of KNOWLEDGE_SOURCES) {
      expect(typeof source.load).toBe("function");
    }
  });

  it("MVP korpusu katalog ve blogdan ibarettir", () => {
    // Dokumanlar bilincli olarak DISARIDA — bkz. kalan isler K1.
    expect(sourceKeys().sort()).toEqual(["blog", "catalog"]);
  });

  it("findSource bilinmeyen anahtar icin null doner", () => {
    expect(findSource("yok-boyle-bir-kaynak")).toBeNull();
    expect(findSource("blog")?.key).toBe("blog");
  });
});
