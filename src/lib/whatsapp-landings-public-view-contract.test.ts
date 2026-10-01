// G03a sözleşmesi — dizinin PII'siz okuma yüzeyi ve davet linkinin tek kapısı.
//
// Canlıda ölçüldü 2026-10-01: `Anyone can view approved landings` politikası anon'a
// `status='approved'` satırının TÜM kolonlarını döndürüyordu. Sızan iki alan:
//   • `whatsapp_link`  — 10/10 satır (K1, biliniyordu)
//   • `admin_contact`  — 10/10 satır, biçimi `Ad Soyad e-posta@... +90xxxxxxxxxx`
//                        yani grup adminlerinin adı + e-postası + telefonu.
//                        **Bu K1'de YAZILI DEĞİLDİ.**
//
// ⚠️ RLS SATIR düzeyinde çalışır, KOLON düzeyinde değil — "satırı göster, kolonu
// gizle" politikası yazılamaz. Kolon grant'ını çekmek de çözüm değil: istemcinin
// iki anon yolu da `select("*")` kullanıyor, çekilirse ikisi de 42501 ile düşer ve
// kullanıcıya "izin yok" diye DEĞİL "dizin boş" diye görünür. Çözüm: PII'siz view
// + linki veren ayrı RPC.
//
// Bu test migration METNİNİ denetler (desen: `redirects.test.ts`). Çalışan
// veritabanını kanıtlamaz — canlı kanıt batch'in KALANLAR kaydındadır.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "supabase/migrations/applied/20261001110000_whatsapp_landings_public_view_and_invite_rpc.sql";
const sql = readFileSync(resolve(__dirname, "../..", MIGRATION), "utf8");

/** Gizlenmesi ZORUNLU kolonlar — view'da `null::<tip>` olarak durmalılar. */
const MASKELI_KOLONLAR = ["whatsapp_link", "admin_contact", "user_id", "rejection_reason"] as const;

describe("G03a · whatsapp_landings_public view", () => {
  const viewBody = sliceBetween(
    sql,
    "create or replace view public.whatsapp_landings_public",
    "comment on view",
    "view gövdesi",
  );

  it.each(MASKELI_KOLONLAR)("%s kolonunu NULL olarak döner, tabandan OKUMAZ", (kolon) => {
    // `null::<tip> as <kolon>` olmalı; `l.<kolon>` biçiminde taban okuması OLMAMALI.
    expect(viewBody).toMatch(new RegExp(`null::\\w+\\s+as\\s+${kolon}\\b`));
    expect(viewBody).not.toMatch(new RegExp(`\\bl\\.${kolon}\\b`));
  });

  it("status='approved' filtresi view'ın İÇİNDEDİR", () => {
    // security_invoker=false olduğu için taban RLS'i uygulanmaz; filtre buradan
    // kalkarsa `pending` ve `rejected` gruplar anonime açılır.
    expect(viewBody).toContain("where l.status = 'approved'");
  });

  it("security_invoker=false ve security_barrier=true AÇIKÇA yazılıdır", () => {
    expect(viewBody).toContain("security_invoker = false");
    expect(viewBody).toContain("security_barrier = true");
  });

  it("view yalnız anon + authenticated'a SELECT verir", () => {
    expect(sql).toContain("grant select on public.whatsapp_landings_public to anon, authenticated");
    expect(sql).not.toMatch(/grant\s+(all|insert|update|delete)[\s\S]{0,60}whatsapp_landings_public/i);
  });
});

describe("G03a · get_whatsapp_landing_invite RPC", () => {
  const fnBody = sliceBetween(
    sql,
    "create or replace function public.get_whatsapp_landing_invite",
    "comment on function",
    "RPC gövdesi",
  );

  it("giriş yoksa 42501 fırlatır", () => {
    expect(fnBody).toContain("auth.uid() is null");
    expect(fnBody).toContain("errcode = '42501'");
  });

  it("yalnız yayındaki grubun linkini döner", () => {
    expect(fnBody).toContain("l.status = 'approved'");
  });

  it("BOŞ linki geçerli sanmaz — nullif(trim(...)) zorunlu", () => {
    // Canlıda 10 grubun 2'sinin linki boş string. Ham kolon dönerse istemci
    // tıklanamayan bir "Katıl" düğmesi çizer ve hata hiçbir yerde görünmez.
    expect(fnBody).toContain("nullif(trim(l.whatsapp_link), '')");
  });

  it("search_path sabitlenmiş security definer'dır", () => {
    expect(fnBody).toContain("security definer");
    expect(fnBody).toContain("set search_path = public, pg_temp");
  });

  it("anon ve public'ten EXECUTE geri alınır, yalnız authenticated alır", () => {
    expect(sql).toContain(
      "revoke all on function public.get_whatsapp_landing_invite(text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.get_whatsapp_landing_invite(text) to authenticated",
    );
  });
});

describe("G03a · kapsam sınırı", () => {
  it("eski politikayı DÜŞÜRMEZ — bu batch salt eklemedir (G03c'nin işi)", () => {
    // G03a geriye dönük uyumludur: istemci henüz view'a göç etmediği için
    // taban politikası kaldırılırsa dizin anında boşalır.
    expect(sql).not.toMatch(/drop\s+policy/i);
    expect(sql).not.toMatch(/revoke[\s\S]{0,80}on\s+public\.whatsapp_landings\b(?!_public)/i);
  });

  it("günlük sınırı koda sabit yazmaz (G09'da group_settings'ten gelecek)", () => {
    const fnBody = sliceBetween(
      sql,
      "create or replace function public.get_whatsapp_landing_invite",
      "comment on function",
      "RPC gövdesi",
    );
    expect(fnBody).not.toMatch(/\b(limit|max|rate)\w*\s*(:=|=)\s*\d+/i);
  });
});
