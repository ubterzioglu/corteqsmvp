import { describe, expect, it } from "vitest";

import { fetchCaddeUserNameMap } from "@/lib/cadde-api-support";

describe("Cadde API support lookups", () => {
  it("does not query when no profile id is requested", async () => {
    await expect(fetchCaddeUserNameMap([])).resolves.toEqual(new Map());
  });
});
