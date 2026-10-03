/**
 * M11 sözleşmesi — davet tabloları + RPC'ler + liderlik görünürlük üçlüsü.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **AI korpus sızıntısının tekrarı.** Liderlik SQL'i dizin görünürlüğünü
 *      AYNEN yansıtmazsa admin/Süper Admin/[PLACEHOLDER] adları herkese açık
 *      listeye düşer (21-22.09'da üçü de ölçülmüştü).
 *   2. **Alfabe kayması.** SQL alfabesi `SAFE_CHARS`'tan ayrışırsa karıştırılabilir
 *      kodlar üretilir (I/O/0/1) — ayna iki dosyayı birden kilitler.
 *   3. **Kendini davet / çift sayım.** redeem self-check ve invited_user_id
 *      unique düşerse liderlik şişirilebilir.
 *   4. **Anon liderliğin yanlışlıkla auth'a bağlanması** (M12 "gövdede auth
 *      kontrolü olmadığı DOĞRULANIR" notu — gövdeye auth.uid() girerse bu test düşer).
 *   5. **referral_codes'e dokunulması** (admin pazarlama kodu — farklı sistem).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SAFE_CHARS } from "@/lib/referral-codes";
import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261003050000_user_invites_and_leaderboard.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

const fn = (startSig: string, commentSig?: string) =>
  sliceBetween(
    code(),
    `create or replace function public.${startSig}`,
    `comment on function public.${commentSig ?? startSig}`,
    startSig,
  );

describe("M11 · salt ekleme + referral_codes ayrı sistem", () => {
  it("kolon/tablo düşürmez; referral_codes'e DOKUNMAZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    expect(sql).not.toMatch(/(alter|insert into|update)\s+public\.referral_codes/i);
  });
});

describe("M11 · tablolar — kanıt satırları korunur", () => {
  it("owner TEK kod üretir; invited_user_id BENZERSİZ (bir üye bir kez sayılır)", () => {
    const sql = code();

    expect(sql).toContain("owner_user_id uuid not null unique");
    expect(sql).toContain("invited_user_id uuid not null unique");
  });

  it("yazma politikası YOK — select yalnız kendi satırı (+admin)", () => {
    const sql = code();

    expect(sql).not.toMatch(/create policy[^;]*on public\.user_invites[^;]*for (insert|update|delete)/i);
    expect(sql).not.toMatch(/create policy[^;]*on public\.user_invite_redemptions[^;]*for (insert|update|delete)/i);
    expect(sql).toContain("using (owner_user_id = auth.uid() or public.is_admin(auth.uid()))");
    expect(sql).toContain("using (invited_user_id = auth.uid() or public.is_admin(auth.uid()))");
    expect(sql).toContain("revoke all on table public.user_invites from anon, authenticated");
  });
});

describe("M11 · alfabe aynası (SAFE_CHARS)", () => {
  it("SQL alfabesi referral-codes.ts SAFE_CHARS ile BİREBİR", () => {
    expect(fn("get_or_create_my_invite_code()")).toContain(`substr('${SAFE_CHARS}'`);
  });

  it("karıştırılabilir karakterler alfabede YOK (I, O, 0, 1)", () => {
    expect(SAFE_CHARS).not.toMatch(/[IO01]/);
    expect(SAFE_CHARS).toBe("ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
  });
});

describe("M11 · redeem — kendini davet ve çift sayım kapalı", () => {
  it("self-invite reddi + bilinmeyen kod + row_count ile already ayrımı", () => {
    const redeem = fn("redeem_invite_code(p_code text)", "redeem_invite_code(text)");

    // ⚠️ M3 mutasyon dersi (5. tekrar): raise metnini kilitlemek yetmez —
    // `if false then` içine gömülen raise de aynı metni taşır. KOŞUL kilitlenir.
    expect(redeem).toContain("if v_owner = v_uid then");
    expect(redeem).toContain("raise exception 'invite_self_not_allowed'");
    expect(redeem).toContain("raise exception 'invite_code_not_found'");
    expect(redeem).toContain("on conflict (invited_user_id) do nothing");
    expect(redeem).toContain("get diagnostics v_rows = row_count");
    expect(redeem.indexOf("if v_owner = v_uid then")).toBeLessThan(
      redeem.indexOf("invite_self_not_allowed"),
    );
  });
});

describe("M11 · liderlik — sızıntı üçlüsü SQL'de (AI korpus dersi)", () => {
  const board = () => fn("get_invite_leaderboard(p_limit integer default null)", "get_invite_leaderboard(integer)");

  it("üç filtre de gövdede", () => {
    const sql = board();

    expect(sql).toContain("rl.is_directory_visible = true");
    expect(sql).toContain("ci.is_placeholder = false");
    expect(sql).toContain("ci.title not like '[PLACEHOLDER]%'");
    expect(sql).toContain("not coalesce(public.is_admin(c.owner_user_id), false)");
  });

  it("anon AÇIK ve gövdede auth kontrolü YOK (M12 doğrulamasının kilidi)", () => {
    expect(flat()).toContain(
      "grant execute on function public.get_invite_leaderboard(integer) to anon, authenticated;",
    );
    expect(board()).not.toContain("auth.uid()");
  });

  it("eşikler + limit invite_settings'ten (kodda sabit yok)", () => {
    const sql = board();

    expect(sql).toContain("invite_setting_json('invites.badge_tiers'");
    expect(sql).toContain("invite_setting_json('invites.leaderboard_limit'");
    expect(flat()).toContain("('invites.badge_tiers', '[3, 10, 25]'::jsonb)");
  });

  it("yazma RPC'leri anon'a kapalı", () => {
    const sql = flat();

    expect(sql).toContain("grant execute on function public.get_or_create_my_invite_code() to authenticated;");
    expect(sql).toContain("grant execute on function public.redeem_invite_code(text) to authenticated;");
    expect(sql).not.toContain("get_or_create_my_invite_code() to anon");
    expect(sql).not.toContain("redeem_invite_code(text) to anon");
  });
});
