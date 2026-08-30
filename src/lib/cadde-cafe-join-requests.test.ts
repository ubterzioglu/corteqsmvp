import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { mapCaddeCafeJoinRequestRow } from "@/lib/cadde-api";

const MIGRATION = "supabase/migrations/applied/20260830100000_cadde_cafe_join_requests.sql";

describe("Cadde cafe join request summary (workshop m92)", () => {
  it("maps only the limited public profile summary", () => {
    expect(
      mapCaddeCafeJoinRequestRow({
        member_id: "member-1",
        user_id: "user-2",
        status: "pending",
        answer: "Frontend geliştiricisiyim",
        joined_at: "2026-08-30T10:00:00Z",
        display_name: "Ayşe K.",
        country: "Almanya",
        city: "Berlin",
        role_key: "User_Standard",
        role_label: "Bireysel Üye",
        short_bio: "Topluluk gönüllüsü.",
        has_public_profile: true,
      }),
    ).toEqual({
      id: "member-1",
      userId: "user-2",
      status: "pending",
      answer: "Frontend geliştiricisiyim",
      joinedAt: "2026-08-30T10:00:00Z",
      displayName: "Ayşe K.",
      country: "Almanya",
      city: "Berlin",
      roleKey: "User_Standard",
      roleLabel: "Bireysel Üye",
      shortBio: "Topluluk gönüllüsü.",
      hasPublicProfile: true,
    });
  });

  it("locks the RPC to the cafe host/admin/moderator and public approved attributes", () => {
    const sql = readFileSync(MIGRATION, "utf8").toLowerCase();

    expect(sql).toContain("list_cadde_cafe_join_requests_v1");
    expect(sql).toContain("auth.uid() is null");
    expect(sql).toMatch(/host_user_id\s*=\s*v_uid/);
    expect(sql).toContain("public.is_admin(v_uid)");
    expect(sql).toContain("public.is_moderator(v_uid)");
    expect(sql).toContain("upa.visibility = 'public'");
    expect(sql).toContain("upa.approval_status = 'approved'");
    expect(sql).toContain("catalog_item_is_publicly_visible");
    expect(sql).toContain("revoke all on function public.list_cadde_cafe_join_requests_v1(uuid) from public, anon");
    expect(sql).toContain("grant execute on function public.list_cadde_cafe_join_requests_v1(uuid) to authenticated, service_role");
    expect(sql).not.toContain("auth.users");
    expect(sql).not.toMatch(/select[\s\S]*\b(email|phone_e164|whatsapp)\b/);
  });
});
