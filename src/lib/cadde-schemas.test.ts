import { describe, expect, it } from "vitest";

import {
  caddeCafeCreateSchema,
  caddeCafeJoinInputSchema,
  caddeCommentCreateSchema,
  caddeFilterSchema,
  caddePostCreateSchema,
  caddeReactionSchema,
  parseWithUserError,
} from "@/lib/cadde-schemas";

describe("caddePostCreateSchema", () => {
  it("accepts a valid post input and trims body/title", () => {
    const parsed = caddePostCreateSchema.parse({
      type: "question",
      title: "  Başlık  ",
      body: "  Merhaba Cadde  ",
      countryId: "Almanya",
      cityId: "Berlin",
      isBridge: false,
    });
    expect(parsed.body).toBe("Merhaba Cadde");
    expect(parsed.title).toBe("Başlık");
  });

  it("rejects an empty body with a Turkish user-facing message", () => {
    const result = caddePostCreateSchema.safeParse({ type: "text", body: "   ", isBridge: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Paylaşım metni zorunlu.");
    }
  });

  it("rejects unknown post types and overlong bodies", () => {
    expect(caddePostCreateSchema.safeParse({ type: "poll", body: "x", isBridge: false }).success).toBe(false);
    expect(caddePostCreateSchema.safeParse({ type: "text", body: "x".repeat(4001), isBridge: false }).success).toBe(false);
  });
});

describe("caddeCommentCreateSchema", () => {
  it("rejects empty comments", () => {
    const result = caddeCommentCreateSchema.safeParse({ postId: "p1", body: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Yorum boş olamaz.");
    }
  });

  it("accepts and trims a valid comment", () => {
    expect(caddeCommentCreateSchema.parse({ postId: "p1", body: " selam " }).body).toBe("selam");
  });
});

describe("caddeReactionSchema", () => {
  it("only allows known reaction types", () => {
    expect(caddeReactionSchema.safeParse({ postId: "p1", reactionType: "like" }).success).toBe(true);
    expect(caddeReactionSchema.safeParse({ postId: "p1", reactionType: "love" }).success).toBe(false);
  });
});

describe("caddeFilterSchema", () => {
  it("validates filter state shape (Faz 3: çoklu ülke/şehir)", () => {
    expect(caddeFilterSchema.safeParse({ mode: "real", countries: [], cities: [], bridge: false }).success).toBe(true);
    expect(caddeFilterSchema.safeParse({ mode: "real", countries: ["Almanya", "Hollanda"], cities: ["Berlin"], bridge: true }).success).toBe(true);
    expect(caddeFilterSchema.safeParse({ mode: "live", countries: [], cities: [], bridge: false }).success).toBe(false);
    expect(caddeFilterSchema.safeParse({ mode: "real", country: "", city: "", bridge: false }).success).toBe(false);
  });
});

describe("parseWithUserError", () => {
  it("returns parsed data on success", () => {
    expect(parseWithUserError(caddeCommentCreateSchema, { postId: "p1", body: "ok" })).toEqual({ postId: "p1", body: "ok" });
  });

  it("throws a plain Error carrying the first issue message", () => {
    expect(() => parseWithUserError(caddeCommentCreateSchema, { postId: "p1", body: "" })).toThrowError("Yorum boş olamaz.");
  });
});

describe("caddeCafeCreateSchema (Faz 4)", () => {
  const base = {
    title: "Berlin IT Sohbeti",
    summary: "Haftalik IT sohbeti",
    themeKey: "IT",
    isBridge: false,
    entryMode: "open" as const,
  };

  it("gecerli open cafe girdisini kabul eder", () => {
    expect(caddeCafeCreateSchema.safeParse(base).success).toBe(true);
  });

  it("referral modunda en az 4 karakter davet kodu ister", () => {
    expect(caddeCafeCreateSchema.safeParse({ ...base, entryMode: "referral" }).success).toBe(false);
    expect(caddeCafeCreateSchema.safeParse({ ...base, entryMode: "referral", referralCode: "ABC" }).success).toBe(false);
    expect(caddeCafeCreateSchema.safeParse({ ...base, entryMode: "referral", referralCode: "BERLIN26" }).success).toBe(true);
  });

  it("approval modunda giris sorusu ister", () => {
    expect(caddeCafeCreateSchema.safeParse({ ...base, entryMode: "approval" }).success).toBe(false);
    expect(caddeCafeCreateSchema.safeParse({ ...base, entryMode: "approval", entryQuestion: "Neden katilmak istiyorsun?" }).success).toBe(true);
  });

  it("bitis baslangictan once olamaz", () => {
    expect(caddeCafeCreateSchema.safeParse({ ...base, startsAt: "2026-06-11T12:00:00Z", endsAt: "2026-06-11T11:00:00Z" }).success).toBe(false);
    expect(caddeCafeCreateSchema.safeParse({ ...base, startsAt: "2026-06-11T12:00:00Z", endsAt: "2026-06-11T14:00:00Z" }).success).toBe(true);
  });

  it("dis linkler http(s) URL olmali, en fazla 3", () => {
    expect(caddeCafeCreateSchema.safeParse({ ...base, externalLinks: ["ftp://x"] }).success).toBe(false);
    expect(caddeCafeCreateSchema.safeParse({ ...base, externalLinks: ["https://example.com"] }).success).toBe(true);
  });
});

describe("caddeCafeJoinInputSchema (Faz 4)", () => {
  it("cafeId zorunlu; referral/answer opsiyonel", () => {
    expect(caddeCafeJoinInputSchema.safeParse({ cafeId: "c1" }).success).toBe(true);
    expect(caddeCafeJoinInputSchema.safeParse({ cafeId: "c1", referralCode: "X", answer: "ben" }).success).toBe(true);
    expect(caddeCafeJoinInputSchema.safeParse({ cafeId: "" }).success).toBe(false);
  });
});
