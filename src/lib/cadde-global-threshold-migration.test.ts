import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CADDE_GLOBAL_THRESHOLD_SETTINGS } from "@/lib/cadde-ranking";

const migrationPaths = [
  "supabase/migrations/20260802160000_cadde_global_threshold.sql",
  "supabase/migrations/applied/20260802160000_cadde_global_threshold.sql",
];
const migrationSql = () => readFileSync(migrationPaths.find((path) => existsSync(path)) ?? migrationPaths[0], "utf8");

describe("cadde global threshold migration", () => {
  it("adds denormalized engagement counters and trigger maintenance", () => {
    const sql = migrationSql();

    expect(sql).toContain("reaction_count integer not null default 0");
    expect(sql).toContain("comment_count integer not null default 0");
    expect(sql).toContain("cadde_touch_engagement_counts");
    expect(sql).toContain("trg_cadde_reaction_counts");
    expect(sql).toContain("trg_cadde_comment_counts");
  });

  it("keeps SQL settings mirrored with the TS threshold constants", () => {
    const sql = migrationSql();

    expect(sql).toContain(`('cadde.global.enabled', '${CADDE_GLOBAL_THRESHOLD_SETTINGS.enabled}'::jsonb)`);
    expect(sql).toContain(`('cadde.global.min_reactions', '${CADDE_GLOBAL_THRESHOLD_SETTINGS.minReactions}'::jsonb)`);
    expect(sql).toContain(`('cadde.global.min_comments', '${CADDE_GLOBAL_THRESHOLD_SETTINGS.minComments}'::jsonb)`);
    expect(sql).toContain(`('cadde.global.min_shares', '${CADDE_GLOBAL_THRESHOLD_SETTINGS.minShares}'::jsonb)`);
  });

  it("updates list_cadde_feed_v1 without changing its jsonb cursor signature", () => {
    const sql = migrationSql();

    expect(sql).toContain("create or replace function public.list_cadde_feed_v1(p_filters jsonb");
    expect(sql).toContain("public.cadde_setting_bool('cadde.global.enabled', true)");
    expect(sql).toContain("public.cadde_setting_int('cadde.global.min_reactions', 10)");
    expect(sql).toContain("public.cadde_setting_int('cadde.global.min_comments', 5)");
    expect(sql).toContain("public.cadde_setting_int('cadde.global.min_shares', 10)");
    expect(sql).toContain("'reaction_count', pg.reaction_count");
    expect(sql).toContain("'comment_count', pg.comment_count");
    expect(sql).toContain("'share_count', pg.share_count");
  });
});
