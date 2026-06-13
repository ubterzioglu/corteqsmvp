import { describe, expect, it } from "vitest";

import {
  JOB_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  SF_ERROR_MESSAGES,
  budgetPercent,
  formatConfidence,
  formatUsd,
  sfErrorMessage,
} from "@/lib/service-finder-format";

describe("sfErrorMessage", () => {
  it("RPC hata kodunu Türkçe mesaja çevirir", () => {
    const error = new Error('Supabase: raise exception "sf_admin_required" at ...');
    expect(sfErrorMessage(error)).toBe(SF_ERROR_MESSAGES.sf_admin_required);
  });

  it("bilinmeyen kodda ham mesajı döndürür", () => {
    expect(sfErrorMessage(new Error("network down"))).toBe("network down");
  });

  it("boş hata için genel mesaj döner", () => {
    expect(sfErrorMessage(null)).toBe("Beklenmeyen bir hata oluştu.");
  });

  it("tüm sf_* kodlarının mesajı dolu", () => {
    for (const [code, message] of Object.entries(SF_ERROR_MESSAGES)) {
      expect(code.startsWith("sf_")).toBe(true);
      expect(message.length).toBeGreaterThan(5);
    }
  });
});

describe("durum etiketleri", () => {
  it("tüm iş durumları Türkçe etiketlidir", () => {
    for (const status of [
      "queued",
      "running",
      "review",
      "completed",
      "failed",
      "cancelled",
      "budget_stopped",
    ] as const) {
      expect(JOB_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("tüm inceleme durumları Türkçe etiketlidir", () => {
    for (const status of ["pending", "approved", "rejected", "needs_edit", "published"] as const) {
      expect(REVIEW_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("budgetPercent", () => {
  it("oranı yüzdeye çevirir", () => {
    expect(budgetPercent(1.5, 3)).toBe(50);
  });

  it("taşmada 100'de kalır", () => {
    expect(budgetPercent(5, 3)).toBe(100);
  });

  it("sıfır/geçersiz tavanlarda 0 döner", () => {
    expect(budgetPercent(1, 0)).toBe(0);
  });

  it("string girdileri tolere eder (numeric kolonlar string gelebilir)", () => {
    expect(budgetPercent("0.31", "3.0000")).toBe(10);
  });
});

describe("format yardımcıları", () => {
  it("formatUsd USD para formatı üretir", () => {
    expect(formatUsd(0.31)).toContain("0,31");
  });

  it("formatConfidence yüzde işaretli tam sayı üretir", () => {
    expect(formatConfidence(84.6)).toBe("%85");
  });
});
