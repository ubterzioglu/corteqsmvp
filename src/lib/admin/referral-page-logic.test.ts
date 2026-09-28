// AdminReferralPage saf mantığı — güvenlik ağı (C02).
//
// Sayfa 577 satırdı ve HİÇ testi yoktu. Repo kuralı testsiz ayrıştırmayı yasaklıyor;
// bu dosya ayrıştırmanın güvenlik ağıdır ve taşınan davranışı kilitler.

import { describe, expect, it } from "vitest";

import {
  buildReferralCodePreview,
  filterReferralCodes,
  groupUsagesByCode,
  referralSearchHaystack,
  validateReferralCreateForm,
} from "@/lib/admin/referral-page-logic";

const code = (over: Partial<Parameters<typeof referralSearchHaystack>[0]> & { code?: string } = {}) => ({
  code: "ABCDEF-123456",
  note: null as string | null,
  source_code: "INS",
  group_code: "TR",
  type_code: "AMB",
  ...over,
});

describe("filterReferralCodes", () => {
  it("boş aramada listeyi aynen döndürür", () => {
    const codes = [code(), code({ code: "X" })];

    expect(filterReferralCodes(codes, "   ")).toHaveLength(2);
  });

  it("kod, not ve kaynak/grup/tür üçlüsünde arar", () => {
    const codes = [
      code({ code: "AAA-1", note: "instagram kampanyası" }),
      code({ code: "BBB-2", note: null, source_code: "WEB" }),
    ];

    expect(filterReferralCodes(codes, "instagram")).toHaveLength(1);
    expect(filterReferralCodes(codes, "BBB")).toHaveLength(1);
    expect(filterReferralCodes(codes, "WEB")).toHaveLength(1);
  });

  it("TÜRKÇE aramada büyük/küçük harf ve aksan toleranslıdır", () => {
    // ⚠️ Çıplak `toLowerCase` ile bu test DÜŞER: "İSTANBUL".toLowerCase() sade
    // "istanbul" üretmez. CLAUDE.md "Türkçe Metin Kuralları" md.1.
    const codes = [code({ note: "İSTANBUL standı" }), code({ note: "Üsküdar" })];

    expect(filterReferralCodes(codes, "istanbul")).toHaveLength(1);
    expect(filterReferralCodes(codes, "uskudar")).toHaveLength(1);
  });

  it("boş not taşıyan kaydı çökertmeden atlar", () => {
    expect(filterReferralCodes([code({ note: null })], "herhangi")).toHaveLength(0);
  });

  it("girdi dizisini MUTASYONA UĞRATMAZ", () => {
    const codes = [code()];
    filterReferralCodes(codes, "INS");

    expect(codes).toHaveLength(1);
  });
});

describe("buildReferralCodePreview", () => {
  it("seçili kodları birleştirir", () => {
    expect(
      buildReferralCodePreview({ sourceCode: "INS", groupCode: "TR", typeCode: "AMB" }),
    ).toBe("INSTRAMB-XXXXXX");
  });

  it("seçilmeyen parçayı `??` gösterir (boş bırakmaz)", () => {
    expect(
      buildReferralCodePreview({ sourceCode: undefined, groupCode: "TR", typeCode: undefined }),
    ).toBe("??TR??-XXXXXX");
  });
});

describe("groupUsagesByCode", () => {
  it("kullanımları kod kimliğine göre gruplar", () => {
    const grouped = groupUsagesByCode([
      { referral_code_id: "a" },
      { referral_code_id: "b" },
      { referral_code_id: "a" },
    ]);

    expect(grouped.a).toHaveLength(2);
    expect(grouped.b).toHaveLength(1);
  });

  it("boş girdide boş nesne döner", () => {
    expect(groupUsagesByCode([])).toEqual({});
  });
});

describe("validateReferralCreateForm", () => {
  const valid = {
    sourceId: "s",
    groupId: "g",
    typeId: "t",
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
  };

  it("geçerli formda null döner", () => {
    expect(validateReferralCreateForm(valid)).toBeNull();
  });

  it("eksik seçimde Türkçe hata döner", () => {
    expect(validateReferralCreateForm({ ...valid, sourceId: "" })).toContain("gerekli");
    expect(validateReferralCreateForm({ ...valid, typeId: "" })).toContain("gerekli");
  });

  it("eksik tarihte Türkçe hata döner", () => {
    expect(validateReferralCreateForm({ ...valid, validUntil: "" })).toContain("tarih");
  });

  it("bitiş başlangıçtan ÖNCEYSE reddeder", () => {
    // ⚠️ Bu denetim eski kodda YOKTU: kod oluşturulduğu anda süresi dolmuş
    // sayılabiliyordu ve bunu kimse fark etmiyordu.
    expect(
      validateReferralCreateForm({ ...valid, validFrom: "2026-12-31", validUntil: "2026-01-01" }),
    ).toContain("önce olamaz");
  });

  it("aynı gün başlayıp biten kodu KABUL eder", () => {
    // Tek günlük kampanya meşrudur; sıra denetimi bunu yasaklamamalı.
    expect(
      validateReferralCreateForm({ ...valid, validFrom: "2026-05-19", validUntil: "2026-05-19" }),
    ).toBeNull();
  });
});
