import { describe, expect, it } from "vitest";

import {
  TRANSFER_PROVIDERS,
  quoteTransfer,
  rankTransfers,
} from "@/lib/germany-transfer";

// Kaynak: ref101 para-transferi. Hesap mantığı aynası.

describe("TRANSFER_PROVIDERS bütünlüğü", () => {
  it("6 sağlayıcı, benzersiz id", () => {
    expect(TRANSFER_PROVIDERS).toHaveLength(6);
    expect(new Set(TRANSFER_PROVIDERS.map((p) => p.id)).size).toBe(6);
  });
});

describe("quoteTransfer — ücret tipleri", () => {
  it("percentage ücret minFee ile sınırlanır", () => {
    const wise = TRANSFER_PROVIDERS.find((p) => p.id === "wise")!; // %0.5, minFee 0.5
    // 1000 € → %0.5 = 5 € (minFee 0.5'ten büyük)
    expect(quoteTransfer(wise, 1000).fee).toBeCloseTo(5, 5);
    // 50 € → %0.5 = 0.25 € < minFee 0.5 → 0.5
    expect(quoteTransfer(wise, 50).fee).toBeCloseTo(0.5, 5);
  });

  it("hybrid ücret = sabit + yüzde", () => {
    const remitly = TRANSFER_PROVIDERS.find((p) => p.id === "remitly")!; // fixed 1.99 + %1.5
    // 1000 € → 1.99 + 15 = 16.99
    expect(quoteTransfer(remitly, 1000).fee).toBeCloseTo(16.99, 5);
  });

  it("kur marjı net alınanı düşürür", () => {
    const wise = TRANSFER_PROVIDERS.find((p) => p.id === "wise")!;
    const q = quoteTransfer(wise, 1000);
    // exchangeRate = 0.032 * (1 - 0.5/100) = 0.032 * 0.995
    expect(q.exchangeRate).toBeCloseTo(0.032 * 0.995, 8);
    expect(q.receivedAmount).toBeCloseTo((1000 - q.fee) * q.exchangeRate, 6);
  });

  it("tutar 0 ise effectiveRate 0 (bölme hatası yok)", () => {
    const wise = TRANSFER_PROVIDERS.find((p) => p.id === "wise")!;
    expect(quoteTransfer(wise, 0).effectiveRate).toBe(0);
  });
});

describe("rankTransfers", () => {
  it("net alınan TL'ye göre azalan sıralı", () => {
    const ranked = rankTransfers(1000);
    expect(ranked).toHaveLength(6);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].receivedAmount).toBeGreaterThanOrEqual(ranked[i].receivedAmount);
    }
  });

  it("düşük marjlı/ücretli sağlayıcı (Wise/XE/Revolut) üstte", () => {
    const ranked = rankTransfers(1000);
    expect(["wise", "xe", "revolut"]).toContain(ranked[0].id);
  });
});
