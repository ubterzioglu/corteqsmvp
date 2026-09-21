import { describe, expect, it } from "vitest";

import { CADDE_API_PUBLIC_EXPORTS } from "@/lib/cadde-api-facade";
import * as caddeApi from "@/lib/cadde-api";
import { listCaddeCities, listCaddeCountries, listCaddeFeed } from "@/lib/cadde-feed-location-api";

describe("Cadde API facade", () => {
  it("keeps the documented public surface stable for callers", () => {
    expect(Object.keys(caddeApi).sort()).toEqual([...CADDE_API_PUBLIC_EXPORTS].sort());
  });

  it("routes feed and location reads through their module without changing the facade", () => {
    expect(caddeApi.listCaddeFeed).toBe(listCaddeFeed);
    expect(caddeApi.listCaddeCountries).toBe(listCaddeCountries);
    expect(caddeApi.listCaddeCities).toBe(listCaddeCities);
  });
});
