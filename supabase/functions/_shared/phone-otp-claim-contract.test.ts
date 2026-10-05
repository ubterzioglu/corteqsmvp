import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const MIGRATION = readFileSync("supabase/migrations/applied/20261005400000_phone_otp_send_claim.sql", "utf8");
const HOOK_INDEX = readFileSync("supabase/functions/send-phone-otp-hook/index.ts", "utf8");
const CONFIG = readFileSync("supabase/config.toml", "utf8");

describe("phone OTP send-claim migration", () => {
  it("grants the quota RPCs to service_role only", () => {
    for (const signature of [
      "claim_phone_otp_send\\(uuid, text\\)",
      "finish_phone_otp_send\\(bigint, text, text\\)",
      "phone_otp_limit\\(jsonb, text, integer, integer\\)",
    ]) {
      expect(MIGRATION).toMatch(
        new RegExp(`revoke all on function public\\.${signature} from public, anon, authenticated;`),
      );
      expect(MIGRATION).toMatch(new RegExp(`grant execute on function public\\.${signature} to service_role;`));
      expect(MIGRATION).not.toMatch(new RegExp(`grant execute on function public\\.${signature} to (anon|authenticated)`));
    }
  });

  it("reads limits from group_settings instead of hard-coding them", () => {
    expect(MIGRATION).toContain("public.group_setting_json(");
    expect(MIGRATION).toContain("'groups.otp_rate_limits'");
    // Varsayılan yalnız satır silinirse devreye giren yedektir; sabit karşılaştırma OLMAMALI.
    expect(MIGRATION).not.toMatch(/>=\s*5\b/);
    expect(MIGRATION).not.toMatch(/>=\s*3\b/);
  });

  it("enforces per-phone, global and failure caps, not just per-user limits", () => {
    for (const key of ["per_phone_per_day", "global_per_hour", "per_user_failed_per_hour"]) {
      expect(MIGRATION).toContain(`'${key}'`);
    }
    for (const reason of ["'phone_daily'", "'global'", "'failures'"]) {
      expect(MIGRATION).toContain(reason);
    }
  });

  it("hardens limit parsing and the outcome guard", () => {
    expect(MIGRATION).toContain("jsonb_typeof(p_limits -> p_key) = 'number'");
    expect(MIGRATION).toContain("p_outcome is null or p_outcome not in ('sent', 'failed')");
    expect(MIGRATION).toContain("set search_path = public, pg_temp");
  });

  it("serialises concurrent claims per user", () => {
    expect(MIGRATION).toContain("pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0))");
  });

  it("counts only claimed and sent attempts toward the quota (failed sends are free)", () => {
    expect(MIGRATION).toContain("send_outcome in ('claimed', 'sent')");
    expect(MIGRATION).toMatch(/check \(send_outcome is null or send_outcome in \('claimed', 'sent', 'failed'\)\)/);
  });

  it("never stores the phone number or the code in the attempt ledger", () => {
    const columns = MIGRATION.match(/add column if not exists[^;]+;/g)?.join("\n") ?? "";
    // Yalnız özet (phone_hash) tutulur; düz numara ya da kod sütunu YOK.
    expect(columns).toContain("phone_hash text");
    expect(columns).not.toMatch(/phone_e164|phone_number|\bphone text|otp_code|\bcode\b/i);
  });

  it("is applied additively and does not touch the G04 mirror or the phone-only guard", () => {
    expect(MIGRATION).not.toMatch(/drop table|drop column|truncate/i);
    expect(MIGRATION).not.toMatch(/mirror_phone_confirmation_to_user_verifications|reject_phone_only_auth_signup/);
  });
});

describe("send-phone-otp-hook wiring", () => {
  it("calls exactly the RPCs the migration defines", () => {
    expect(HOOK_INDEX).toContain('rpc("claim_phone_otp_send"');
    expect(HOOK_INDEX).toContain('rpc("finish_phone_otp_send"');
  });

  it("passes the hashed recipient, a pepper and a Graph timeout", () => {
    expect(HOOK_INDEX).toContain("p_phone_hash: phoneHash");
    expect(HOOK_INDEX).toContain("WHATSAPP_OTP_PHONE_PEPPER");
    expect(HOOK_INDEX).toContain("AbortSignal.timeout(");
  });

  it("uses the dedicated OTP token, never the bot's WHATSAPP_ACCESS_TOKEN", () => {
    expect(HOOK_INDEX).toContain('Deno.env.get("WHATSAPP_OTP_ACCESS_TOKEN")');
    expect(HOOK_INDEX).not.toMatch(/Deno\.env\.get\("WHATSAPP_ACCESS_TOKEN"\)/);
  });

  it("is deployed with verify_jwt disabled (Auth hook calls carry no user JWT)", () => {
    expect(CONFIG).toMatch(/\[functions\.send-phone-otp-hook\]\s*\r?\nverify_jwt = false/);
  });
});
