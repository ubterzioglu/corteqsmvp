/**
 * Cadde'nin çağıran katmanlara açık sözleşmesi.
 *
 * `cadde-api.ts` bu facade olmaya devam eder; uygulama alanı modüllere
 * ayrılırken yalnızca bu listedeki mevcut dışa açık fonksiyonlar korunur.
 */
export const CADDE_API_PUBLIC_EXPORTS = [
  "approveCaddeCafeMember",
  "archiveCaddeCafe",
  "countCaddePostsSince",
  "createCaddeCafe",
  "createCaddeComment",
  "createCaddePost",
  "getCaddeActorContext",
  "getCaddeCafe",
  "getCaddeFeedReach",
  "getCaddeSponsoredPlacement",
  "joinCaddeCafe",
  "listCaddeBillboardCards",
  "listCaddeCafeFeed",
  "listCaddeCafeMembers",
  "listCaddeCafes",
  "listCaddeCities",
  "listCaddeCountries",
  "listCaddeFeed",
  "listCaddeInterestCatalog",
  "listCaddePostComments",
  "listMyCaddeCafes",
  "listMyCaddeInterests",
  "listTrendingCaddeHashtags",
  "mapCaddeCafeJoinRequestRow",
  "recordCaddeShare",
  "reportCaddeEntity",
  "saveMyCaddeInterests",
  "searchCaddeMentions",
  "searchCaddePeople",
  "toggleCaddeReaction",
] as const;
