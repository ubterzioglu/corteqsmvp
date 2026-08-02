import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPaths = [
  "supabase/migrations/20260802150000_cadde_share.sql",
  "supabase/migrations/applied/20260802150000_cadde_share.sql",
];
const migrationSql = () => readFileSync(migrationPaths.find((path) => existsSync(path)) ?? migrationPaths[0], "utf8");

describe("cadde share migration", () => {
  it("adds share storage, counter and security-definer RPC", () => {
    const sql = migrationSql();

    expect(sql).toContain("create table if not exists public.cadde_post_shares");
    expect(sql).toContain("share_count integer not null default 0");
    expect(sql).toContain("record_cadde_share_v1");
    expect(sql).toContain("cadde.share.minute_limit");
    expect(sql).toContain("cadde_share_rate_limited");
    expect(sql).toContain("cadde_share_post_not_found");
    expect(sql).toContain("grant execute on function public.record_cadde_share_v1(uuid, text) to authenticated");
  });

  it("keeps direct share inserts closed for clients", () => {
    const sql = migrationSql().toLowerCase();

    expect(sql).toContain("enable row level security");
    expect(sql).toContain("cadde post shares self read");
    expect(sql).not.toContain("for insert");
  });
});
