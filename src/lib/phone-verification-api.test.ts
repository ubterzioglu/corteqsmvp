// G05 · Telefon doğrulama API sözleşme testleri.
//
// 🔴 Native yol: updateUser({phone}) → Auth SMS → verifyOtp → phone_confirmed_at
//    → trigger user_verifications'a aynalar (G04).
// 🔴 HIZ SINIRI: Auth'un yerleşik sınırları geçerli. DB'de gözlem yapılır, enforcement YOK.
// 🔴 Ülke telefon alan kodundan TÜRETİLMEZ (WS1 madde 10).

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchPhoneVerificationStatus,
  sendPhoneVerificationCode,
  verifyPhoneVerificationCode,
  PHONE_VERIFICATION_ERROR_MESSAGES,
} from "./phone-verification-api";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      verifyOtp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { supabase } from "@/integrations/supabase/client";

const mockSupabase = vi.mocked(supabase, true);

describe("phone-verification-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPhoneVerificationStatus", () => {
    it("giriş yapmamış kullanıcı için boş durum döner", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as never);

      const status = await fetchPhoneVerificationStatus();

      expect(status).toEqual({
        isVerified: false,
        phone: null,
        verifiedAt: null,
      });
    });

    it("doğrulanmamış telefon için isVerified=false döner", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      mockSupabase.from = fromMock as never;

      const status = await fetchPhoneVerificationStatus();

      expect(status.isVerified).toBe(false);
      expect(status.phone).toBeNull();
    });

    it("doğrulanmış telefon için isVerified=true döner", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                phone_e164: "+491701234567",
                phone_verified_at: "2026-10-04T12:00:00Z",
              },
              error: null,
            }),
          }),
        }),
      });
      mockSupabase.from = fromMock as never;

      const status = await fetchPhoneVerificationStatus();

      expect(status.isVerified).toBe(true);
      expect(status.phone).toBe("+491701234567");
      expect(status.verifiedAt).toBe("2026-10-04T12:00:00Z");
    });
  });

  describe("sendPhoneVerificationCode", () => {
    it("giriş yapmamış kullanıcı için hata fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as never);

      await expect(sendPhoneVerificationCode("+491701234567")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.auth_required
      );
    });

    it("geçersiz telefon formatı için hata fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      await expect(sendPhoneVerificationCode("12345")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.invalid_phone
      );
    });

    it("aynı telefon zaten doğrulanmışsa hata fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { phone_e164: "+491701234567" },
              error: null,
            }),
          }),
        }),
      });
      mockSupabase.from = fromMock as never;

      await expect(sendPhoneVerificationCode("+491701234567")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.same_phone
      );
    });

    it("başarılı gönderimde updateUser çağrılır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabase.from = fromMock as never;

      mockSupabase.auth.updateUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      await sendPhoneVerificationCode("+491701234567");

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        phone: "+491701234567",
      });
    });

    it("Auth rate limit hatası için Türkçe mesaj fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabase.from = fromMock as never;

      const rateLimitError = new Error("rate limit exceeded");
      mockSupabase.auth.updateUser.mockRejectedValueOnce(rateLimitError);

      await expect(sendPhoneVerificationCode("+491701234567")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.rate_limited
      );
    });
  });

  describe("verifyPhoneVerificationCode", () => {
    it("giriş yapmamış kullanıcı için hata fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as never);

      await expect(verifyPhoneVerificationCode("123456")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.auth_required
      );
    });

    it("başarılı doğrulamada verifyOtp çağrılır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", phone: "+491701234567" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabase.from = fromMock as never;

      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: { id: "user-123" } },
        error: null,
      } as never);

      await verifyPhoneVerificationCode("123456");

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        type: "phone_change",
        token: "123456",
        phone: "+491701234567",
      });
    });

    it("hatalı kod için Türkçe mesaj fırlatır", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "user-123", phone: "+491701234567" } },
        error: null,
      } as never);

      const fromMock = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      mockSupabase.from = fromMock as never;

      mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "invalid token" },
      } as never);

      await expect(verifyPhoneVerificationCode("wrong")).rejects.toThrow(
        PHONE_VERIFICATION_ERROR_MESSAGES.verify_failed
      );
    });
  });

  describe("sözleşme: ülke türetme yasağı", () => {
    it("API modülü countryFromPhone/dialCode/callingCode/libphonenumber içermiyor", async () => {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const apiSource = readFileSync(
        resolve(__dirname, "phone-verification-api.ts"),
        "utf8"
      );

      expect(apiSource).not.toMatch(/countryFromPhone/);
      expect(apiSource).not.toMatch(/\bdial(?:l?ing)?_?[Cc]ode\b/);
      expect(apiSource).not.toMatch(/\bcalling_?[Cc]ode\b/);
      expect(apiSource).not.toMatch(/libphonenumber/);
    });
  });
});
