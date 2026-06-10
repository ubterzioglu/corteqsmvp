import { describe, expect, it } from "vitest";

import { injectSponsoredPlacement, parseCaddeFilters, serializeCaddeFilters } from "@/lib/cadde-format";
import type { CaddePost, CaddeSponsoredPlacement } from "@/lib/cadde-types";

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

const sponsor: CaddeSponsoredPlacement = {
  id: "s-1",
  title: "Sponsor",
  description: "Desc",
  badgeText: "Sponsorlu",
  ctaLabel: "Git",
  ctaUrl: "/login?mode=signup",
  imageUrl: null,
};

describe("parseCaddeFilters", () => {
  it("defaults to REAL mode when no mode param is present (Cadde 3.0 / R-01)", () => {
    const filters = parseCaddeFilters(new URLSearchParams(""));
    expect(filters).toEqual({ mode: "real", country: "", city: "", bridge: false });
  });

  it("enters demo mode only when explicitly requested", () => {
    expect(parseCaddeFilters(new URLSearchParams("mode=demo")).mode).toBe("demo");
    expect(parseCaddeFilters(new URLSearchParams("mode=real")).mode).toBe("real");
    expect(parseCaddeFilters(new URLSearchParams("mode=unknown")).mode).toBe("real");
  });

  it("parses country, city and bridge", () => {
    const filters = parseCaddeFilters(new URLSearchParams("country=Almanya&city=Berlin&bridge=1"));
    expect(filters).toEqual({ mode: "real", country: "Almanya", city: "Berlin", bridge: true });
  });

  it("trims whitespace in geo filters", () => {
    const filters = parseCaddeFilters(new URLSearchParams("country=%20Almanya%20"));
    expect(filters.country).toBe("Almanya");
  });
});

describe("serializeCaddeFilters", () => {
  it("omits the mode param for the real default and writes demo explicitly", () => {
    expect(serializeCaddeFilters({ mode: "real", country: "", city: "", bridge: false }).toString()).toBe("");
    expect(serializeCaddeFilters({ mode: "demo", country: "", city: "", bridge: false }).toString()).toBe("mode=demo");
  });

  it("round-trips filter state through the URL", () => {
    const original = { mode: "demo" as const, country: "Almanya", city: "Berlin", bridge: true };
    expect(parseCaddeFilters(serializeCaddeFilters(original))).toEqual(original);

    const realDefault = { mode: "real" as const, country: "Hollanda", city: "", bridge: false };
    expect(parseCaddeFilters(serializeCaddeFilters(realDefault))).toEqual(realDefault);
  });
});

describe("injectSponsoredPlacement", () => {
  it("injects sponsored content after the third real post", () => {
    const items = injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], sponsor, "real");
    expect(items.map((item) => item.kind)).toEqual(["post", "post", "post", "sponsor", "post"]);
  });

  it("does not inject in demo mode, without a sponsor, or with too few posts", () => {
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], sponsor, "demo").every((item) => item.kind === "post")).toBe(true);
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3"), makePost("4")], null, "real").every((item) => item.kind === "post")).toBe(true);
    expect(injectSponsoredPlacement([makePost("1"), makePost("2"), makePost("3")], sponsor, "real").every((item) => item.kind === "post")).toBe(true);
  });
});
