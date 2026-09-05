import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RESULT_RETURN_TTL_MS,
  forgetToolResult,
  readToolResultReturn,
  rememberToolResult,
} from "@/lib/relocation-result-return";

const RESULT_HREF = "/tools/city_match/result/abc-123";

beforeEach(() => {
  window.sessionStorage.clear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rememberToolResult / readToolResultReturn", () => {
  it("CTA'dan gidilen sayfada sonuç adresini geri verir", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    expect(readToolResultReturn("/cadde")).toEqual({
      href: RESULT_HREF,
      toolLabel: "Şehir Eşleştirme",
    });
  });

  it("sonuç sayfasının KENDİSİNDE şerit göstermez", () => {
    // Kullanıcı zaten sonuçtaysa "sonuca dön" demek anlamsız ve kafa karıştırıcı.
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    expect(readToolResultReturn(RESULT_HREF)).toBeNull();
  });

  it("hiç iz yoksa null döner", () => {
    expect(readToolResultReturn("/cadde")).toBeNull();
  });

  it("süre dolunca izi unutur", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + RESULT_RETURN_TTL_MS + 1_000);
    expect(readToolResultReturn("/cadde")).toBeNull();
  });

  it("forgetToolResult izi siler (kullanıcı şeridi kapatınca)", () => {
    rememberToolResult({ href: RESULT_HREF, toolLabel: "Şehir Eşleştirme" });
    forgetToolResult();
    expect(readToolResultReturn("/cadde")).toBeNull();
  });

  it("uygulama dışı adresi HİÇ yazmaz", () => {
    // ResultCtaPanel'deki kuralın aynısı: "//host" ve "https://…" bozuk göreceli
    // yola dönüşür. Şerit kullanıcıyı asla site dışına atmamalı.
    rememberToolResult({ href: "https://kotu.example/x", toolLabel: "X" });
    expect(readToolResultReturn("/cadde")).toBeNull();
    rememberToolResult({ href: "//kotu.example/x", toolLabel: "X" });
    expect(readToolResultReturn("/cadde")).toBeNull();
  });

  it("bozuk JSON'da çökmez, sessizce yok sayar", () => {
    window.sessionStorage.setItem("corteqs.toolResultReturn", "{bozuk");
    expect(() => readToolResultReturn("/cadde")).not.toThrow();
    expect(readToolResultReturn("/cadde")).toBeNull();
  });

  it("sessionStorage erişilemezse çökmez", () => {
    // Gizli sekmede/çerezler kapalıyken erişim ATAR. Şerit bir kolaylıktır;
    // hiçbir koşulda sayfayı düşürmemeli.
    const spy = vi.spyOn(window.sessionStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => readToolResultReturn("/cadde")).not.toThrow();
    expect(readToolResultReturn("/cadde")).toBeNull();
    spy.mockRestore();
  });
});
