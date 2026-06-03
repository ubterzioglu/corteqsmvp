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

import {
  buildLandingDescription,
  normalizeCommunityText,
  normalizeLandingCategory,
  parseAdminContact,
  rowToLanding,
  slugify,
  stripLandingMetadataTags,
  submitLanding,
} from "@/lib/whatsapp-landings";

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

  it("normalizes legacy and unknown landing categories", () => {
    expect(normalizeLandingCategory("girisim")).toBe("yatirim");
    expect(normalizeLandingCategory("bilinmeyen")).toBe("diger");
  });

  it("strips metadata tags from landing descriptions", () => {
    expect(
      stripLandingMetadataTags(
        "Aciklama [Platform: WhatsApp] [Badge member: true] [Badge admin: false] [Editor review pending: true]",
      ),
    ).toBe("Aciklama");
  });

  it("builds landing descriptions while preserving metadata format", () => {
    expect(
      buildLandingDescription({
        description: "Aciklama [Platform: Telegram]",
        platform: "WhatsApp",
        memberApproved: true,
        adminApproved: false,
        editorReviewPending: true,
        editorReviewUpdatedAt: "2026-05-31T10:00:00.000Z",
      }),
    ).toBe(
      "Aciklama [Platform: WhatsApp] [Badge member: true] [Badge admin: false] [Editor review pending: true] [Editor review updated at: 2026-05-31T10:00:00.000Z]",
    );
  });

  it("parses admin contact lines", () => {
    expect(parseAdminContact("E-posta: ekip@ornek.com\nTelefon: +49 170 1234567")).toEqual({
      adminEmail: "ekip@ornek.com",
      adminPhone: "+49 170 1234567",
    });
  });

  it("defaults pending landings to member approved only when badge tags are absent", () => {
    const landing = rowToLanding({
      id: "landing-1",
      slug: "berlin-girisim",
      group_name: "Berlin Girisim",
      category: "girisim",
      country: "Almanya",
      city: "Berlin",
      mode: "text",
      hero_image: null,
      tagline: null,
      call_to_action_text: null,
      conditions: null,
      whatsapp_link: "https://example.com/group",
      admin_name: null,
      admin_contact: null,
      description: "[Platform: WhatsApp] [Başvuru tipi: Topluluk Üyesiyim] Test aciklamasi",
      status: "pending",
      rejection_reason: null,
      created_at: "2026-05-31T10:00:00.000Z",
      updated_at: "2026-05-31T10:00:00.000Z",
      user_id: "user-1",
    } as any);

    expect(landing.memberApproved).toBe(true);
    expect(landing.adminApproved).toBe(false);
    expect(landing.category).toBe("yatirim");
  });

  it("defaults approved landings to admin approved only when badge tags are absent", () => {
    const landing = rowToLanding({
      id: "landing-2",
      slug: "berlin-alumni",
      group_name: "Berlin Alumni",
      category: "alumni",
      country: "Almanya",
      city: "Berlin",
      mode: "visual",
      hero_image: null,
      tagline: null,
      call_to_action_text: null,
      conditions: null,
      whatsapp_link: "https://example.com/group",
      admin_name: null,
      admin_contact: null,
      description: "[Platform: WhatsApp] Test aciklamasi",
      status: "approved",
      rejection_reason: null,
      created_at: "2026-05-31T10:00:00.000Z",
      updated_at: "2026-05-31T10:00:00.000Z",
      user_id: "user-1",
    } as any);

    expect(landing.memberApproved).toBe(false);
    expect(landing.adminApproved).toBe(true);
  });

  it("never returns both member and admin badges together", () => {
    const landing = rowToLanding({
      id: "landing-3",
      slug: "berlin-network",
      group_name: "Berlin Network",
      category: "is",
      country: "Almanya",
      city: "Berlin",
      mode: "text",
      hero_image: null,
      tagline: null,
      call_to_action_text: null,
      conditions: null,
      whatsapp_link: "https://example.com/group",
      admin_name: null,
      admin_contact: null,
      description: "[Badge member: true] [Badge admin: true] Test aciklamasi",
      status: "approved",
      rejection_reason: null,
      created_at: "2026-05-31T10:00:00.000Z",
      updated_at: "2026-05-31T10:00:00.000Z",
      user_id: "user-1",
    } as any);

    expect(landing.adminApproved).toBe(true);
    expect(landing.memberApproved).toBe(false);
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
