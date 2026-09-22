// Relocation içerik biçimlendirme — sözleşme testleri.
//
// Bu testlerin çoğu, referans Lovable uygulamasındaki SOMUT kusurların geri
// gelmemesi için vardır:
//   • veri olmayan ülkede başka ülkenin rakamını göstermek,
//   • aileyi 1.6 katsayısıyla çarpıp uydurma tutar üretmek,
//   • tutarı metin olarak saklayıp toplanamaz hale getirmek.

import { describe, expect, it } from "vitest";
import {
  COST_ITEM_ORDER,
  completionPercent,
  formatCostAmount,
  formatCostRange,
  groupCostsByScope,
  groupCostsByItem,
  groupDocumentsByCategory,
  pickRowForHousehold,
  sumMonthlyCosts,
} from "@/lib/relocation-content-format";
import type {
  RelocationLivingCostRow,
  RelocationRequiredDocumentRow,
} from "@/lib/relocation-content-types";

const costRow = (patch: Partial<RelocationLivingCostRow>): RelocationLivingCostRow => ({
  id: patch.id ?? crypto.randomUUID(),
  country_code: "DE",
  city_code: null,
  item_key: "rent",
  amount_min: 800,
  amount_max: 1500,
  currency: "EUR",
  household_size: 1,
  period: "monthly",
  note: null,
  is_active: true,
  ...patch,
});

const docRow = (patch: Partial<RelocationRequiredDocumentRow>): RelocationRequiredDocumentRow => ({
  id: patch.id ?? crypto.randomUUID(),
  country_code: "DE",
  doc_name: "Pasaport",
  category: "Kimlik",
  note: null,
  sort_order: 0,
  is_active: true,
  ...patch,
});

describe("formatCostAmount", () => {
  it("tutarı Türkçe yerel ayarla biçimlendirir", () => {
    const out = formatCostAmount(1500, "EUR");
    // Binlik ayırıcı nokta olmalı (tr-TR); "1,500" İngilizce biçimdir.
    expect(out).toContain("1.500");
  });

  it("null tutarda uydurmaz, tire döner", () => {
    expect(formatCostAmount(null, "EUR")).toBe("—");
  });
});

describe("formatCostRange", () => {
  it("min ve max varsa aralık kurar", () => {
    const out = formatCostRange({ amount_min: 800, amount_max: 1500, currency: "EUR" });
    expect(out).toContain("800");
    expect(out).toContain("1.500");
    expect(out).toContain("–");
  });

  it("yalnız min varsa tek değer gösterir", () => {
    const out = formatCostRange({ amount_min: 800, amount_max: null, currency: "EUR" });
    expect(out).not.toContain("–");
    expect(out).toContain("800");
  });

  it("min ve max eşitse aralık kurmaz", () => {
    const out = formatCostRange({ amount_min: 900, amount_max: 900, currency: "EUR" });
    expect(out).not.toContain("–");
  });

  it("veri yoksa BAŞKA bir değer uydurmaz", () => {
    expect(formatCostRange({ amount_min: null, amount_max: null, currency: "EUR" })).toBe("—");
  });
});

describe("pickRowForHousehold", () => {
  it("tam eşleşen hane satırını seçer", () => {
    const rows = [
      costRow({ household_size: 1, amount_min: 800 }),
      costRow({ household_size: 4, amount_min: 1600 }),
    ];
    expect(pickRowForHousehold(rows, 4)?.amount_min).toBe(1600);
  });

  it("tam eşleşme yoksa haneyi AŞMAYAN en büyük satırı seçer", () => {
    const rows = [
      costRow({ household_size: 1, amount_min: 800 }),
      costRow({ household_size: 2, amount_min: 1100 }),
    ];
    expect(pickRowForHousehold(rows, 4)?.household_size).toBe(2);
  });

  it("hane satırın altındaysa en küçük satıra düşer", () => {
    const rows = [costRow({ household_size: 3, amount_min: 1400 })];
    expect(pickRowForHousehold(rows, 1)?.household_size).toBe(3);
  });

  it("KATSAYIYLA ÇARPMAZ — referanstaki *1.6 uydurmasını tekrarlamaz", () => {
    const rows = [costRow({ household_size: 1, amount_min: 1000, amount_max: 2000 })];
    const picked = pickRowForHousehold(rows, 5);
    expect(picked?.amount_min).toBe(1000);
    expect(picked?.amount_max).toBe(2000);
  });

  it("satır yoksa null döner", () => {
    expect(pickRowForHousehold([], 2)).toBeNull();
  });
});

describe("groupCostsByItem", () => {
  it("COST_ITEM_ORDER sırasını korur", () => {
    const rows = [
      costRow({ item_key: "childcare" }),
      costRow({ item_key: "rent" }),
      costRow({ item_key: "transport" }),
    ];
    expect(groupCostsByItem(rows).map((g) => g.item_key)).toEqual([
      "rent",
      "transport",
      "childcare",
    ]);
  });

  it("verisi olmayan kalemi listelemez", () => {
    const groups = groupCostsByItem([costRow({ item_key: "rent" })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].item_key).toBe("rent");
  });

  it("boş girdide boş dizi döner", () => {
    expect(groupCostsByItem([])).toEqual([]);
  });

  it("sıralama listesi altı kalemin tamamını kapsar", () => {
    expect(COST_ITEM_ORDER).toHaveLength(6);
  });
});

describe("groupCostsByScope", () => {
  it("iki ülkenin AYNI kalemini birleştirmez", () => {
    const rows = [
      costRow({ id: "de", country_code: "DE", item_key: "rent", amount_min: 800 }),
      costRow({ id: "nl", country_code: "NL", item_key: "rent", amount_min: 900 }),
    ];
    const byScope = groupCostsByScope(rows);
    expect(byScope).toHaveLength(2);

    const de = byScope.find((c) => c.country_code === "DE");
    const nl = byScope.find((c) => c.country_code === "NL");
    expect(de?.groups[0].rows[0].amount_min).toBe(800);
    expect(nl?.groups[0].rows[0].amount_min).toBe(900);
  });

  it("ülke içi toplam yalnız O ÜLKENİN satırlarından hesaplanır", () => {
    const rows = [
      costRow({ id: "de1", country_code: "DE", item_key: "rent", amount_min: 800, amount_max: 800 }),
      costRow({ id: "nl1", country_code: "NL", item_key: "rent", amount_min: 900, amount_max: 900 }),
    ];
    const de = groupCostsByScope(rows).find((c) => c.country_code === "DE");
    expect(sumMonthlyCosts(de?.rows ?? [])).toEqual({ min: 800, max: 800, currency: "EUR" });
  });

  it("tek ülkede tek grup döner", () => {
    expect(groupCostsByScope([costRow({ country_code: "DE" })])).toHaveLength(1);
  });

  it("boş girdide boş dizi döner", () => {
    expect(groupCostsByScope([])).toEqual([]);
  });

  // B29: city_code doldurulduğu gün sessizce yanlış rakam gösterecek olan kusur.
  it("ŞEHİR satırı ile ÜLKE GENELİ satırını birleştirmez", () => {
    const rows = [
      costRow({ id: "de", country_code: "DE", city_code: null, item_key: "rent", amount_min: 800 }),
      costRow({ id: "berlin", country_code: "DE", city_code: "BER", item_key: "rent", amount_min: 1400 }),
    ];
    const scopes = groupCostsByScope(rows);
    expect(scopes).toHaveLength(2);

    const ulkeGeneli = scopes.find((s) => s.city_code === null);
    const berlin = scopes.find((s) => s.city_code === "BER");
    expect(ulkeGeneli?.groups[0].rows[0].amount_min).toBe(800);
    expect(berlin?.groups[0].rows[0].amount_min).toBe(1400);
  });

  it("iki ŞEHRİ birbirine karıştırmaz", () => {
    const rows = [
      costRow({ id: "ber", country_code: "DE", city_code: "BER", item_key: "rent", amount_min: 1400 }),
      costRow({ id: "muc", country_code: "DE", city_code: "MUC", item_key: "rent", amount_min: 1800 }),
    ];
    const scopes = groupCostsByScope(rows);
    expect(scopes.map((s) => s.city_code)).toEqual(["BER", "MUC"]);
  });

  it("ülke geneli, o ülkenin şehir kapsamlarından ÖNCE gelir", () => {
    const rows = [
      costRow({ id: "muc", country_code: "DE", city_code: "MUC" }),
      costRow({ id: "de", country_code: "DE", city_code: null }),
      costRow({ id: "nl", country_code: "NL", city_code: null }),
    ];
    expect(groupCostsByScope(rows).map((s) => `${s.country_code}/${s.city_code ?? "-"}`)).toEqual([
      "DE/-",
      "DE/MUC",
      "NL/-",
    ]);
  });

  it("kapsam toplamı yalnız O KAPSAMIN satırlarından hesaplanır", () => {
    const rows = [
      costRow({ id: "de", country_code: "DE", city_code: null, amount_min: 800, amount_max: 800 }),
      costRow({ id: "ber", country_code: "DE", city_code: "BER", amount_min: 1400, amount_max: 1400 }),
    ];
    const berlin = groupCostsByScope(rows).find((s) => s.city_code === "BER");
    expect(sumMonthlyCosts(berlin?.rows ?? [])).toEqual({ min: 1400, max: 1400, currency: "EUR" });
  });
});

describe("sumMonthlyCosts", () => {
  it("yalnız aylık kalemleri toplar", () => {
    const rows = [
      costRow({ item_key: "rent", amount_min: 800, amount_max: 1500, period: "monthly" }),
      costRow({ item_key: "groceries", amount_min: 300, amount_max: 500, period: "monthly" }),
      costRow({ item_key: "utilities", amount_min: 9000, amount_max: 9000, period: "one_off" }),
    ];
    expect(sumMonthlyCosts(rows)).toEqual({ min: 1100, max: 2000, currency: "EUR" });
  });

  it("karışık para biriminde TOPLAMAZ — sessiz yanlış toplam üretmez", () => {
    const rows = [
      costRow({ currency: "EUR", amount_min: 800, amount_max: 800 }),
      costRow({ item_key: "groceries", currency: "USD", amount_min: 300, amount_max: 300 }),
    ];
    expect(sumMonthlyCosts(rows)).toBeNull();
  });

  it("aylık kalem yoksa null döner", () => {
    expect(sumMonthlyCosts([costRow({ period: "one_off" })])).toBeNull();
  });

  it("tek taraflı aralıkta eksik ucu diğerinden alır", () => {
    const rows = [costRow({ amount_min: 800, amount_max: null })];
    expect(sumMonthlyCosts(rows)).toEqual({ min: 800, max: 800, currency: "EUR" });
  });
});

describe("groupDocumentsByCategory", () => {
  it("kategoriye göre gruplar ve sort_order'a göre sıralar", () => {
    const rows = [
      docRow({ category: "Kimlik", doc_name: "Pasaport", sort_order: 2 }),
      docRow({ category: "Kimlik", doc_name: "Doğum Belgesi", sort_order: 1 }),
      docRow({ category: "Eğitim", doc_name: "Diploma", sort_order: 1 }),
    ];
    const groups = groupDocumentsByCategory(rows);
    const kimlik = groups.find((g) => g.category === "Kimlik");
    expect(kimlik?.documents.map((d) => d.doc_name)).toEqual(["Doğum Belgesi", "Pasaport"]);
  });

  it("kategorileri Türkçe sıralama kuralıyla dizer", () => {
    const rows = [
      docRow({ category: "Ikamet" }),
      docRow({ category: "Eğitim" }),
      docRow({ category: "Çalışma" }),
    ];
    const order = groupDocumentsByCategory(rows).map((g) => g.category);
    // Türkçe alfabede Ç, E'den önce gelir; ham localeCompare bunu kaçırır.
    expect(order[0]).toBe("Çalışma");
  });

  it("boş girdide boş dizi döner", () => {
    expect(groupDocumentsByCategory([])).toEqual([]);
  });
});

describe("completionPercent", () => {
  it("yüzdeyi tam sayıya yuvarlar", () => {
    expect(completionPercent(1, 3)).toBe(33);
  });

  it("payda 0 iken NaN sızdırmaz", () => {
    expect(completionPercent(0, 0)).toBe(0);
  });

  it("tamamlanmışta 100 döner", () => {
    expect(completionPercent(5, 5)).toBe(100);
  });
});
