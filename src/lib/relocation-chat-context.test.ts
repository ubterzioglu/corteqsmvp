// Relocation AI bağlam kurucusu — sözleşme testleri.
//
// Kilitlenen iki şey:
//   1. GİZLİLİK: bağlam metnine kimlik verisi sızmamalı.
//   2. UYDURMA FRENİ: veri yokken model "elimde rakam var" sanmamalı.

import { describe, expect, it } from "vitest";
import {
  MAX_CONTEXT_CHARS,
  buildRelocationChatContext,
  type RelocationChatProfile,
} from "@/lib/relocation-chat-context";
import type {
  RelocationLivingCostRow,
  RelocationRequiredDocumentRow,
} from "@/lib/relocation-content-types";

const profile = (patch: Partial<RelocationChatProfile> = {}): RelocationChatProfile => ({
  targetCountryCodes: ["DE"],
  targetCountryNames: ["Almanya"],
  adults: 2,
  children: 1,
  budgetMonthly: 1500,
  currency: "EUR",
  moveWindowStart: "2027-01-01",
  moveWindowEnd: "2027-06-30",
  mustHaves: ["Türkçe konuşan doktor"],
  ...patch,
});

const costRow = (patch: Partial<RelocationLivingCostRow> = {}): RelocationLivingCostRow => ({
  id: "c1",
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

const docRow = (
  patch: Partial<RelocationRequiredDocumentRow> = {},
): RelocationRequiredDocumentRow => ({
  id: "d1",
  country_code: "DE",
  doc_name: "Diploma & Transkript",
  category: "Eğitim",
  note: "Apostil tasdikli, yeminli tercüme",
  sort_order: 1,
  is_active: true,
  ...patch,
});

describe("buildRelocationChatContext — profil", () => {
  it("hedef ülke adını ve haneyi yazar", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [],
      requiredDocuments: [],
    });
    expect(out).toContain("Almanya");
    expect(out).toContain("2 yetişkin");
    expect(out).toContain("1 çocuk");
  });

  it("çocuk yoksa çocuk satırı yazmaz", () => {
    const out = buildRelocationChatContext({
      profile: profile({ children: 0 }),
      livingCosts: [],
      requiredDocuments: [],
    });
    expect(out).not.toContain("çocuk");
  });

  it("ülke adı yoksa koda düşer", () => {
    const out = buildRelocationChatContext({
      profile: profile({ targetCountryNames: [], targetCountryCodes: ["NL"] }),
      livingCosts: [],
      requiredDocuments: [],
    });
    expect(out).toContain("NL");
  });
});

describe("buildRelocationChatContext — gizlilik", () => {
  it("bağlam metninde kimlik alanı geçmez", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow()],
      requiredDocuments: [docRow()],
    });
    // Kurucuya bu alanlar hiç verilmiyor; sözleşmeyi metin üzerinden de kilitliyoruz.
    expect(out).not.toMatch(/user_id|e-?posta|email|telefon|@/i);
  });
});

describe("buildRelocationChatContext — uydurma freni", () => {
  it("veri yokken modele AÇIKÇA veri olmadığını söyler", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [],
      requiredDocuments: [],
    });
    expect(out).toContain("henüz maliyet veya belge verisi YOK");
    expect(out).toContain("Kesin rakam veya belge listesi verme");
  });

  it("veri varken uydurma uyarısını EKLEMEZ", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow()],
      requiredDocuments: [],
    });
    expect(out).not.toContain("Kesin rakam veya belge listesi verme");
  });
});

describe("buildRelocationChatContext — içerik blokları", () => {
  it("maliyet kalemini Türkçe etiketle ve aralıkla yazar", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow()],
      requiredDocuments: [],
    });
    expect(out).toContain("Kira");
    expect(out).toContain("/ay");
  });

  it("tek seferlik kalemi aylıktan ayırır", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow({ period: "one_off", item_key: "utilities" })],
      requiredDocuments: [],
    });
    expect(out).toContain("tek seferlik");
  });

  it("belgeyi kategori ve apostil notuyla yazar", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [],
      requiredDocuments: [docRow()],
    });
    expect(out).toContain("[Eğitim]");
    expect(out).toContain("Apostil tasdikli, yeminli tercüme");
  });

  it("hane büyüklüğüne uygun satırı seçer", () => {
    const rows = [
      costRow({ id: "a", household_size: 1, amount_min: 800, amount_max: 800 }),
      costRow({ id: "b", household_size: 3, amount_min: 1600, amount_max: 1600 }),
    ];
    // profile(): 2 yetişkin + 1 çocuk = 3 kişi → 3 kişilik satır seçilmeli.
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: rows,
      requiredDocuments: [],
    });
    expect(out).toContain("1.600");
    expect(out).not.toContain("800");
  });
});

describe("buildRelocationChatContext — uzunluk sınırı", () => {
  it("sınırı aşınca keser ve kesildiğini SÖYLER", () => {
    const many = Array.from({ length: 500 }, (_, i) =>
      docRow({ id: `d${i}`, doc_name: `Belge ${i} ${"x".repeat(40)}` }),
    );
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [],
      requiredDocuments: many,
    });
    expect(out.length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS + 120);
    expect(out).toContain("kesildi");
  });

  it("sınır altındaki metne kesme notu eklemez", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow()],
      requiredDocuments: [docRow()],
    });
    expect(out).not.toContain("kesildi");
  });
});

// B29: panelle AYNI sözleşme. Bot kapsamı ayırmazsa, panel Berlin rakamını
// gösterirken bot ülke geneli rakamını anlatır — kullanıcı çelişen iki rakam görür.
describe("buildRelocationChatContext — maliyet kapsamı (B29)", () => {
  it("şehir satırı ile ülke geneli satırını AYRI satır olarak yazar", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [
        costRow({ id: "de", city_code: null, amount_min: 800, amount_max: 800 }),
        costRow({ id: "ber", city_code: "BER", amount_min: 1400, amount_max: 1400 }),
      ],
      requiredDocuments: [],
    });

    expect(out).toContain("DE (ülke geneli)");
    expect(out).toContain("DE/BER");
    // İkisi de görünmeli — biri diğerini yutarsa rakamlardan biri kaybolur.
    expect(out).toMatch(/1\.400/);
    expect(out).toMatch(/800/);
  });

  it("iki şehri tek satıra indirgemez", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [
        costRow({ id: "ber", city_code: "BER", amount_min: 1400, amount_max: 1400 }),
        costRow({ id: "muc", city_code: "MUC", amount_min: 1800, amount_max: 1800 }),
      ],
      requiredDocuments: [],
    });

    expect(out).toContain("DE/BER");
    expect(out).toContain("DE/MUC");
  });
});

// B28: panelde "resmî endeks değil" uyarısını görüp bottan kesin rakam almak,
// uyarıyı etkisiz kılar. Nitelik bağlamda da yazılır.
describe("buildRelocationChatContext — maliyet niteliği (B28)", () => {
  it("maliyet bloğunun başında rakamların niteliğini söyler", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [costRow()],
      requiredDocuments: [],
    });

    expect(out).toContain("resmî fiyat endeksi değildir");
  });

  it("maliyet verisi YOKKEN nitelik satırını da yazmaz (uydurma freni)", () => {
    const out = buildRelocationChatContext({
      profile: profile(),
      livingCosts: [],
      requiredDocuments: [docRow()],
    });

    expect(out).not.toContain("Yaşam masrafları (platform verisi)");
    expect(out).not.toContain("resmî fiyat endeksi değildir");
  });
});
