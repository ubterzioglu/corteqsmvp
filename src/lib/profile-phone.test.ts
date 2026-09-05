import { describe, expect, it } from "vitest";

import { formatPhoneForDisplay, normalizePhoneE164 } from "./profile-phone";

describe("normalizePhoneE164", () => {
  it("boşluk, tire, nokta ve parantezi atıp E.164 döner", () => {
    expect(normalizePhoneE164("+49 170 1234567")).toBe("+491701234567");
    expect(normalizePhoneE164("+90 (532) 123-45-67")).toBe("+905321234567");
    expect(normalizePhoneE164("+1.415.555.2671")).toBe("+14155552671");
  });

  it("00 uluslararası önekini + yapar", () => {
    expect(normalizePhoneE164("0049 170 1234567")).toBe("+491701234567");
  });

  it("ülke kodu olmayan, çok kısa veya harf içeren değeri reddeder", () => {
    expect(normalizePhoneE164("0170 1234567")).toBeNull();
    expect(normalizePhoneE164("+49 12")).toBeNull();
    expect(normalizePhoneE164("+49 abc 123456")).toBeNull();
    expect(normalizePhoneE164("")).toBeNull();
    expect(normalizePhoneE164("   ")).toBeNull();
  });

  it("15 rakamdan uzun numarayı ve 0 ile başlayan ülke kodunu reddeder", () => {
    expect(normalizePhoneE164("+1234567890123456")).toBeNull();
    expect(normalizePhoneE164("+0123456789")).toBeNull();
  });
});

describe("formatPhoneForDisplay", () => {
  it("boş değerde tire döner, doluysa kırpılmış değeri korur", () => {
    expect(formatPhoneForDisplay(null)).toBe("-");
    expect(formatPhoneForDisplay("  ")).toBe("-");
    expect(formatPhoneForDisplay(" +49 170 1234567 ")).toBe("+49 170 1234567");
  });
});
