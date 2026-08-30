import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/applied/20260830130000_vip_invitations.sql"),
  "utf8",
);
const resolveFix = readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/20260830131000_fix_vip_resolve_terminal_return.sql"),
  "utf8",
);

describe("VIP invitations migration", () => {
  it("stores only a token hash and enforces one-time redemption", () => {
    expect(migration).toContain("token_hash text not null unique");
    expect(migration).not.toMatch(/\braw_token\b|\btoken\s+text\s+not\s+null/);
    expect(migration).toContain("for update");
    expect(migration).toContain("use_count = 1");
  });

  it("keeps the tables deny-by-default and exposes narrow RPC grants", () => {
    expect(migration).toContain("alter table public.vip_invitations enable row level security");
    expect(migration).toContain("alter table public.vip_invitation_resolve_attempts enable row level security");
    expect(migration).toContain("revoke all on public.vip_invitation_resolve_attempts from anon, authenticated");
    expect(migration).toContain("grant execute on function public.resolve_vip_invitation(text) to anon, authenticated");
  });

  it("rate limits hashed requesters and never persists raw request headers", () => {
    expect(migration).toContain("requester_hash text not null");
    expect(migration).toContain(">= 30");
    expect(migration).not.toMatch(/\bip_address\b|\buser_agent\b/);
  });

  it("returns exactly once from every terminal resolve state", () => {
    for (const terminalState of ["invalid", "revoked", "used", "expired"]) {
      expect(resolveFix).toMatch(new RegExp(`'${terminalState}'::text[\\s\\S]{0,220}return;`));
    }
  });
});
