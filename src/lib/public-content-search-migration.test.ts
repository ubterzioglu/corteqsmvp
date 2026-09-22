import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/applied/20260922100000_public_content_search.sql";

describe("public content search migration", () => {
  it("indexes only published blog content for public search", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/create index[\s\S]+blog_posts[\s\S]+gin_trgm_ops/i);
    expect(sql).toMatch(/where\s+published\s*=\s*true/i);
  });

  it("exposes a bounded, PII-free anonymous search RPC", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("public.search_public_content");
    expect(sql).toMatch(/least\(greatest\(coalesce\(p_limit,[\s\S]+1\),\s*24\)/i);
    expect(sql).toMatch(/from\s+public\.blog_posts/i);
    expect(sql).toMatch(/where\s+b\.published\s*=\s*true/i);
    expect(sql).toMatch(/grant execute[\s\S]+to anon, authenticated/i);
    expect(sql).not.toMatch(/content_markdown\s+(?:text|as)/i);
  });
});
