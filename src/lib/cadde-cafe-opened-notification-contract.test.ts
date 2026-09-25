// Sözleşme: yeni Cafe açılınca `cadde.cafe.opened` uygulama içi bildirimi (mig 20260925110000).
// Kilitlenenler: (1) create_cadde_cafe_v1 gövdesi önceki tanımla BİREBİR aynı, yalnız işaretli
// blok eklendi; (2) alıcılar tek set-based INSERT...SELECT ile, açan hariç, cadde.access
// kapısıyla (ban kill-switch dahil) seçilir; (3) e-posta tetiklenmez; (4) frontend eşlemesi.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { CADDE_CAFE_OPENED_NOTIFICATION_TYPE } from "@/lib/cadde-notifications-api";

const NEW_MIGRATION = "supabase/migrations/applied/20260925110000_cadde_cafe_opened_bildirim.sql";
const PREVIOUS_MIGRATION = "supabase/migrations/applied/20260730150000_cadde_v1_005_cafe_themes_brands.sql";
const BLOCK_START = "  -- >>> cadde.cafe.opened";
const BLOCK_END = "  -- <<< cadde.cafe.opened\n\n";

const read = (path: string): string => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const extractCafeFunction = (sql: string): string => {
  const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.create_cadde_cafe_v1(");
  const end = sql.indexOf("$function$;", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end + "$function$;".length);
};

const extractBlock = (fn: string): string => {
  const start = fn.indexOf(BLOCK_START);
  const end = fn.indexOf(BLOCK_END, start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return fn.slice(start, end + BLOCK_END.length);
};

describe("cadde.cafe.opened migration sözleşmesi", () => {
  const sql = read(NEW_MIGRATION);
  const fn = extractCafeFunction(sql);
  const block = extractBlock(fn);

  it("fonksiyonu DROP etmeden, aynı imzayla genişletir", () => {
    expect(sql).not.toMatch(/drop\s+function/i);
    expect(fn.startsWith(extractCafeFunction(read(PREVIOUS_MIGRATION)).split("\n")[0])).toBe(true);
    expect(sql).toContain(
      "grant execute on function public.create_cadde_cafe_v1(text, text, text, text, text, boolean, text, text, text, timestamptz, timestamptz, integer, jsonb, text) to authenticated;",
    );
  });

  it("eklenen blok dışında gövde önceki tanımla BİREBİR aynıdır", () => {
    const withoutBlock = fn.replace(block, "");
    expect(withoutBlock).toBe(extractCafeFunction(read(PREVIOUS_MIGRATION)));
  });

  it("bildirim bloğu cafe insert'ünden sonra, return'den hemen önce çalışır", () => {
    expect(fn.indexOf(block)).toBeGreaterThan(fn.indexOf("returning id into v_cafe_id;"));
    expect(fn.indexOf(block) + block.length).toBe(fn.indexOf("  return v_cafe_id;"));
  });

  it("tek set-based INSERT...SELECT kullanır; döngü ve satır başına cadde_notify yok", () => {
    const code = block
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    expect(code).toMatch(/insert into public\.notifications \([^)]*\)\s*select/);
    expect(code.match(/insert into/g)).toHaveLength(1);
    expect(code).not.toMatch(/\bloop\b/i);
    expect(code).not.toContain("cadde_notify");
  });

  it("açan hariç, cadde.access erişimi olan (ban kill-switch dahil) kullanıcıları seçer", () => {
    expect(block).toContain("ura.user_id <> v_uid");
    expect(block).toContain("public.has_cadde_feature(ura.user_id, 'cadde.access')");
    expect(block).toContain("u.deleted_at is null");
  });

  it("tip, entity ve payload frontend eşlemesiyle uyumludur", () => {
    expect(block).toContain(`'${CADDE_CAFE_OPENED_NOTIFICATION_TYPE}'`);
    expect(block).toContain("'Yeni Cafe açıldı'");
    expect(block).toMatch(/v_cafe_id,\s*'cafe',/);
    expect(block).toContain("'diasporaKey', v_diaspora");
  });

  it("yalnız uygulama içi bildirim üretir — e-posta/edge function tetiklemez", () => {
    expect(block).not.toMatch(/net\.http|http_post|send-notification-emails|email/i);
  });
});

describe("NotificationsBell Cafe simgesi", () => {
  it("Cafe bildirimleri için mevcut CaddeCafeIcon'u kullanır", () => {
    const bell = read("src/components/cadde/NotificationsBell.tsx");
    expect(bell).toContain('import CaddeCafeIcon from "@/components/cadde/CaddeCafeIcon";');
    expect(bell).toContain("notificationUsesCafeIcon(notification)");
  });
});
