/**
 * M12 · invites-api + invites-badges sözleşmesi.
 *
 * Kilitler:
 *   1. Hata haritası M11 migration'ına karşı ÇİFT YÖNLÜ (eksik kod → kullanıcı
 *      ham `invite_*` metni görür; hayalet kod → ölü ağırlık).
 *   2. Davet taşıyıcısı `?davet=` — M13 kayıt akışı BU parametreyi okuyacak;
 *      iki batch'in ayrışması sessizce davet kaybı üretir (round-trip kilitli).
 *   3. Alfabe TEK kaynak: normalizasyon referral-qr'dan (ikinci alfabe yok).
 *   4. Rozet eşikleri VERİDEN — modülde gömülü 3/10/25 YOK (M11 kararı).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  INVITE_ERROR_MESSAGES,
  INVITE_QUERY_PARAM,
  buildInviteLink,
  readInviteCodeFromSearch,
} from "@/lib/invites-api";
import { nextInviteGoal, resolveInviteBadge } from "@/lib/invites-badges";

const M11 = (() => {
  for (const dir of ["supabase/migrations/applied/", "supabase/migrations/"]) {
    const path = `${dir}20261003050000_user_invites_and_leaderboard.sql`;
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  throw new Error("M11 migration bulunamadı");
})();

describe("M12 · hata haritası M11'e karşı çift yönlü", () => {
  const raised = new Set([...M11.matchAll(/raise exception '(invite_[a-z0-9_]+)'/g)].map((m) => m[1]));

  it("M11'in her invite_* kodu haritada", () => {
    expect(raised.size).toBeGreaterThanOrEqual(3);
    const missing = [...raised].filter((code) => !(code in INVITE_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada M11'de olmayan hayalet kod yok", () => {
    const phantom = Object.keys(INVITE_ERROR_MESSAGES).filter((code) => !M11.includes(`'${code}'`));
    expect(phantom).toEqual([]);
  });
});

describe("M12 · davet taşıyıcısı (?davet=) — M13 köprüsü", () => {
  it("parametre adı tek sabitten: davet", () => {
    expect(INVITE_QUERY_PARAM).toBe("davet");
  });

  it("build → read round-trip (normalize edilerek)", () => {
    const link = buildInviteLink("hkwxk6", "https://corteqs.net");
    expect(link).toBe("https://corteqs.net/?davet=HKWXK6");
    expect(readInviteCodeFromSearch(new URL(link).search)).toBe("HKWXK6");
  });

  it("geçersiz/kirli kod null döner (kayıt akışı bonusu düşürmez — M13)", () => {
    expect(readInviteCodeFromSearch("?davet=")).toBeNull();
    expect(readInviteCodeFromSearch("?baska=1")).toBeNull();
    // SAFE_CHARS dışında karakter (I/O/0/1 alfabe dışı ama pattern [A-Z0-9] —
    // kilit: boş ve aşırı uzun girdi reddedilir)
    expect(readInviteCodeFromSearch(`?davet=${"A".repeat(200)}`)).toBeNull();
  });

  it("alfabe ikinci kez UYDURULMAZ — normalizasyon referral-qr'dan", () => {
    const api = readFileSync("src/lib/invites-api.ts", "utf8");
    expect(api).toContain('import { normalizeReferralCode } from "@/lib/referral-qr"');
  });
});

describe("M12 · invites-badges — eşik veriden, modülde sabit YOK", () => {
  const source = readFileSync("src/lib/invites-badges.ts", "utf8");

  it("modül gövdesinde gömülü eşik yok (3/10/25 RPC'den gelir)", () => {
    const code = source
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toMatch(/\b(3|10|25)\b/);
  });

  it("resolveInviteBadge en yüksek kazanılmış kademeyi döner", () => {
    const tiers = [3, 10, 25];
    expect(resolveInviteBadge(0, tiers)).toBeNull();
    expect(resolveInviteBadge(2, tiers)).toBeNull();
    expect(resolveInviteBadge(3, tiers)).toEqual({ tier: 3, label: "3+ davet" });
    expect(resolveInviteBadge(10, tiers)).toEqual({ tier: 10, label: "10+ davet" });
    expect(resolveInviteBadge(99, tiers)).toEqual({ tier: 25, label: "25+ davet" });
  });

  it("sırasız/bozuk tiers verisi normalize edilir (ürün kararı SQL'de değişebilir)", () => {
    expect(resolveInviteBadge(5, [25, 3, 10])).toEqual({ tier: 3, label: "3+ davet" });
    expect(resolveInviteBadge(5, [])).toBeNull();
    expect(resolveInviteBadge(5, [0, -1])).toBeNull();
  });

  it("nextInviteGoal bir sonraki kademeye kalanı verir", () => {
    expect(nextInviteGoal(0, [3, 10, 25])).toBe(3);
    expect(nextInviteGoal(4, [3, 10, 25])).toBe(6);
    expect(nextInviteGoal(25, [3, 10, 25])).toBeNull();
  });
});
