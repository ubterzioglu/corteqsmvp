import { describe, expect, it } from "vitest";

import { parseImportText } from "@/lib/catalog-import-api";

describe("parseImportText — JSON", () => {
  it("geçerli JSON dizisini ImportRecord[]'a çevirir, eksik alanları boş stringe doldurur", () => {
    const raw = JSON.stringify([
      { name: "Dr. Tevfik Kahraman", city: "Melbourne", profession: "Doctor" },
    ]);
    const records = parseImportText(raw, "json");
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Dr. Tevfik Kahraman");
    expect(records[0].city).toBe("Melbourne");
    expect(records[0].company).toBe("");
    expect(records[0].phone).toBe("");
  });

  it("isim eksikse doğrulama hatası fırlatır", () => {
    const raw = JSON.stringify([{ company: "ACME", city: "Melbourne" }]);
    expect(() => parseImportText(raw, "json")).toThrow(/Doğrulama hatası/);
  });

  it("dizi olmayan JSON reddedilir", () => {
    expect(() => parseImportText(JSON.stringify({ name: "x" }), "json")).toThrow(/dizi/);
  });

  it("bozuk JSON anlamlı hata verir", () => {
    expect(() => parseImportText("{ not json", "json")).toThrow(/Geçersiz JSON/);
  });

  it("boş metin reddedilir", () => {
    expect(() => parseImportText("   ", "json")).toThrow(/boş/);
  });
});

describe("parseImportText — CSV", () => {
  it("İngilizce başlıklı virgüllü CSV'yi ayrıştırır", () => {
    const raw = ["Name,Company,City,Profession,Phone", "Meryem Apak,Melbourne Lawyers,Melbourne,Lawyer,+61 400 000"].join("\n");
    const records = parseImportText(raw, "csv");
    expect(records).toHaveLength(1);
    expect(records[0].name).toBe("Meryem Apak");
    expect(records[0].company).toBe("Melbourne Lawyers");
    expect(records[0].profession).toBe("Lawyer");
    expect(records[0].phone).toBe("+61 400 000");
  });

  it("Türkçe başlıkları (İsim/Şehir/Meslek) eşler", () => {
    const raw = ["İsim;Şehir;Meslek", "Esra Aydinli;Melbourne;Muhasebeci"].join("\n");
    const records = parseImportText(raw, "csv");
    expect(records[0].name).toBe("Esra Aydinli");
    expect(records[0].city).toBe("Melbourne");
    expect(records[0].profession).toBe("Muhasebeci");
  });

  it("noktalı virgül delimiter'ını otomatik sezer", () => {
    const raw = ["name;city", "Ali;Sydney"].join("\n");
    const records = parseImportText(raw, "csv");
    expect(records[0].name).toBe("Ali");
    expect(records[0].city).toBe("Sydney");
  });

  it("tırnak içindeki delimiter'ı korur", () => {
    const raw = ['name,address', '"Volkan Tumay","Meadow Heights, VIC"'].join("\n");
    const records = parseImportText(raw, "csv");
    expect(records[0].name).toBe("Volkan Tumay");
    expect(records[0].address).toBe("Meadow Heights, VIC");
  });

  it("name sütunu yoksa hata fırlatır", () => {
    const raw = ["company,city", "ACME,Melbourne"].join("\n");
    expect(() => parseImportText(raw, "csv")).toThrow(/name\/isim\/ad/);
  });

  it("yalnız başlık satırı olan CSV reddedilir", () => {
    expect(() => parseImportText("name,city", "csv")).toThrow(/başlık ve bir veri/);
  });
});
