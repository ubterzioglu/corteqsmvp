import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const fileName = "20260922130000_directory_semantic_search.sql";
const pendingPath = `supabase/migrations/${fileName}`;
const appliedPath = `supabase/migrations/applied/${fileName}`;

const readMigration = () => readFileSync(existsSync(pendingPath) ? pendingPath : appliedPath, "utf8");

describe("B21.3 directory semantic-search migration", () => {
  const migration = readMigration();
  const sqlOnly = migration.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

  it("adds an optional 1536-dimensional query vector and HNSW-ranked semantic candidates", () => {
    expect(migration).toContain("p_query_embedding vector(1536)");
    expect(migration).toContain("semantic_hits as materialized");
    expect(migration).toContain("order by d.embedding <=> p_query_embedding");
    expect(migration).toContain("limit 100");
    expect(migration).toContain("row_semantic_distance <= 0.35");
    expect(migration).toContain("then 4");
  });

  it("uses catalog_search_documents vectors without exposing its contact-bearing text", () => {
    expect(sqlOnly).toContain("public.catalog_search_documents d");
    expect(sqlOnly).not.toMatch(/d\.search_text/);
  });

  it("preserves both B20 admin guards, null featured handling, and public grants", () => {
    expect(migration).toContain("not ilike ''Admin_%''");
    expect(migration).toContain("not ilike ''Moderator_%''");
    expect(migration).toContain("r_x.key ilike ''Admin_%''");
    expect(migration).toContain("r_x.key ilike ''Moderator_%''");
    expect(migration).toContain("v_featured_only boolean := coalesce(p_featured_only, false)");
    expect(migration).toMatch(/to anon, authenticated, service_role/);
  });
});
