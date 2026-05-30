import { describe, expect, it } from "vitest";

import { expenseFormSchema, incomeFormSchema } from "@/lib/muhasebe-schemas";

describe("muhasebe form schemas", () => {
  it("accepts a valid expense payload", () => {
    const result = expenseFormSchema.safeParse({
      expense_date: "2026-04-22",
      person: "baris",
      category: "muhasebe_finans",
      description: "Noter gideri",
      amount: 1250,
      currency: "TRY",
      status: "bekliyor",
      payment_method: "havale_eft",
      invoice_url: "",
      note: null,
      is_virtual_card: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejects negative amounts and unsafe link text", () => {
    const result = incomeFormSchema.safeParse({
      income_date: "2026-04-22",
      source: "Pilot müşteri",
      category: "pilot_gelir",
      description: "Pilot ödeme",
      amount: -1,
      currency: "TRY",
      status: "tahsil_edildi",
      link: "javascript:alert(1)",
      note: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.amount).toContain("Tutar negatif olamaz");
      expect(result.error.flatten().fieldErrors.link).toContain("Link http veya https ile başlamalıdır");
    }
  });
});
