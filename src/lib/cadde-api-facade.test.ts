import { describe, expect, it } from "vitest";

import { CADDE_API_PUBLIC_EXPORTS } from "@/lib/cadde-api-facade";
import {
  countCaddePostsSince,
  createCaddeComment,
  recordCaddeShare,
  reportCaddeEntity,
  toggleCaddeReaction,
} from "@/lib/cadde-engagement-api";
import * as caddeApi from "@/lib/cadde-api";
import {
  approveCaddeCafeMember,
  archiveCaddeCafe,
  createCaddeCafe,
  getCaddeCafe,
  joinCaddeCafe,
  listCaddeCafeMembers,
  listCaddeCafes,
  listMyCaddeCafes,
  mapCaddeCafeJoinRequestRow,
} from "@/lib/cadde-cafe-api";
import { listCaddeCities, listCaddeCountries, listCaddeFeed } from "@/lib/cadde-feed-location-api";
import { getCaddeSponsoredPlacement, listCaddeBillboardCards } from "@/lib/cadde-promotion-api";
import {
  listCaddeInterestCatalog,
  listMyCaddeInterests,
  listTrendingCaddeHashtags,
  saveMyCaddeInterests,
  searchCaddeMentions,
  searchCaddePeople,
} from "@/lib/cadde-search-interests-api";

describe("Cadde API facade", () => {
  it("keeps the documented public surface stable for callers", () => {
    expect(Object.keys(caddeApi).sort()).toEqual([...CADDE_API_PUBLIC_EXPORTS].sort());
  });

  it("routes feed and location reads through their module without changing the facade", () => {
    expect(caddeApi.listCaddeFeed).toBe(listCaddeFeed);
    expect(caddeApi.listCaddeCountries).toBe(listCaddeCountries);
    expect(caddeApi.listCaddeCities).toBe(listCaddeCities);
  });

  it("routes engagement actions through their module without changing the facade", () => {
    expect(caddeApi.toggleCaddeReaction).toBe(toggleCaddeReaction);
    expect(caddeApi.createCaddeComment).toBe(createCaddeComment);
    expect(caddeApi.recordCaddeShare).toBe(recordCaddeShare);
    expect(caddeApi.reportCaddeEntity).toBe(reportCaddeEntity);
    expect(caddeApi.countCaddePostsSince).toBe(countCaddePostsSince);
  });

  it("routes promotion reads through their module without changing the facade", () => {
    expect(caddeApi.listCaddeBillboardCards).toBe(listCaddeBillboardCards);
    expect(caddeApi.getCaddeSponsoredPlacement).toBe(getCaddeSponsoredPlacement);
  });

  it("routes search and interest operations through their module without changing the facade", () => {
    expect(caddeApi.searchCaddeMentions).toBe(searchCaddeMentions);
    expect(caddeApi.searchCaddePeople).toBe(searchCaddePeople);
    expect(caddeApi.listTrendingCaddeHashtags).toBe(listTrendingCaddeHashtags);
    expect(caddeApi.listCaddeInterestCatalog).toBe(listCaddeInterestCatalog);
    expect(caddeApi.listMyCaddeInterests).toBe(listMyCaddeInterests);
    expect(caddeApi.saveMyCaddeInterests).toBe(saveMyCaddeInterests);
  });

  it("routes cafe mutations through their existing module without changing the facade", () => {
    expect(caddeApi.joinCaddeCafe).toBe(joinCaddeCafe);
    expect(caddeApi.createCaddeCafe).toBe(createCaddeCafe);
    expect(caddeApi.approveCaddeCafeMember).toBe(approveCaddeCafeMember);
    expect(caddeApi.archiveCaddeCafe).toBe(archiveCaddeCafe);
  });

  it("routes cafe summary reads through the cafe module without changing the facade", () => {
    expect(caddeApi.listCaddeCafes).toBe(listCaddeCafes);
    expect(caddeApi.getCaddeCafe).toBe(getCaddeCafe);
    expect(caddeApi.listMyCaddeCafes).toBe(listMyCaddeCafes);
  });

  it("routes cafe membership reads through the cafe module without changing the facade", () => {
    expect(caddeApi.listCaddeCafeMembers).toBe(listCaddeCafeMembers);
    expect(caddeApi.mapCaddeCafeJoinRequestRow).toBe(mapCaddeCafeJoinRequestRow);
  });
});
