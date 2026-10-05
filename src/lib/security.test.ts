// GV3 · security.ts güvenlik testleri
//
// safeHref ve sanitizeHtml kontrolleri

import { describe, expect, it } from "vitest";
import { safeHref, sanitizeUrl } from "@/lib/security";

describe("security.ts — safeHref (SG10)", () => {
  it("normal URL kabul edilmeli", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("http://example.com")).toBe("http://example.com");
  });

  it("javascript: protokolü reddedilmeli", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("JAVASCRIPT:alert(1)")).toBe("#");
  });

  it("data: protokolü reddedilmeli", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBe("#");
  });

  it("vbscript: protokolü reddedilmeli", () => {
    expect(safeHref("vbscript:MsgBox(1)")).toBe("#");
  });

  it("blob: protokolü reddedilmeli", () => {
    expect(safeHref("blob:http://example.com/abc")).toBe("#");
  });

  it("null/undefined için # dönmeli", () => {
    expect(safeHref(null)).toBe("#");
    expect(safeHref(undefined)).toBe("#");
  });

  it("boş string için # dönmeli", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref("   ")).toBe("#");
  });

  it("protokolsüz URL'ye https eklenmeli", () => {
    expect(safeHref("example.com")).toBe("https://example.com");
  });
});

describe("security.ts — sanitizeUrl (SG10)", () => {
  it("normal URL kabul edilmeli", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("javascript: protokolü reddedilmeli", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("boş string için boş dönmeli", () => {
    expect(sanitizeUrl("")).toBe("");
  });
});
