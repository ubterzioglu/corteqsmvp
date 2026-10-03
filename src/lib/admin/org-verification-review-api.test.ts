/**
 * G07 · org-verification-review-api sözleşmeleri.
 * Hata haritası ÇİFT YÖNLÜ (migration 20261003130000 ↔ TS) + düz-nesne RPC hatası
 * (instanceof daraltması YASAK) + kaynak kilitleri.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ORG_VERIFICATION_REVIEW_ERROR_MESSAGES,
  orgVerificationReviewErrorMessage,
} from "@/lib/admin/org-verification-review-api";

const MIGRATION = "supabase/migrations/applied/20261003130000_org_verification_review.sql";
const API_SOURCE = "src/lib/admin/org-verification-review-api.ts";
const migrationSql = () => readFileSync(MIGRATION, "utf8");
const apiSource = () => readFileSync(API_SOURCE, "utf8");

const sqlCodes = (() => {
  const codes = new Set<string>();
  for (const match of migrationSql().matchAll(/raise\s+exception\s+'(org_verification_review_[a-z0-9_]+)'/gi)) {
    codes.add(match[1]);
  }
  return codes;
})();

describe("G07 · review RPC hata kodu ↔ Türkçe mesaj (ÇİFT YÖNLÜ)", () => {
  it("SQL'den kod toplayabiliyor (tarama boşa düşmesin)", () => {
    expect(sqlCodes.size, "SQL'den org_verification_review_ kodu toplanamadı").toBe(5);
  });

  it("her SQL kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes].filter((code) => !(code in ORG_VERIFICATION_REVIEW_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada SQL'de olmayan kod yok (ters yön)", () => {
    const stale = Object.keys(ORG_VERIFICATION_REVIEW_ERROR_MESSAGES).filter((c) => !sqlCodes.has(c));
    expect(stale).toEqual([]);
  });

  it("mesajlar dolu ve ham kod DEĞİL", () => {
    for (const [code, message] of Object.entries(ORG_VERIFICATION_REVIEW_ERROR_MESSAGES)) {
      expect(message.trim(), code).not.toBe("");
      expect(message, code).not.toMatch(/^org_verification_review_/);
    }
  });

  it("düz nesne hatadan kodu çıkarır (Error örneği DEĞİL — instanceof ölür)", () => {
    const rpcError = {
      message: "org_verification_review_already_reviewed",
      code: "22023",
      details: null,
      hint: null,
    };
    expect(orgVerificationReviewErrorMessage(rpcError)).toBe(
      ORG_VERIFICATION_REVIEW_ERROR_MESSAGES.org_verification_review_already_reviewed,
    );
  });

  it("reason_required düz nesneden çözülür (ret sebebi zorunlu)", () => {
    expect(orgVerificationReviewErrorMessage({ message: "org_verification_review_reason_required" })).toBe(
      ORG_VERIFICATION_REVIEW_ERROR_MESSAGES.org_verification_review_reason_required,
    );
  });

  it("bilinmeyen hatada ham metin DEĞİL, genel mesaj", () => {
    expect(orgVerificationReviewErrorMessage({ message: "PGRST204 boom" })).not.toContain("PGRST204");
    expect(orgVerificationReviewErrorMessage(null)).not.toBe("");
  });
});

describe("G07 · kaynak kilitleri", () => {
  it("RPC hatası instanceof Error ile DARALTILMAZ (extractRpcErrorText tek kaynak)", () => {
    const src = apiSource();
    expect(src).not.toContain("instanceof Error");
    expect(src).toContain("extractRpcErrorText");
  });

  it("belge önizleme createSignedUrl'den (G06b) — getPublicUrl YOK", () => {
    const src = apiSource();
    expect(src).toContain("openOrgVerificationDocument"); // G06b imzalı URL yeniden kullanımı
    expect(src).not.toContain("getPublicUrl");
  });

  it("claim_type istemciden parametre GÖNDERİLMEZ; review 3 parametre geçirir (gövdede zorlanır)", () => {
    const src = apiSource();
    // İstemci claim_type'ı asla geçirmez; approve/reject + status SQL gövdesinde sabit.
    expect(src).not.toContain("p_claim_type");
    expect(src).not.toContain("verification_level_2"); // yalnız SQL gövdesinde
    // review_org_verification_v1 tam olarak üç parametre alır:
    expect(src).toContain("p_claim_id:");
    expect(src).toContain("p_approve:");
    expect(src).toContain("p_reason:");
  });
});
