import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("assistant provider single-source contract", () => {
  it("routes the site assistant through the shared provider entrypoint", () => {
    const source = readFileSync("supabase/functions/site-assistant/providers.ts", "utf8");

    expect(source).toContain('export * from "../_shared/providers.ts"');
  });
});
