import { describe, expect, it } from "vitest";

import { normalizeEmail, normalizePendingFormPayload } from "@/lib/pending-onboarding-normalize";
import { type PendingOnboardingPayload } from "@/lib/pending-onboarding-schemas";

const makePayload = (overrides: Partial<PendingOnboardingPayload["form"]> = {}): PendingOnboardingPayload => ({
  version: 1,
  onboardingKey: "onb-test-1",
  mode: "register",
  savedAt: "2026-06-04T12:00:00.000Z",
  form: {
    category: "bireysel",
    fullname: "Ada Lovelace",
    country: "Germany",
    city: "Berlin",
    business: "CorteQS",
    field: "AI",
    email: "Ada@Example.com ",
    phone: "+49 170 1234567",
    description: "",
    offers_needs: "",
    company_name: "",
    donor_type: "",
    donation_amount: "",
    document_url: "",
    document_name: "",
    referral_source: "",
    referral_detail: "",
    referral_code: " abc42 ",
    linkedin: "",
    instagram: "",
    tiktok: "",
    facebook: "",
    twitter: "",
    website: "",
    contest_interest: false,
    whatsapp_interest: false,
    consent: true,
    ...overrides,
  },
});

describe("profile onboarding normalize helpers", () => {
  it("normalizes email and produces stable form entries", () => {
    expect(normalizeEmail(" Ada@Example.com ")).toBe("ada@example.com");

    const result = normalizePendingFormPayload(makePayload());
    expect(result.emailNormalized).toBe("ada@example.com");
    expect(result.form.phone).toBe("+491701234567");
    expect(result.form.referral_code).toBe("ABC42");
    expect(result.formEntries.contest_interest).toBe("");
  });

  // `referral_source` alani kayit akisindan kaldirildi (T19, 3 Eylul 2026).
  // Form artik bu degerleri toplamiyor; eski taslaklar dogrulamaya takilmadan
  // gecmeli, aksi halde kayitli bir taslak aktive edilemez hale gelir.
  it("carries historical referral values through without validating them", () => {
    const result = normalizePendingFormPayload(
      makePayload({
        referral_source: "whatsapp",
        referral_detail: "",
      }),
    );

    expect(result.form.referral_source).toBe("whatsapp");
    expect(result.form.referral_detail).toBe("");
  });

  it("accepts a referral source that is not in the catalog anymore", () => {
    const result = normalizePendingFormPayload(
      makePayload({ referral_source: "artik-olmayan-kaynak" }),
    );

    expect(result.form.referral_source).toBe("artik-olmayan-kaynak");
  });
});
