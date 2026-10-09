import { describe, expect, it } from "vitest";

import { buildInvestorVerifier, DEFAULT_ITERATIONS } from "./investor-pass-hash.mjs";
import { derivePbkdf2Hex, parseInvestorVerifier } from "../src/lib/investor/investor-access";

describe("investor-pass-hash", () => {
  it("varsayılan iterasyon yüksektir (açık doğrulayıcıya kaba kuvvet pahalı kalsın)", () => {
    expect(DEFAULT_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });

  it("ürettiği doğrulayıcıyı tarayıcı tarafı ayrıştırır ve aynı özeti türetir", async () => {
    const raw = buildInvestorVerifier("uzun bir parola cümlesi", { iterations: 1000 });
    const parsed = parseInvestorVerifier(raw);
    expect(parsed).not.toBeNull();
    expect(parsed.saltHex).toHaveLength(32);
    expect(await derivePbkdf2Hex("uzun bir parola cümlesi", parsed.saltHex, 1000)).toBe(parsed.hashHex);
  });

  it("her çağrıda farklı tuz kullanır", () => {
    const a = buildInvestorVerifier("ayni parola cümlesi!", { iterations: 1000 });
    const b = buildInvestorVerifier("ayni parola cümlesi!", { iterations: 1000 });
    expect(a).not.toBe(b);
  });
});
