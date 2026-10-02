/**
 * G24 · moderatör API katmanı sözleşmesi (`group-moderation-api.ts`).
 *
 * Kilitler: hata haritası panelin çağırdığı BEŞ migration'a karşı çift yönlü ·
 * kararlar mevcut tek kapılardan gider (yeni karar RPC'si uydurulmaz) · kanıt
 * görüntüsü createSignedUrl ile (getPublicUrl YASAK — KR08 kilidi) · hızlı
 * şerit anahtarı beyaz liste anahtarını birebir gönderir.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { GROUP_MODERATION_ERROR_MESSAGES, REJECT_REASON_PRESETS } from "@/lib/admin-shell/group-moderation-api";
import { sliceBetween } from "@/test/source-slice";

const readMigration = (name: string) => {
  for (const dir of ["supabase/migrations/applied/", "supabase/migrations/"]) {
    const path = dir + name;
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  throw new Error(`${name} bulunamadı`);
};

const raiseCodes = (sql: string) =>
  new Set([...sql.matchAll(/raise exception '(group_[a-z0-9_]+|forbidden|unknown_setting_key|setting_value_must_be_boolean)'/g)].map((m) => m[1]));

const API = "src/lib/admin-shell/group-moderation-api.ts";

describe("G24 · hata haritası beş kapıya karşı çift yönlü", () => {
  const G24 = readMigration("20261002130000_group_moderator_panel.sql");
  const G12 = readMigration("20261002030000_group_status_machine.sql");
  const G13 = readMigration("20261002040000_group_claims.sql");
  const G15 = readMigration("20261002050000_group_strikes.sql");
  const G16 = readMigration("20261002060000_group_posts.sql");

  it("G24 kodları haritada", () => {
    for (const code of ["group_moderator_forbidden", "forbidden", "unknown_setting_key", "setting_value_must_be_boolean"]) {
      expect(G24).toContain(`'${code}'`);
      expect(code in GROUP_MODERATION_ERROR_MESSAGES, `eksik: ${code}`).toBe(true);
    }
  });

  it("karar kapılarının kullanıcıya dönebilen kodları haritada", () => {
    // Panelin çağırdığı fonksiyonların kodları (create-only yollar hariç):
    const expected = [
      "group_invalid_status", "group_hidden_reason_required", "group_not_found",
      "group_illegal_transition", "group_forbidden",                       // G12
      "group_claim_forbidden", "group_claim_invalid_decision", "group_claim_not_found",
      "group_claim_not_reviewable",                                       // G13
      "group_strike_forbidden", "group_strike_reason_required",
      "group_strike_invalid_redline", "group_already_removed",            // G15
      "group_post_invalid_decision", "group_post_not_found",
      "group_post_invalid_transition", "group_post_forbidden",            // G16
    ];
    const sources = G12 + G13 + G15 + G16;
    for (const code of expected) {
      expect(sources, `kod migration'da yok: ${code}`).toContain(`'${code}'`);
      expect(code in GROUP_MODERATION_ERROR_MESSAGES, `haritada eksik: ${code}`).toBe(true);
    }
  });

  it("haritada beş migration'da da OLMAYAN hayali kod yok", () => {
    const all = new Set<string>([
      ...raiseCodes(G24), ...raiseCodes(G12), ...raiseCodes(G13), ...raiseCodes(G15), ...raiseCodes(G16),
      "group_status_direct_update_forbidden", // guard v3 (G13) — PostgREST 42xxx mesajı
      "group_post_auth_required",             // G16 create/review ortak kodu
    ]);
    const phantom = Object.keys(GROUP_MODERATION_ERROR_MESSAGES).filter((code) => !all.has(code));
    expect(phantom).toEqual([]);
  });
});

describe("G24 · kararlar mevcut tek kapılardan (yeni RPC uydurulmaz)", () => {
  const src = readFileSync(API, "utf8");

  it("beş karar da bilinen fonksiyon adlarını çağırır", () => {
    expect(src).toContain('supabase.rpc("set_group_status_v1" as never');
    expect(src).toContain('supabase.rpc("admin_review_group_claim" as never');
    expect(src).toContain('supabase.rpc("group_post_review" as never');
    expect(src).toContain('supabase.rpc("admin_record_group_strike" as never');
    expect(src).toContain('supabase.rpc("admin_set_group_setting" as never');
    expect(src).toContain('supabase.rpc("group_moderator_summary" as never');
  });

  it("hızlı şerit anahtarı beyaz liste anahtarını birebir gönderir", () => {
    const fn = sliceBetween(src, "export async function setFastLaneEnabled(", "\n}", "setFastLaneEnabled");

    expect(fn).toContain('p_key: "groups.fast_lane_enabled"');
  });

  it("kanıt görüntüsü createSignedUrl ile — getPublicUrl YASAK (KR08)", () => {
    const fn = sliceBetween(src, "export async function createClaimScreenshotUrl(", "\n}", "createClaimScreenshotUrl");

    expect(fn).toContain('.from("group-claim-screenshots")');
    expect(fn).toContain("createSignedUrl(path, 300)");
    expect(src).not.toContain("getPublicUrl");
  });

  it("reddetme G12 reason sözlüğüyle uyumlu (published/rejected)", () => {
    const fn = sliceBetween(src, "export async function decidePendingGroup(", "\n}", "decidePendingGroup");

    expect(fn).toContain('p_to_status: decision === "approve" ? "published" : "rejected"');
    expect(fn).toContain('p_reason: decision === "approve" ? "published" : "rejected"');
  });
});

describe("G24 · hazır sebep listesi (ajan ihtiyatı — tek kaynak)", () => {
  it("liste boş değil ve 'Diğer' not ister", () => {
    expect(REJECT_REASON_PRESETS.length).toBeGreaterThanOrEqual(4);
    expect(REJECT_REASON_PRESETS.some((preset) => preset.startsWith("Diğer"))).toBe(true);
  });
});
