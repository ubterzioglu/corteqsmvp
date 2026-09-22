import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("assistant rate-limit single-source contract", () => {
  it("routes site-assistant through the shared epoch-based limiter", () => {
    const source = readFileSync("supabase/functions/site-assistant/index.ts", "utf8");
    const relocationSource = readFileSync("supabase/functions/relocation-assistant/index.ts", "utf8");

    expect(source).toContain('import { enforceRateLimit } from "../_shared/rate-limit.ts"');
    expect(source).toContain('await enforceRateLimit(supabase, req, "site-assistant"');
    expect(relocationSource).toContain('import { enforceRateLimit as enforceSharedRateLimit } from "../_shared/rate-limit.ts"');
    expect(relocationSource).toContain("await enforceSharedRateLimit(");
  });
});
