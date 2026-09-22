import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationFileName = "20260922120000_catalog_embedding_hnsw.sql";
const pendingPath = `supabase/migrations/${migrationFileName}`;
const appliedPath = `supabase/migrations/applied/${migrationFileName}`;

describe("B21.2 catalog vector index migration", () => {
  it("replaces the measured live ivfflat index with HNSW under the canonical name", () => {
    const migrationPath = existsSync(pendingPath) ? pendingPath : appliedPath;
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "drop index if exists public.idx_catalog_search_documents_embedding;",
    );
    expect(sql).toMatch(
      /create index idx_catalog_search_documents_embedding[\s\S]+using hnsw \(embedding vector_cosine_ops\)/,
    );
    expect(sql).not.toContain("catalog_search_documents_embedding_idx");
    expect(sql).not.toContain("using ivfflat");
  });
});
