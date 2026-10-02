/**
 * G15 sözleşmesi — uyarı (strike) sistemi + ekleme yasağı.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Merdivenin atlanması.** 1.=uyarı · 2.=askı · 3.=removed+yasak (tasarım §7)
 *      ve kırmızı çizgi 2/4/6 doğrudan removed (politika §4). Eşiklerin koda
 *      sabitlenmesi veya terminal listenin değişmesi ürün kararını sessizce bozar.
 *   2. **Durum geçişinin G12 tek kapısını atlaması.** Strike RPC'si listing_status'e
 *      DOĞRUDAN yazamaz — geçiş `set_group_status_v1` üzerinden olmalı, yoksa
 *      moderasyon logu (kabul #12) boş kalır.
 *   3. **Yasağın enforcement'sız kalması.** `trg_block_banned_submitter` düşerse
 *      3. ihlalden kaldırılan kullanıcı yarın yeni grup ekler.
 *   4. **strike_count'un guard'ı atlaması.** Motor alanı bayraksız yazılamaz;
 *      bayrak unutulursa guard kendi RPC'mizi düşürür (sessiz değil ama kırılgan).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002050000_group_strikes.sql";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, yasakladığı şeyleri ANLATIYOR. */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

describe("G15 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
  });
});

describe("G15 · group_strikes (tasarım §4: sebep · karar veren · tarih)", () => {
  const table = () =>
    sliceBetween(code(), "create table if not exists public.group_strikes", ");", "strikes tablosu");

  it("kayıt alanları tam", () => {
    for (const column of [
      "landing_id",
      "strike_no",
      "reason",
      "redline_number",
      "outcome",
      "decided_by",
      "note",
      "created_at",
    ]) {
      expect(table(), column).toContain(column);
    }
  });

  it("outcome üç sonuç: warning · suspended · removed", () => {
    expect(table()).toContain("'warning', 'suspended', 'removed'");
  });

  it("kırmızı çizgi numarası politika §4 listesiyle sınırlı (1..7)", () => {
    expect(table()).toContain("redline_number between 1 and 7");
  });

  it("istemciye kapalı, admin okur", () => {
    const sql = code();

    expect(sql).toContain("alter table public.group_strikes enable row level security");
    expect(sql).toContain("revoke all on table public.group_strikes from anon, authenticated");
  });
});

describe("G15 · ekleme yasağı", () => {
  it("ban sebepleri tasarım §7 + politika §4 ile sınırlı", () => {
    const table = sliceBetween(
      code(),
      "create table if not exists public.group_submission_bans",
      ");",
      "bans tablosu",
    );

    expect(table).toContain("'strike_3', 'redline_2', 'redline_4', 'redline_6'");
    expect(table).toContain("unique (user_id, landing_id, reason)");
  });

  it("INSERT trigger'ı yasaklıyı engeller, admin muaftır", () => {
    const trigger = sliceBetween(
      code(),
      "create or replace function public.whatsapp_landings_block_banned_submitter",
      "comment on function public.whatsapp_landings_block_banned_submitter",
      "ban trigger",
    );

    expect(trigger).toContain("group_submission_banned");
    expect(trigger).toContain("public.is_admin(v_user)");
    expect(code()).toContain("before insert on public.whatsapp_landings");
  });

  it("yardımcı fonksiyon authenticated'a açık (G18 formu okuyacak)", () => {
    expect(flat()).toContain(
      "grant execute on function public.group_submission_banned(uuid) to authenticated;",
    );
  });
});

describe("G15 · eşikler group_settings'ten (kodda sabit YOK)", () => {
  it("üç anahtar seed edilir", () => {
    const sql = flat();

    expect(sql).toContain("('groups.strike_suspend_threshold', '2'::jsonb)");
    expect(sql).toContain("('groups.strike_remove_threshold', '3'::jsonb)");
    expect(sql).toContain("('groups.terminal_redlines', '[2, 4, 6]'::jsonb)");
  });

  it("RPC eşikleri ve terminal listeyi ayarlardan okur", () => {
    const rpc = sliceBetween(
      code(),
      "create or replace function public.admin_record_group_strike",
      "comment on function public.admin_record_group_strike",
      "strike RPC",
    );

    expect(rpc).toContain("group_setting_int('groups.strike_suspend_threshold'");
    expect(rpc).toContain("group_setting_int('groups.strike_remove_threshold'");
    expect(rpc).toContain("group_setting_json('groups.terminal_redlines'");
  });
});

describe("G15 · strike RPC tek kapı üzerinden geçiş yapar", () => {
  const rpc = () =>
    sliceBetween(
      code(),
      "create or replace function public.admin_record_group_strike",
      "comment on function public.admin_record_group_strike",
      "strike RPC",
    );

  it("moderatör kapısı: is_admin şart", () => {
    expect(rpc()).toContain("public.is_admin(v_uid)");
    expect(rpc()).toContain("group_strike_forbidden");
  });

  it("removed gruba ihlal işlenmez (terminal)", () => {
    expect(rpc()).toContain("group_already_removed");
  });

  it("durum geçişleri YALNIZ set_group_status_v1 ile", () => {
    const body = rpc();

    expect(body).toContain("public.set_group_status_v1(");
    expect(body).not.toContain("update public.whatsapp_landings set listing_status");
  });

  it("strike_count guard bayrağıyla güncellenir", () => {
    const body = rpc();

    expect(body).toContain("set_config('group_status.via_rpc', 'on', true)");
    expect(body).toContain("strike_count = v_strike_no");
  });

  it("askı yalnız published'dan (matris kararı) — değilse warning + not", () => {
    const body = rpc();

    expect(body).toContain("if v_status = 'published' then");
    expect(body).toContain("askı uygulanamadı");
  });

  it("yasak ekleyen VE sahibi kapsar (tasarım §7)", () => {
    const body = rpc();

    expect(body).toContain("(coalesce(v_submitted_by, v_owner)), (v_owner)");
    expect(body).toContain("group_submission_bans");
  });
});
