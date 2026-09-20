import { describe, expect, it } from "vitest";

import { escapeOrFilterValue } from "./events-api";

// Sözleşme testi — gevşetme, dosyayı düzelt.
//
// PostgREST `or()` sözdiziminde VİRGÜL koşul ayırıcıdır. Arama kutusuna virgül
// yazan kullanıcı ham gömüldüğünde ifadeyi ikiye böler, sunucu 400 döner ve
// etkinlik listesi "Etkinlikler yüklenemedi." ile TAMAMEN düşer. Hata mesajı
// kullanıcıya "arama bozuk" demez, sayfa boş gelir.

describe("or() filtre kaçışı", () => {
  it("virgül içeren aramayı ifade dışına taşırmaz", () => {
    const needle = escapeOrFilterValue("kültür, sanat");
    const expression = `title.ilike."%${needle}%",description.ilike."%${needle}%"`;
    // İfade tam olarak İKİ koşula bölünmeli — virgül tırnağın içinde kalmalı.
    expect(expression.split('",').length).toBe(2);
    expect(expression).toContain('"%kültür, sanat%"');
  });

  it("çift tırnak ve ters bölü kaçırılır", () => {
    expect(escapeOrFilterValue('a"b')).toBe('a\\"b');
    expect(escapeOrFilterValue("a\\b")).toBe("a\\\\b");
    // Ters bölü ÖNCE kaçırılmalı, yoksa çift kaçış birbirini bozar.
    expect(escapeOrFilterValue('a\\"b')).toBe('a\\\\\\"b');
  });

  it("Türkçe karakterlere dokunmaz", () => {
    expect(escapeOrFilterValue("İzmir buluşması")).toBe("İzmir buluşması");
  });

  it("sıradan aramayı değiştirmez", () => {
    expect(escapeOrFilterValue("networking")).toBe("networking");
  });
});
