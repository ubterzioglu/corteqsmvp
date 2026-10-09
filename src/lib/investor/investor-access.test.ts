import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearInvestorSession,
  derivePbkdf2Hex,
  getInvestorVerifier,
  hasInvestorSession,
  parseInvestorVerifier,
  rememberInvestorSession,
  verifyInvestorPassword,
} from "./investor-access";

// RFC 6070 benzeri bilinen vektör (PBKDF2-HMAC-SHA256, P="password", S="salt", c=1, dkLen=32)
const SALT_HEX = "73616c74"; // "salt" — bilinen vektör için; üretimde 16 bayt rastgele tuz
const KNOWN_C1 = "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b";

const SALT16 = "00112233445566778899aabbccddeeff";
const ITER = 1_000;

async function makeVerifier(password: string): Promise<string> {
  return `pbkdf2:${ITER}:${SALT16}:${await derivePbkdf2Hex(password, SALT16, ITER)}`;
}

type ConfigWindow = Window & { __APP_CONFIG__?: Record<string, string> };

afterEach(() => {
  delete (window as ConfigWindow).__APP_CONFIG__;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("derivePbkdf2Hex", () => {
  it("bilinen PBKDF2-SHA256 test vektörünü üretir", async () => {
    expect(await derivePbkdf2Hex("password", SALT_HEX, 1)).toBe(KNOWN_C1);
  });
});

describe("parseInvestorVerifier", () => {
  it("geçerli biçimi ayrıştırır, büyük harfi küçültür", async () => {
    const raw = (await makeVerifier("abc")).toUpperCase().replace("PBKDF2", "pbkdf2");
    const parsed = parseInvestorVerifier(raw);
    expect(parsed?.iterations).toBe(ITER);
    expect(parsed?.saltHex).toBe(SALT16);
  });

  it.each([
    "",
    "duz-parola",
    "a".repeat(64), // eski düz SHA-256 biçimi artık kabul edilmez
    `pbkdf2:0:${SALT16}:${"a".repeat(64)}`,
    `pbkdf2:1000:abc:${"a".repeat(64)}`, // tuz çok kısa
    `pbkdf2:1000:${SALT16}:${"a".repeat(63)}`,
    `pbkdf2:1000:${SALT16}:${"a".repeat(64)}";alert(1)//`,
  ])("bozuk değeri reddeder: %s", (value) => {
    expect(parseInvestorVerifier(value)).toBeNull();
  });
});

describe("getInvestorVerifier", () => {
  it("çalışma anı yapılandırmasını okur", async () => {
    const raw = await makeVerifier("abc");
    (window as ConfigWindow).__APP_CONFIG__ = { INVESTOR_PASS_HASH: raw };
    expect(getInvestorVerifier()?.raw).toBe(raw);
  });

  it("çalışma anı yoksa build-time env'e düşer", async () => {
    const raw = await makeVerifier("abc");
    vi.stubEnv("VITE_INVESTOR_PASS_HASH", raw);
    expect(getInvestorVerifier()?.raw).toBe(raw);
  });

  it("hiçbiri yoksa null (kapı açılmaz)", () => {
    vi.stubEnv("VITE_INVESTOR_PASS_HASH", "");
    expect(getInvestorVerifier()).toBeNull();
  });
});

describe("verifyInvestorPassword", () => {
  it("doğru parolada true; yanlış/boş/doğrulayıcısız false", async () => {
    const verifier = parseInvestorVerifier(await makeVerifier("abc"));
    expect(await verifyInvestorPassword("abc", verifier)).toBe(true);
    expect(await verifyInvestorPassword("abd", verifier)).toBe(false);
    expect(await verifyInvestorPassword("", verifier)).toBe(false);
    expect(await verifyInvestorPassword("abc", null)).toBe(false);
  });
});

describe("oturum kaydı", () => {
  it("yalnız aynı doğrulayıcı için geçerlidir — parola değişince eski oturum düşer", async () => {
    const first = parseInvestorVerifier(await makeVerifier("abc"));
    const second = parseInvestorVerifier(await makeVerifier("xyz"));
    rememberInvestorSession(first!);
    expect(hasInvestorSession(first)).toBe(true);
    expect(hasInvestorSession(second)).toBe(false);
    expect(hasInvestorSession(null)).toBe(false);
    clearInvestorSession();
    expect(hasInvestorSession(first)).toBe(false);
  });

  it("storage erişilemezse fırlatmaz", async () => {
    const verifier = parseInvestorVerifier(await makeVerifier("abc"))!;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberInvestorSession(verifier)).not.toThrow();
    expect(hasInvestorSession(verifier)).toBe(false);
  });
});
