import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("Cadde Tanıtım uçtan uca sözleşmesi (workshop m100)", () => {
  it("keeps create, admin review and placement consumption wired", () => {
    const api = readFileSync("src/lib/cadde-tanitim-api.ts", "utf8");
    const admin = readFileSync("src/pages/admin/AdminCaddePromotionsPage.tsx", "utf8");
    const cadde = readFileSync("src/pages/cadde/CaddePage.tsx", "utf8");
    const rail = readFileSync("src/components/cadde/PromotionRail.tsx", "utf8");
    const sql = readFileSync("supabase/migrations/archive/20260611120000_cadde300_010_tanitim.sql", "utf8");

    expect(api).toContain('db.rpc("create_cadde_promotion_campaign_v1"');
    expect(api).toContain('db.rpc("admin_review_cadde_promotion_v1"');
    expect(api).toContain('db.rpc("list_cadde_promotions_v1"');
    expect(admin).toContain("adminReviewPromotion(campaignId, approve");
    expect(cadde).toContain('listCaddePromotions("cadde-feed-inline"');
    expect(rail).toContain('listCaddePromotions("cadde-right-rail"');
    expect(sql).toContain("create or replace function public.create_cadde_promotion_campaign_v1");
    expect(sql).toContain("create or replace function public.admin_review_cadde_promotion_v1");
    expect(sql).toContain("create or replace function public.list_cadde_promotions_v1");
  });
});
