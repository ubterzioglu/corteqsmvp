import { describe, expect, it } from "vitest";

import {
  CADDE_NEW_POST_POLL_BASE_MS,
  CADDE_NEW_POST_POLL_MAX_MS,
  CADDE_NEW_POST_POLL_MID_MS,
  caddeNewPostPollInterval,
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
