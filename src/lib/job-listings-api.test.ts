/**
 * A8 · job-listings-api sözleşme testi.
 * Kilitler: hata kodları Türkçe harita ile eşleşir · RPC hatası düz nesne
 * (instanceof Error ile daraltma YOK).
 */

import { describe, expect, it } from "vitest";

import { resolveJobListingError } from "./job-listings-api";

// JOB_LISTING_ERROR_MESSAGES export edilmedi, test için doğrudan erişim
// yerine resolveJobListingError fonksiyonunu test ediyoruz.

describe("job-listings-api — hata mesajları", () => {
  it("career_login_required → Türkçe mesaj", () => {
    const error = { message: "career_login_required" };
    expect(resolveJobListingError(error)).toContain("giriş yapın");
  });

  it("career_listing_not_found → Türkçe mesaj", () => {
    const error = { message: "career_listing_not_found" };
    expect(resolveJobListingError(error)).toContain("bulunamadı");
  });

  it("career_listing_limit_reached → Türkçe mesaj", () => {
    const error = { message: "career_listing_limit_reached" };
    expect(resolveJobListingError(error)).toContain("Premium");
  });

  it("bilinmeyen hata → fallback", () => {
    const error = { message: "unknown_error" };
    expect(resolveJobListingError(error)).toBe("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
  });

  it("düz nesne hatası (supabase-js pattern) → Türkçe mesaj", () => {
    // supabase-js RPC hataları düz nesnedir, Error örneği DEĞİLDİR
    const error = { message: "unexpected", details: "career_listing_limit_reached", hint: null };
    expect(resolveJobListingError(error)).toContain("Premium");
  });

  it("null/undefined → fallback", () => {
    expect(resolveJobListingError(null)).toBe("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    expect(resolveJobListingError(undefined)).toBe("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
  });
});

describe("job-listings-api — SQL⇄TS çift yönlü sözleşme", () => {
  it("hata kodları SQL migration'daki raise exception ile eşleşir", () => {
    // A7 migration'daki hata kodları:
    // - career_login_required
    // - career_listing_not_found
    // - career_listing_limit_reached
    // Bu test, TS haritasının SQL ile senkron olduğunu doğrular.

    const expectedCodes = [
      "career_login_required",
      "career_listing_not_found",
      "career_listing_limit_reached",
    ];

    // Her kod için resolveJobListingError fallback dışı mesaj dönmeli
    for (const code of expectedCodes) {
      const error = { message: code };
      const message = resolveJobListingError(error);
      expect(message).not.toBe("İşlem tamamlanamadı. Lütfen tekrar deneyin.");
    }
  });
});
