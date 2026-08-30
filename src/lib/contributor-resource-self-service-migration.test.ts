import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pendingMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260830221500_contributor_resource_self_service.sql",
);
const migrationPath = existsSync(pendingMigrationPath)
  ? pendingMigrationPath
  : resolve(process.cwd(), "supabase/migrations/applied/20260830221500_contributor_resource_self_service.sql");

describe("contributor resource self-service migration", () => {
  const sql = readFileSync(migrationPath, "utf8");

  it("lets contributors see only their own submissions while preserving admin access", () => {
    expect(sql).toMatch(/create policy contributor_resource_submissions_owner_select/i);
    expect(sql).toMatch(/submitted_by\s*=\s*auth\.uid\(\)/i);
    expect(sql).toMatch(/public\.is_admin\(auth\.uid\(\)\)/i);
  });

  it("accepts writes only through a role-gated and rate-limited RPC", () => {
    expect(sql).toMatch(/function public\.submit_contributor_resource_submission/i);
    expect(sql).toMatch(/r\.key\s*=\s*'User_Contributor'/i);
    expect(sql).toMatch(/r\.is_active\s*=\s*true/i);
    expect(sql).toMatch(/interval '1 hour'/i);
    expect(sql).toMatch(/>=\s*10/i);
    expect(sql).toMatch(/set search_path\s*=\s*''/i);
  });

  it("does not grant direct writes to browser roles", () => {
    expect(sql).toMatch(/revoke all on function public\.submit_contributor_resource_submission[\s\S]*from public, anon/i);
    expect(sql).toMatch(/grant execute on function public\.submit_contributor_resource_submission[\s\S]*to authenticated/i);
    expect(sql).not.toMatch(/grant insert on public\.contributor_resource_submissions/i);
  });
});
