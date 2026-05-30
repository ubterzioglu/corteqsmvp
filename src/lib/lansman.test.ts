import { describe, expect, it } from "vitest";

import {
  buildLansmanSocialHref,
  buildInitials,
  createRegistration,
  isValidWhatsappPhone,
  updateRegistrationStatus,
  validateOptionalUrl,
} from "@/lib/lansman";

describe("lansman helpers", () => {
  it("builds initials from first and last name", () => {
    expect(buildInitials("Ugur", "Bulut")).toBe("UB");
    expect(buildInitials(" ada ", " lovelace ")).toBe("AL");
  });

  it("validates international whatsapp phone formats", () => {
    expect(isValidWhatsappPhone("+491701234567")).toBe(true);
    expect(isValidWhatsappPhone("+49 170 1234567")).toBe(true);
    expect(isValidWhatsappPhone("01701234567")).toBe(false);
    expect(isValidWhatsappPhone("+12")).toBe(false);
  });

  it("accepts blank optional urls and rejects malformed ones", () => {
    expect(validateOptionalUrl("")).toBeNull();
    expect(validateOptionalUrl(" https://example.com/profile ")).toBe(
      "https://example.com/profile",
    );
    expect(() => validateOptionalUrl("instagram.com/user")).toThrow(
      "Geçerli bir URL girin.",
    );
  });

  it("builds clickable social links from stored handles", () => {
    expect(buildLansmanSocialHref("linkedin", "ada-lovelace")).toBe(
      "https://www.linkedin.com/in/ada-lovelace",
    );
    expect(buildLansmanSocialHref("instagram", "@adalovelace")).toBe(
      "https://www.instagram.com/adalovelace",
    );
    expect(buildLansmanSocialHref("youtube", "AdaChannel")).toBe(
      "https://www.youtube.com/@AdaChannel",
    );
    expect(buildLansmanSocialHref("website", "example.com")).toBe(
      "https://example.com",
    );
  });

  it("rejects unsupported status updates before hitting the database", async () => {
    await expect(
      updateRegistrationStatus("test-id", "pending"),
    ).rejects.toThrow("Geçersiz durum güncellemesi.");
  });

  it("requires instagram for lansman registrations", async () => {
    await expect(
      createRegistration({
        first_name: "Ada",
        last_name: "Lovelace",
        phone: "+491701234567",
        linkedin: "",
        instagram: "",
        youtube: "",
        website: "",
        description: "",
      }),
    ).rejects.toThrow("Instagram kullanıcı adı zorunludur.");
  });
});
