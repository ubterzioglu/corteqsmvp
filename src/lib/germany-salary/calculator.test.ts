import { describe, expect, it } from "vitest";

import { calculateSalary } from "@/lib/germany-salary/calculator";
import type { SalaryInput } from "@/lib/germany-salary/types";

// Kaynak: ref101/lib/salary. 2026 Almanya vergi/sosyal sigorta formülleri.
// Bu testler ref101'de YOKTU; port doğruluğu + invariant'lar için bizde eklendi.

function baseInput(overrides: Partial<SalaryInput> = {}): SalaryInput {
  return {
    amount: 4000,
    period: "monthly",
    type: "gross",
    taxClass: "1",
    state: "NRW",
    hasChildren: false,
    childrenCount: 0,
    childrenUnder25Count: 0,
    age23Plus: true,
    churchTax: false,
    childAllowance: 0,
    insuranceType: "gkv",
    kvBase: 14.6,
    kvZusatz: 2.5,
    pkvPremium: 0,
    ppvPremium: 0,
    ...overrides,
  };
}

describe("calculateSalary — brütten nete temel invariant'lar", () => {
  it("net < brüt ve kesintiler pozitif", () => {
    const r = calculateSalary(baseInput({ amount: 4000 }));
    expect(r.grossMonthly).toBe(4000);
    expect(r.netMonthly).toBeLessThan(4000);
    expect(r.netMonthly).toBeGreaterThan(0);
    expect(r.deductionsMonthly).toBeGreaterThan(0);
  });

  it("yıllık = aylık * 12", () => {
    const r = calculateSalary(baseInput({ amount: 4000 }));
    expect(r.grossYearly).toBeCloseTo(r.grossMonthly * 12, 2);
    expect(r.netYearly).toBeCloseTo(r.netMonthly * 12, 2);
  });

  it("sosyal sigorta kalemleri (kv/pv/rv/av) pozitif ve toplam tutarlı", () => {
    const r = calculateSalary(baseInput({ amount: 4000 }));
    const { kv, pv, rv, av, total } = r.social;
    expect(kv).toBeGreaterThan(0);
    expect(rv).toBeGreaterThan(0);
    expect(av).toBeGreaterThan(0);
    expect(total).toBeCloseTo(kv + pv + rv + av, 2);
  });

  it("Grundfreibetrag altı brütte gelir vergisi 0", () => {
    // Aylık 900 € → yıllık 10.800 < 12.096 Grundfreibetrag
    const r = calculateSalary(baseInput({ amount: 900 }));
    expect(r.tax.lohnsteuer).toBe(0);
    expect(r.tax.soli).toBe(0);
  });

  it("yıllık girdi aylığa çevrilir", () => {
    const monthly = calculateSalary(baseInput({ amount: 4000, period: "monthly" }));
    const yearly = calculateSalary(baseInput({ amount: 48000, period: "yearly" }));
    expect(yearly.grossMonthly).toBeCloseTo(monthly.grossMonthly, 2);
    expect(yearly.netMonthly).toBeCloseTo(monthly.netMonthly, 0);
  });
});

describe("Steuerklasse etkisi", () => {
  it("Steuerklasse 3 (evli yüksek gelir) Steuerklasse 1'den daha az vergi öder", () => {
    const sk1 = calculateSalary(baseInput({ amount: 4000, taxClass: "1" }));
    const sk3 = calculateSalary(baseInput({ amount: 4000, taxClass: "3" }));
    expect(sk3.tax.lohnsteuer).toBeLessThan(sk1.tax.lohnsteuer);
    expect(sk3.netMonthly).toBeGreaterThan(sk1.netMonthly);
  });

  it("Steuerklasse 5 (evli düşük gelir) Steuerklasse 1'den daha çok vergi öder", () => {
    const sk1 = calculateSalary(baseInput({ amount: 4000, taxClass: "1" }));
    const sk5 = calculateSalary(baseInput({ amount: 4000, taxClass: "5" }));
    expect(sk5.tax.lohnsteuer).toBeGreaterThan(sk1.tax.lohnsteuer);
  });
});

describe("Kirchensteuer & eyalet", () => {
  it("kilise vergisi açıkken net düşer", () => {
    const noChurch = calculateSalary(baseInput({ amount: 4000, churchTax: false }));
    const withChurch = calculateSalary(baseInput({ amount: 4000, churchTax: true }));
    expect(withChurch.kirchensteuer).toBeGreaterThan(0);
    expect(withChurch.netMonthly).toBeLessThan(noChurch.netMonthly);
  });

  it("Bayern (%8) kilise vergisi NRW (%9)'dan düşük", () => {
    const nrw = calculateSalary(baseInput({ amount: 4000, churchTax: true, state: "NRW" }));
    const by = calculateSalary(baseInput({ amount: 4000, churchTax: true, state: "BY" }));
    expect(by.kirchensteuer).toBeLessThan(nrw.kirchensteuer);
  });

  it("Sachsen'de bakım sigortası (PV) işçi payı daha yüksek → net düşük", () => {
    const nrw = calculateSalary(baseInput({ amount: 4000, state: "NRW" }));
    const sn = calculateSalary(baseInput({ amount: 4000, state: "SN" }));
    expect(sn.social.pv).toBeGreaterThan(nrw.social.pv);
  });
});

describe("Çocuksuz ek primi (Pflegeversicherung)", () => {
  it("23+ çocuksuz çalışan ek PV primi öder", () => {
    const childless = calculateSalary(baseInput({ amount: 4000, age23Plus: true, hasChildren: false }));
    const withChild = calculateSalary(
      baseInput({ amount: 4000, age23Plus: true, hasChildren: true, childrenUnder25Count: 1 }),
    );
    expect(childless.social.pv).toBeGreaterThan(withChild.social.pv);
  });
});

describe("Netten brüte (ters çevirim)", () => {
  it("hesaplanan brüt, aynı parametrelerle geri hesaplanınca hedef neti ±2 € verir", () => {
    const targetNet = 2500;
    const fromNet = calculateSalary(baseInput({ amount: targetNet, type: "net" }));
    expect(fromNet.netMonthly).toBe(targetNet);
    expect(fromNet.grossMonthly).toBeGreaterThan(targetNet);

    // Round-trip: bulunan brütle nete dön → hedefe çok yakın olmalı.
    const roundTrip = calculateSalary(baseInput({ amount: fromNet.grossMonthly, type: "gross" }));
    expect(Math.abs(roundTrip.netMonthly - targetNet)).toBeLessThanOrEqual(2);
  });
});

describe("Şirket aracı (Dienstwagen)", () => {
  it("şirket aracı menfaati vergilendirilebilir geliri artırır, neti düşürür", () => {
    const without = calculateSalary(baseInput({ amount: 4000 }));
    const withCar = calculateSalary(
      baseInput({
        amount: 4000,
        companyCar: {
          enabled: true,
          listPrice: 40000,
          rate: 0.01,
          commuteEnabled: false,
          commuteKm: 0,
          commuteMode: "monthly",
          commuteDays: 0,
        },
      }),
    );
    expect(withCar.companyCarBenefit).toBeGreaterThan(0);
    expect(withCar.taxableGross).toBeGreaterThan(without.taxableGross);
    expect(withCar.netMonthly).toBeLessThan(without.netMonthly);
  });
});
