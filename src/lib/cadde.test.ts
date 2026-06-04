import { describe, expect, it } from "vitest";

import { injectSponsoredPlacement, parseCaddeFilters, serializeCaddeFilters, type CaddePost } from "@/lib/cadde";

const makePost = (id: string): CaddePost => ({
  id,
  mode: "real",
  type: "text",
  title: `Post ${id}`,
  body: "Body",
  authorName: "Test",
  authorRole: null,
  authorAvatarUrl: null,
  authorUserId: null,
  country: null,
  city: null,
  isBridge: false,
  pinned: false,
  createdAt: "2026-05-29T00:00:00.000Z",
  reactionCounts: { like: 0, support: 0, idea: 0 },
  totalReactionCount: 0,
  commentCount: 0,
  comments: [],
  viewerReactions: [],
});

describe("cadde helpers", () => {
  it("parses and serializes filter state", () => {
    const params = new URLSearchParams("mode=real&country=Almanya&city=Berlin&bridge=1");
    const filters = parseCaddeFilters(params);

    expect(filters).toEqual({
      mode: "real",
      country: "Almanya",
      city: "Berlin",
      bridge: true,
    });

    expect(serializeCaddeFilters(filters).toString()).toBe("mode=real&country=Almanya&city=Berlin&bridge=1");
  });

  it("injects sponsored content after the third real post", () => {
    const items = injectSponsoredPlacement(
      [makePost("1"), makePost("2"), makePost("3"), makePost("4")],
      {
        id: "s-1",
        title: "Sponsor",
        description: "Desc",
        badgeText: "Sponsorlu",
        ctaLabel: "Git",
        ctaUrl: "/login?mode=signup",
        imageUrl: null,
      },
      "real",
    );

    expect(items.map((item) => item.kind)).toEqual(["post", "post", "post", "sponsor", "post"]);
  });
});
