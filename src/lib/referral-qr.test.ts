import { describe, expect, it } from "vitest";

import {
  buildReferralTargetUrl,
  generateReferralQrSvg,
  normalizeReferralCode,
  readReferralCodeFromSearch,
} from "./referral-qr";

describe("referral QR", () => {
  it("kodu normalize edip kayıt URL'ine güvenli query parametresi olarak ekler", () => {
    expect(normalizeReferralCode("  liscty-abc123  ")).toBe("LISCTY-ABC123");
    expect(buildReferralTargetUrl("liscty-abc123", "https://corteqs.net")).toBe(
      "https://corteqs.net/founding-1000?ref=LISCTY-ABC123",
    );
  });

  it("landing query'sindeki referral kodunu forma aktarılmak üzere doğrular", () => {
    expect(readReferralCodeFromSearch("?ref=liscty-abc123")).toBe("LISCTY-ABC123");
    expect(readReferralCodeFromSearch("?ref=ABC%3Cscript%3E")).toBeUndefined();
    expect(readReferralCodeFromSearch("?foo=bar")).toBeUndefined();
  });

  it("geçersiz referral kodunu reddeder", () => {
    expect(() => normalizeReferralCode("ABC<script>")).toThrow(/geçersiz/i);
  });

  it("aynı URL için deterministik ve gerçek bir SVG üretir", async () => {
    const first = await generateReferralQrSvg("https://corteqs.net/login?mode=signup&ref=ABC-123");
    const second = await generateReferralQrSvg("https://corteqs.net/login?mode=signup&ref=ABC-123");

    expect(first).toBe(second);
    expect(first).toMatch(/^<svg/);
    expect(first).toContain("viewBox");
    expect(first).not.toContain("<script");
  });
});
