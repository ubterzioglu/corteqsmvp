/**
 * plans.ts sözleşme testi — LOCK_FROM ve isLocked() davranışı.
 *
 * ⚠️ Saat SABİTLENİR. Bu dosyanın ilk sürümü gerçek saati kullanıyor ve "şu an
 * Ekim 2026" varsayıyordu: 7 Kasım 2026'da `daysUntilLock` 55 döndü ve "85–90 gün"
 * testi düştü; `isLocked` testi de 1 Ocak 2027'de düşecekti. Tarihe bağlı her
 * iddia `vi.setSystemTime` ile kendi anını kurar.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOCK_FROM, daysUntilLock, isLocked } from "./plans";

function at(iso: string): void {
  vi.setSystemTime(new Date(iso));
}

describe("plans", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("LOCK_FROM", () => {
    it("sabit 2027-01-01 (ürün kararı, değişmez)", () => {
      expect(LOCK_FROM).toBe("2027-01-01");
    });

    it("geçerli ISO tarih formatı", () => {
      expect(new Date(LOCK_FROM).getTime()).not.toBeNaN();
    });
  });

  describe("isLocked", () => {
    it("Ekim 2026'da false (kilit kapalı)", () => {
      at("2026-10-05T12:00:00Z");
      expect(isLocked()).toBe(false);
    });

    it("LOCK_FROM'dan bir an önce false", () => {
      at("2026-12-31T23:59:59Z");
      expect(isLocked()).toBe(false);
    });

    it("LOCK_FROM anında ve sonrasında true", () => {
      at("2027-01-01T00:00:00Z");
      expect(isLocked()).toBe(true);
      at("2027-06-01T00:00:00Z");
      expect(isLocked()).toBe(true);
    });
  });

  describe("daysUntilLock", () => {
    it("5 Ekim 2026 → 1 Ocak 2027 yaklaşık 88 gün", () => {
      at("2026-10-05T00:00:00Z");
      const days = daysUntilLock();
      expect(days).toBeGreaterThanOrEqual(85);
      expect(days).toBeLessThanOrEqual(90);
    });

    it("LOCK_FROM anında 0", () => {
      at("2027-01-01T00:00:00Z");
      expect(daysUntilLock()).toBe(0);
    });

    it("kilitten sonra negatif değer dönmez (Math.max(0, ...))", () => {
      at("2027-03-15T00:00:00Z");
      expect(daysUntilLock()).toBe(0);
    });
  });
});
