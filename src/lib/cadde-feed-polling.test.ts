import { describe, expect, it } from "vitest";

import {
  CADDE_NEW_POST_POLL_BASE_MS,
  CADDE_NEW_POST_POLL_MAX_MS,
  CADDE_NEW_POST_POLL_MID_MS,
  caddeNewPostPollInterval,
  newestCaddeCreatedAt,
  nextCaddeZeroStreak,
} from "./cadde-feed-polling";

describe("caddeNewPostPollInterval", () => {
  it("chip görünürken (count > 0) polling'i durdurur", () => {
    expect(caddeNewPostPollInterval(1, 0)).toBe(false);
    expect(caddeNewPostPollInterval(5, 10)).toBe(false);
  });

  it("ilk kontrollerde taban aralığı kullanır", () => {
    expect(caddeNewPostPollInterval(0, 0)).toBe(CADDE_NEW_POST_POLL_BASE_MS);
    expect(caddeNewPostPollInterval(0, 1)).toBe(CADDE_NEW_POST_POLL_BASE_MS);
    expect(caddeNewPostPollInterval(0, 2)).toBe(CADDE_NEW_POST_POLL_BASE_MS);
  });

  it("0 sonuç sürdükçe kademeli geri çekilir ve tavanda kalır", () => {
    expect(caddeNewPostPollInterval(0, 3)).toBe(CADDE_NEW_POST_POLL_MID_MS);
    expect(caddeNewPostPollInterval(0, 5)).toBe(CADDE_NEW_POST_POLL_MID_MS);
    expect(caddeNewPostPollInterval(0, 6)).toBe(CADDE_NEW_POST_POLL_MAX_MS);
    expect(caddeNewPostPollInterval(0, 100)).toBe(CADDE_NEW_POST_POLL_MAX_MS);
  });
});

describe("nextCaddeZeroStreak", () => {
  it("yeni post görülünce streak sıfırlanır", () => {
    expect(nextCaddeZeroStreak(3, 5)).toBe(0);
    expect(nextCaddeZeroStreak(1, 0)).toBe(0);
  });

  it("0 sonuçta streak artar", () => {
    expect(nextCaddeZeroStreak(0, 0)).toBe(1);
    expect(nextCaddeZeroStreak(0, 4)).toBe(5);
  });
});

describe("newestCaddeCreatedAt (m16 taban fix)", () => {
  it("tüm sayfalardaki en yeni createdAt'i döner — ilk öğe pinned/eski olsa bile", () => {
    const pages = [
      {
        items: [
          { createdAt: "2026-07-01T10:00:00+00:00" }, // pinned eski post listenin başında
          { createdAt: "2026-08-02T09:30:00+00:00" }, // gerçek en yeni, ortada
        ],
      },
      { items: [{ createdAt: "2026-07-20T08:00:00+00:00" }] },
    ];
    expect(newestCaddeCreatedAt(pages)).toBe("2026-08-02T09:30:00+00:00");
  });

  it("null createdAt'leri atlar; boş/undefined girişte null döner", () => {
    expect(newestCaddeCreatedAt(undefined)).toBeNull();
    expect(newestCaddeCreatedAt([])).toBeNull();
    expect(newestCaddeCreatedAt([{ items: [{ createdAt: null }] }])).toBeNull();
    expect(
      newestCaddeCreatedAt([{ items: [{ createdAt: null }, { createdAt: "2026-08-01T00:00:00+00:00" }] }]),
    ).toBe("2026-08-01T00:00:00+00:00");
  });
});
