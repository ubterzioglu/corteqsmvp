import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("B21.3 directory-search Edge Function contract", () => {
  const sourcePath = "supabase/functions/directory-search/index.ts";

  it("creates query embeddings server-side with the catalog model contract", () => {
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain('taskType: "RETRIEVAL_QUERY"');
    expect(source).toContain("outputDimensionality: 1_536");
    expect(source).toContain("p_query_embedding: embedding ? JSON.stringify(embedding) : null");
  });

  it("requires the browser allowlist, bounded JSON, and shared rate limiting", () => {
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain("isAssistantOriginAllowed(origin)");
    expect(source).toContain("readJsonWithLimit(req");
    expect(source).toContain('enforceRateLimit(supabase, req, "directory-search"');
  });

  it("falls back to lexical RPC behavior when the embedding provider is unavailable", () => {
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain("const embedding = await embedQuery(");
    expect(source).toContain("p_query_embedding: embedding ? JSON.stringify(embedding) : null");
    expect(source).toContain("semantic: embedding !== null");
  });
});
