/**
 * G19 sözleşmesi — dizin view'ı v2 (`whatsapp_landings_public`) + is_new.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **PII masking'inin view recreate sırasında kaybolması.** G03a'nın
 *      kapattığı sızıntı (whatsapp_link · admin_contact · user_id ·
 *      rejection_reason) view her yeniden yaratıldığında geri gelebilir —
 *      dört `null::` maskesi burada kilitli.
 *   2. **Motor durumunun dizine sızmaması/sızmaması gerektiği hâlde sızmaması.**
 *      G12 `set_group_status_v1` legacy `status`'ü DEĞİŞTİRMİYOR: tek filtre
 *      `status='approved'` olsaydı, moderatörün `hidden/suspended/removed`
 *      yaptığı grup dizinde GÖRÜNMEYE DEVAM EDERDİ (canlı ölçümle kapatılan
 *      sessiz kusur sınıfı). Çift filtre kilitli.
 *   3. **"Yeni" eşiğinin koda sabitlenmesi** (G09 doktrini): 72 saat
 *      `groups.new_badge_hours`'tan okunmalı; SECURITY DEFINER sarmalı
 *      `group_setting_int`'i anon'a AÇMADAN kullanmalı (G09 grant matrisi).
 *   4. **İç moderasyon kolonlarının view'a sızması** (owner_user_id,
 *      invite_code, review_flags, strike_count…).
 *   5. **İstemcinin view kolonlarını okumaması / sıralamanın skorsuz olması**
 *      (politika §7: "Skor sıralamayı belirler").
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002090000_public_view_motor_badges.sql";

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

const view = () =>
  sliceBetween(code(), "create view public.whatsapp_landings_public", "grant select on public.whatsapp_landings_public", "view v2");

const isNewFn = () =>
  sliceBetween(
    code(),
    "create or replace function public.group_listing_is_new",
    "comment on function public.group_listing_is_new",
    "group_listing_is_new",
  );

describe("G19 · salt ekleme + G03a masking korunur", () => {
  it("kolon/tablo DÜŞÜRÜLMEZ; tek drop VIEW ve aynı işlemde geri yaratılır", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    const viewDrops = sql.match(/drop\s+view/gi) ?? [];
    expect(viewDrops).toHaveLength(1);
    expect(sql).toContain("create view public.whatsapp_landings_public");
  });

  it("dört PII maskesi AYNEN duruyor (G03a kilidi)", () => {
    const v = view();

    expect(v).toContain("null::uuid   as user_id");
    expect(v).toContain("null::text   as whatsapp_link");
    expect(v).toContain("null::text   as admin_contact");
    expect(v).toContain("null::text   as rejection_reason");
  });

  it("iç moderasyon/PII kolonları view'da YOK", () => {
    const v = view();

    for (const forbidden of [
      "l.owner_user_id",
      "l.submitted_by",
      "l.submitted_as_admin",
      "l.invite_code",
      "l.review_flags",
      "l.strike_count",
      "l.hidden_reason",
      "l.group_score_breakdown",
      "l.rules",
    ]) {
      expect(v, `view'a sızmamalı: ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("security_invoker=false + security_barrier=true korunur", () => {
    expect(code()).toContain("with (security_invoker = false, security_barrier = true)");
  });
});

describe("G19 · çift filtre — motor kararı dizine yansır", () => {
  it("legacy status + motor listing_status birlikte süzer", () => {
    const v = view();

    expect(v).toContain("where l.status = 'approved'");
    expect(v).toContain("and l.listing_status in ('published', 'pending_review')");
  });

  it("migration kendi doğrulamasını taşır (PII + motor sızmaz)", () => {
    const sql = code();

    expect(sql).toContain("raise exception 'G19: view hala PII donduruyor");
    expect(sql).toContain("raise exception 'G19: view motor durumu sizdiriyor");
  });
});

describe("G19 · motor kolonları view'da", () => {
  it("rozet/sıralama/Yeni kolonları SONA eklenir (eski sıra bozulmaz)", () => {
    const v = view();

    for (const col of [
      "l.platform,",
      "l.short_description,",
      "l.listing_status,",
      "l.ownership,",
      "l.published_at,",
      "l.has_approved_badge,",
      "public.group_listing_is_new(l.published_at, l.created_at) as is_new",
    ]) {
      expect(v, `view kolonu: ${col}`).toContain(col);
    }
    // Eski ilk kolon yerinde (rowToLanding/select("*") sözleşmesi kaymasın)
    expect(v.indexOf("l.id,")).toBeLessThan(v.indexOf("l.platform,"));
    expect(v.indexOf("l.origin,")).toBeLessThan(v.indexOf("l.platform,"));
  });
});

describe("G19 · is_new — eşik group_settings'ten (G09 doktrini)", () => {
  it("new_badge_hours seed edilir (politika §6: ilk 72 saat)", () => {
    expect(flat()).toContain("('groups.new_badge_hours', '72'::jsonb)");
  });

  it("fonksiyon eşiği AYARLARDAN okur — 72 FONKSİYONDA SABİT DEĞİL", () => {
    const fn = isNewFn();

    expect(fn).toContain("group_setting_int('groups.new_badge_hours'");
    expect(fn).not.toMatch(/make_interval\(hours\s*=>\s*72\s*\)/);
  });

  it("coalesce(published_at, created_at) — eski paket onay yolu da 'Yeni' alır", () => {
    expect(isNewFn()).toContain("coalesce(p_published_at, p_created_at)");
  });

  it("SECURITY DEFINER + anon grant: group_setting_int anon'a AÇILMAZ", () => {
    const sql = flat();

    expect(sql).toContain("security definer");
    expect(sql).toContain(
      "grant execute on function public.group_listing_is_new(timestamptz, timestamptz) to anon, authenticated;",
    );
    // G09 grant matrisi değişmedi: json hâlâ private, int hâlâ yalnız authenticated
    expect(sql).not.toContain("grant execute on function public.group_setting_int");
    expect(sql).not.toContain("group_setting_json");
  });

  it("view select grant'ı korunur", () => {
    expect(flat()).toContain(
      "grant select on public.whatsapp_landings_public to anon, authenticated;",
    );
  });
});

describe("G19 · istemci view'ı gerçekten okuyor", () => {
  const landings = () => readFileSync("src/lib/whatsapp-landings.ts", "utf8");

  it("rowToLanding motor alanlarını eşler (badge/yeni/sahiplik)", () => {
    const src = landings();

    expect(src).toContain("hasApprovedBadge: row.has_approved_badge ?? false");
    expect(src).toContain("isNew: row.is_new ?? false");
    expect(src).toContain("ownership: (row.ownership as WhatsAppLanding[\"ownership\"]) ?? undefined");
    expect(src).toContain("listingStatus: row.listing_status ?? undefined");
    expect(src).toContain("publishedAt: row.published_at ?? undefined");
  });

  it("dizin sıralaması skora bağlı (politika §7) — skorsuzlar SONA", () => {
    const list = sliceBetween(landings(), "export async function listLandings", "export async function submitLanding", "listLandings");

    expect(list).toContain('.order("group_score", { ascending: false, nullsFirst: false })');
    expect(list).toContain('.order("created_at", { ascending: false })');
    // Skor sırası created_at'ten ÖNCE uygulanır (birincil anahtar)
    expect(list.indexOf(".order(\"group_score\"")).toBeLessThan(list.indexOf(".order(\"created_at\""));
  });

  it("public kaynak sözleşmesi bozulmadı (G03b: view, tablo değil)", () => {
    const src = landings();

    expect(src).toContain('const PUBLIC_LANDINGS_SOURCE = "whatsapp_landings_public" as const');
    // Okuma yolları (dizin + detay) view'dan gider. Yazma/admin yolları taban
    // tabloyu kullanmaya DEVAM eder (submitLanding/updateLanding — canlı eski
    // paket paralelliği, G10c'ye dek); o yüzden dosya-geneli `from("whatsapp_landings")`
    // taraması YAPILMAZ — getLanding/listLandings kilidi public-source testinde.
    const readPaths = sliceBetween(src, "export async function getLanding", "export async function getEditableLandingForCurrentUser", "okuma yolları");
    expect(readPaths).toContain("PUBLIC_LANDINGS_SOURCE");
  });
});
