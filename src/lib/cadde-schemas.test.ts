import { describe, expect, it } from "vitest";

import {
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
  it("validates filter state shape", () => {
    expect(caddeFilterSchema.safeParse({ mode: "real", country: "", city: "", bridge: false }).success).toBe(true);
    expect(caddeFilterSchema.safeParse({ mode: "live", country: "", city: "", bridge: false }).success).toBe(false);
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
