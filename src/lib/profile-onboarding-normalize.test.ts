import { describe, expect, it } from "vitest";

import { normalizeEmail, normalizePendingFormPayload } from "@/lib/profile-onboarding-normalize";
import { type PendingOnboardingPayload } from "@/lib/profile-onboarding-schemas";

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

  it("requires whatsapp referral detail when whatsapp is selected", () => {
    expect(() =>
      normalizePendingFormPayload(
        makePayload({
          referral_source: "whatsapp",
          referral_detail: "",
        }),
      ),
    ).toThrow(/detay gerekli/i);
  });
});
