import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPaths = [
  "supabase/migrations/20260802170000_cadde_multi_targets.sql",
  "supabase/migrations/applied/20260802170000_cadde_multi_targets.sql",
];
const migrationSql = () => readFileSync(migrationPaths.find((path) => existsSync(path)) ?? migrationPaths[0], "utf8");

describe("cadde multi-target migration", () => {
  it("adds a helper table without removing legacy post target columns", () => {
    const sql = migrationSql();

    expect(sql).toContain("create table if not exists public.cadde_post_targets");
    expect(sql).toContain("post_id uuid not null references public.cadde_posts(id) on delete cascade");
    expect(sql).toContain("country_id uuid not null references public.cadde_countries(id)");
    expect(sql).toContain("city_id uuid references public.cadde_cities(id)");
    expect(sql).toContain("insert into public.cadde_post_targets (post_id, country_id, city_id)");
  });

  it("keeps v1 intact and adds v2 with settings-backed premium enforcement", () => {
    const sql = migrationSql();

    expect(sql).toContain("'cadde.post.multi_target_requires_premium'");
    expect(sql).toContain("create or replace function public.create_cadde_post_v2");
    expect(sql).toContain("p_targets jsonb default '[]'::jsonb");
    expect(sql).toContain("public.has_cadde_feature(v_uid, 'cadde.post.multi_target')");
    expect(sql).toContain("cadde_multi_target_premium_required");
    expect(sql).not.toContain("drop function public.create_cadde_post_v1");
  });

  it("updates feed matching and output to read legacy columns plus target rows", () => {
    const sql = migrationSql();

    expect(sql).toContain("create or replace function public.list_cadde_feed_v1(p_filters jsonb");
    expect(sql).toContain("from public.cadde_post_targets t");
    expect(sql).toContain("t.post_id = p.id and t.city_id = v_viewer_city_id");
    expect(sql).toContain("t.post_id = b.id and t.country_id = v_viewer_country_id");
    expect(sql).toContain("'targets', coalesce((");
  });
});
