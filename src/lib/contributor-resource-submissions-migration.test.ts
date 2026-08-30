import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/applied/20260830213000_contributor_resource_submissions.sql"),
  "utf8",
);

describe("contributor resource submissions migration", () => {
  it("is deny-by-default and grants authenticated users only admin-scoped access", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("public.is_admin(auth.uid())");
    expect(sql).toContain("revoke all on public.contributor_resource_submissions from anon, authenticated");
    expect(sql).toContain("grant select on public.contributor_resource_submissions to authenticated");
    expect(sql).not.toContain("grant insert on public.contributor_resource_submissions to authenticated");
  });

  it("validates input at the database boundary and keeps an audit trail", () => {
    expect(sql).toContain("admin_create_contributor_resource_submission");
    expect(sql).toContain("admin_review_contributor_resource_submission");
    expect(sql).toContain("contributor_resource_submission_events");
    expect(sql).toContain("contributor_resource_submission_audit_trigger");
    expect(sql).toContain("^https?://");
    expect(sql).toContain("rate_limit_exceeded");
  });

  it("leaves the transaction and ledger record to the safe migration runner", () => {
    expect(sql).not.toContain("supabase_migrations.schema_migrations");
    expect(sql).not.toMatch(/^\s*(begin|commit|rollback)\s*;/im);
  });
});
