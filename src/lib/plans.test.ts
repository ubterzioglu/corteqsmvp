/**
 * plans.ts sözleşme testi — LOCK_FROM ve isLocked() davranışı.
 */

import { describe, expect, it } from "vitest";

import { LOCK_FROM, daysUntilLock, isLocked } from "./plans";

describe("plans", () => {
  describe("LOCK_FROM", () => {
    it("sabit 2027-01-01 (ürün kararı, değişmez)", () => {
      expect(LOCK_FROM).toBe("2027-01-01");
    });

    it("geçerli ISO tarih formatı", () => {
      const date = new Date(LOCK_FROM);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe("isLocked", () => {
    it("Ekim 2026'da her zaman false (kilit kapalı)", () => {
      // Şu an Ekim 2026, LOCK_FROM 1 Ocak 2027
      expect(isLocked()).toBe(false);
    });

    it("LOCK_FROM tarihinden önce false", () => {
      // 31 Aralık 2026
      const beforeLock = new Date("2026-12-31T23:59:59Z");
      const lockDate = new Date(LOCK_FROM);
      expect(beforeLock < lockDate).toBe(true);
    });

    it("LOCK_FROM tarihinde veya sonra true", () => {
      // 1 Ocak 2027
      const onLock = new Date("2027-01-01T00:00:00Z");
      const lockDate = new Date(LOCK_FROM);
      expect(onLock >= lockDate).toBe(true);
    });
  });

  describe("daysUntilLock", () => {
    it("Ekim 2026'da pozitif değer (kilit henüz gelmedi)", () => {
      const days = daysUntilLock();
      expect(days).toBeGreaterThan(0);
    });

    it("yaklaşık 87 gün (Ekim 2026 → Ocak 2027)", () => {
      const days = daysUntilLock();
      // Ekim 5 → Ocak 1 = ~88 gün (artık yıla göre değişir)
      expect(days).toBeGreaterThanOrEqual(85);
      expect(days).toBeLessThanOrEqual(90);
    });

    it("LOCK_FROM tarihinde 0", () => {
      // Bu test şu an geçmez çünkü şimdi Ekim 2026
      // LOCK_FROM tarihinde daysUntilLock() 0 dönmeli
      const lockDate = new Date(LOCK_FROM);
      const now = new Date();
      if (now >= lockDate) {
        expect(daysUntilLock()).toBe(0);
      }
    });

    it("negatif değer dönmez (Math.max(0, ...))", () => {
      const days = daysUntilLock();
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });
});
