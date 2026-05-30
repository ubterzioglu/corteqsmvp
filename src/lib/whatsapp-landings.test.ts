import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserSpy, fromSpy } = vi.hoisted(() => ({
  getUserSpy: vi.fn(),
  fromSpy: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: getUserSpy,
    },
    from: fromSpy,
  },
}));

import { normalizeCommunityText, slugify, submitLanding } from "@/lib/whatsapp-landings";

describe("whatsapp landing helpers", () => {
  it("slugifies Turkish characters and trims separators", () => {
    expect(slugify("Berlin Türk Girişimciler 2026!!")).toBe("berlin-turk-girisimciler-2026");
  });

  it("limits slug length", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
  });

  it("normalizes common Turkish community terms", () => {
    expect(normalizeCommunityText("Berlin Girisim Agi")).toBe("Berlin Girişim Ağı");
    expect(normalizeCommunityText("Dubai Yatirim Cevresi")).toBe("Dubai Yatırım Çevresi");
    expect(normalizeCommunityText("Turk Girisimciler")).toBe("Türk Girişimciler");
  });
});

describe("submitLanding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserSpy.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
  });

  it("inserts the landing without requiring an insert returning payload", async () => {
    let selectCallCount = 0;
    const insertSpy = vi.fn().mockResolvedValue({ error: null });

    fromSpy.mockImplementation((table: string) => {
      if (table !== "whatsapp_landings") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockImplementation(async () => {
              selectCallCount += 1;
              if (selectCallCount === 1) {
                return { data: null, error: null };
              }

              return { data: { id: "landing-1" }, error: null };
            }),
          }),
        }),
        insert: insertSpy,
      };
    });

    const result = await submitLanding({
      groupName: "Berlin Girisim",
      category: "girisim",
      country: "Almanya",
      city: "Berlin",
      mode: "text",
      whatsappLink: "https://chat.whatsapp.com/test",
      description: "Test aciklamasi",
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        slug: "berlin-girisim-berlin",
        group_name: "Berlin Girişim",
        description: "Test aciklamasi",
      }),
    );
    expect(result).toEqual({ id: "landing-1", slug: "berlin-girisim-berlin" });
  });

  it("returns the generated slug even when the follow-up lookup cannot read the row", async () => {
    let selectCallCount = 0;

    fromSpy.mockImplementation((table: string) => {
      if (table !== "whatsapp_landings") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockImplementation(async () => {
              selectCallCount += 1;
              if (selectCallCount === 1) {
                return { data: null, error: null };
              }

              return { data: null, error: { message: "select blocked" } };
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    });

    await expect(
      submitLanding({
        groupName: "Amsterdam Akademi",
        category: "akademik",
        country: "Hollanda",
        city: "Amsterdam",
        mode: "text",
        whatsappLink: "https://example.com/group",
      }),
    ).resolves.toEqual({
      id: "",
      slug: "amsterdam-akademi-amsterdam",
    });
  });
});
