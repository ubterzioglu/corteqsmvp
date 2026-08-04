import { describe, expect, it } from "vitest";

import { applyReactionToFeedPages, toggleViewerReaction } from "@/lib/cadde-reactions";
import type { CaddeFeedPage, CaddePost, CaddeReactionType } from "@/lib/cadde-types";

const makePost = (overrides: Partial<CaddePost> = {}): CaddePost =>
  ({
    id: "post-1",
    mode: "real",
    type: "text",
    title: null,
    body: "gövde",
    authorName: "Üye",
    authorRole: null,
    authorAvatarUrl: null,
    authorUserId: "user-1",
    country: null,
    city: null,
    isBridge: false,
    pinned: false,
    createdAt: "2026-08-04T10:00:00.000Z",
    needCategory: null,
    interests: [],
    hashtags: [],
    mentions: [],
    media: [],
    reactionCounts: { like: 2, love: 0, haha: 0, support: 0, unsure: 0 } as Record<CaddeReactionType, number>,
    totalReactionCount: 2,
    commentCount: 0,
    shareCount: 0,
    comments: [],
    viewerReactions: [],
    ...overrides,
  }) as CaddePost;

const makeData = (pages: CaddePost[][]) => ({
  pages: pages.map((items) => ({ items, nextPage: null }) as CaddeFeedPage),
  pageParams: pages.map(() => null),
});

describe("toggleViewerReaction", () => {
  it("reaksiyon yokken ekler ve sayaçları artırır", () => {
    const result = toggleViewerReaction(makePost(), "like");

    expect(result.viewerReactions).toEqual(["like"]);
    expect(result.reactionCounts.like).toBe(3);
    expect(result.totalReactionCount).toBe(3);
  });

  it("reaksiyon varken kaldırır ve sayaçları azaltır", () => {
    const result = toggleViewerReaction(makePost({ viewerReactions: ["like"] }), "like");

    expect(result.viewerReactions).toEqual([]);
    expect(result.reactionCounts.like).toBe(1);
    expect(result.totalReactionCount).toBe(1);
  });

  it("aynı postta farklı reaksiyon tipleri bağımsızdır", () => {
    const result = toggleViewerReaction(makePost({ viewerReactions: ["like"] }), "love");

    expect(result.viewerReactions).toEqual(["like", "love"]);
    expect(result.reactionCounts.like).toBe(2);
    expect(result.reactionCounts.love).toBe(1);
    expect(result.totalReactionCount).toBe(3);
  });

  it("sunucuyla ayrışmada sayaç eksiye düşmez", () => {
    const post = makePost({
      viewerReactions: ["like"],
      reactionCounts: { like: 0, love: 0, haha: 0, support: 0, unsure: 0 } as Record<CaddeReactionType, number>,
      totalReactionCount: 0,
    });

    const result = toggleViewerReaction(post, "like");

    expect(result.reactionCounts.like).toBe(0);
    expect(result.totalReactionCount).toBe(0);
  });

  it("girdi nesnesini MUTATE ETMEZ", () => {
    const post = makePost();
    const snapshot = JSON.stringify(post);

    toggleViewerReaction(post, "like");

    expect(JSON.stringify(post)).toBe(snapshot);
  });
});

describe("applyReactionToFeedPages", () => {
  it("doğru sayfadaki doğru postu çevirir, diğerlerine dokunmaz", () => {
    const data = makeData([
      [makePost({ id: "a" }), makePost({ id: "b" })],
      [makePost({ id: "c" })],
    ]);

    const result = applyReactionToFeedPages(data, "c", "like");

    expect(result?.pages[1].items[0].viewerReactions).toEqual(["like"]);
    expect(result?.pages[0].items[0].viewerReactions).toEqual([]);
    expect(result?.pages[0].items[1].viewerReactions).toEqual([]);
  });

  it("postu içermeyen sayfayı referans olarak korur (gereksiz render yok)", () => {
    const data = makeData([[makePost({ id: "a" })], [makePost({ id: "b" })]]);

    const result = applyReactionToFeedPages(data, "b", "like");

    expect(result?.pages[0]).toBe(data.pages[0]);
    expect(result?.pages[1]).not.toBe(data.pages[1]);
  });

  it("önbellek boşken undefined döner (ilk yükleme sırasında tıklama)", () => {
    expect(applyReactionToFeedPages(undefined, "a", "like")).toBeUndefined();
  });

  it("bilinmeyen postId önbelleği değiştirmez", () => {
    const data = makeData([[makePost({ id: "a" })]]);

    const result = applyReactionToFeedPages(data, "yok", "like");

    expect(result?.pages[0]).toBe(data.pages[0]);
  });
});
