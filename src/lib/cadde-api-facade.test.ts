import { describe, expect, it } from "vitest";

import { CADDE_API_PUBLIC_EXPORTS } from "@/lib/cadde-api-facade";
import * as caddeApi from "@/lib/cadde-api";

describe("Cadde API facade", () => {
  it("keeps the documented public surface stable for callers", () => {
    expect(Object.keys(caddeApi).sort()).toEqual([...CADDE_API_PUBLIC_EXPORTS].sort());
  });
});
