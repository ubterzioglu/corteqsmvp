import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPendingOnboardingPayload,
  clearPendingOnboardingPayload,
  finalizeAuthenticatedSubmission,
  loadPendingOnboardingPayload,
  savePendingOnboardingPayload,
} from "@/lib/profile-onboarding-api";

const {
  getUserMock,
  rpcMock,
  insertSubmissionWithCompatibilityMock,
  validateReferralCodeBeforeSubmitMock,
  toSubmissionInsertMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  insertSubmissionWithCompatibilityMock: vi.fn(),
  validateReferralCodeBeforeSubmitMock: vi.fn(),
  toSubmissionInsertMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
      signInWithOtp: vi.fn(),
    },
    rpc: rpcMock,
    from: vi.fn(),
  },
}));

vi.mock("@/lib/submissions", () => ({
  toSubmissionInsert: toSubmissionInsertMock,
  validateReferralCodeBeforeSubmit: validateReferralCodeBeforeSubmitMock,
  insertSubmissionWithCompatibility: insertSubmissionWithCompatibilityMock,
}));

describe("profile onboarding api", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "session@example.com",
        },
      },
      error: null,
    });
    validateReferralCodeBeforeSubmitMock.mockResolvedValue("ABC42");
    toSubmissionInsertMock.mockReturnValue({
      form_type: "register",
      category: "bireysel",
      fullname: "Ada Lovelace",
      country: "Germany",
      city: "Berlin",
      field: "AI",
      email: "session@example.com",
      phone: "+491701234567",
      consent: true,
      referral_code: "ABC42",
      source_type: "form",
      status: "new",
    });
    insertSubmissionWithCompatibilityMock.mockResolvedValue({ id: "submission-1" });
  });

  it("migrates the legacy backup payload into the versioned onboarding payload", () => {
    sessionStorage.setItem(
      "corteqs_form_backup",
      JSON.stringify({
        fullname: "Ada Lovelace",
        category: "bireysel",
        country: "Germany",
        city: "Berlin",
        field: "AI",
        email: "ada@example.com",
        phone: "+49 170 1234567",
        consent: "on",
      }),
    );

    const loaded = loadPendingOnboardingPayload();
    expect(loaded?.version).toBe(1);
    expect(loaded?.form.fullname).toBe("Ada Lovelace");
    expect(loaded?.form.consent).toBe(true);
    expect(sessionStorage.getItem("corteqs_form_backup")).toBeNull();
  });

  it("finalizes the authenticated submission with the session email and clears storage", async () => {
    const payload = buildPendingOnboardingPayload({
      form: {
        category: "bireysel",
        fullname: "Ada Lovelace",
        country: "Germany",
        city: "Berlin",
        field: "AI",
        email: "draft@example.com",
        phone: "+49 170 1234567",
        referral_code: "abc42",
        consent: true,
      },
    });

    savePendingOnboardingPayload(payload);

    const result = await finalizeAuthenticatedSubmission(payload);

    expect(toSubmissionInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "session@example.com",
      }),
      "register",
      true,
    );
    expect(insertSubmissionWithCompatibilityMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        onboarding_key: payload.onboardingKey,
      }),
    );
    expect(result).toMatchObject({ duplicate: false, submissionId: "submission-1" });
    expect(loadPendingOnboardingPayload()).toBeNull();
    clearPendingOnboardingPayload();
  });
});
