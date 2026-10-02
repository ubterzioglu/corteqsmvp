/**
 * G18 sözleşmesi — `submit_group_v1` migration + `group-preview` edge +
 * `_shared/group-invite-read` görsel desteği.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Kabul #1 (dedup) kopması.** `invite_code` G10'un `group_invite_code`
 *      fonksiyonundan TÜRETİLMEZSE (ör. TS'te ikinci bir regex yazılırsa)
 *      backfill ile yeni gönderimler farklı anahtar üretir ve aynı grup iki
 *      kez listelenir — kimse fark etmez.
 *   2. **Kabul #2/#4 (hızlı şerit) matrisinin kayması.** Dört koşulun
 *      (admin + verified + şerit açık + işaretsiz) biri düşerse ya spam anında
 *      yayına çıkar ya da admin grubu hiç yayınlanamaz.
 *   3. **Kara listenin reddetmeye dönüşmesi.** Tasarım §8: ön tarama YALNIZ
 *      işaret koyar. `raise`'e çevrilirse meşru gruplar ("kredi kartı" geçen
 *      açıklama) sessizce reddedilir.
 *   4. **Eşiklerin koda sabitlenmesi** (G09 doktrini): günlük sınır / hızlı
 *      şerit / kara liste `group_settings`'ten okunmalı.
 *   5. **G06'dan önce Aile & Çocuk kilidinin açılması** (kabul #10) —
 *      sunucu kilidi burada kilitli; G06 bilinçli güncelleyecek.
 *   6. **G08 kural 8:** davet linki edge yanıtına/log'una yazılamaz.
 *   7. **Legacy paralellik:** canlı eski paket `country/city/description
 *      etiketleri/status` okuyor — RPC bunları doldurmazsa yeni gruplar
 *      canlıda bozuk görünür (deploy'a kadar iki sistem paralel).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002080000_group_submit.sql";
const EDGE = "supabase/functions/group-preview/index.ts";
const INVITE_READ = "supabase/functions/_shared/group-invite-read.ts";
const SRC_CLIENT = "src/lib/group-submit.ts";

const migrationSql = () => {
  const candidates = [`supabase/migrations/applied/${MIGRATION}`, `supabase/migrations/${MIGRATION}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${MIGRATION} bulunamadı (applied/ altında yaşamalı).`);
  return readFileSync(path, "utf8");
};

/** Yorumlar atılır: başlık, YASAKLADIĞI şeyleri anlatıyor (sahte eşleşmesin). */
const code = () =>
  migrationSql()
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

const flat = () => code().replace(/\s+/g, " ");

const rpc = () =>
  sliceBetween(
    code(),
    "create or replace function public.submit_group_v1",
    "comment on function public.submit_group_v1",
    "submit_group_v1",
  );

const edge = () => readFileSync(EDGE, "utf8");

describe("G18 · salt ekleme güvencesi", () => {
  it("hiçbir kolon/tablo DÜŞÜRÜLMEZ; tek drop category CHECK genişletmesi", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    // Drop edilen TEK şey kategori kısıtı ve hemen 17 değerle geri konur.
    const drops = sql.match(/drop\s+constraint/gi) ?? [];
    expect(drops).toHaveLength(1);
    expect(sql).toContain("drop constraint if exists whatsapp_landings_category_check");
  });

  it("kategori CHECK'i eski 10 değeri KORUR + yeni 7'yi ekler", () => {
    const constraint = sliceBetween(
      code(),
      "add constraint whatsapp_landings_category_check",
      ");",
      "category check",
    );

    for (const legacy of [
      "alumni", "hobi", "is", "doktor", "yatirim", "akademik", "dayanisma",
      "hr", "kisisel-gelisim", "diger",
    ]) {
      expect(constraint, `eski anahtar korunmalı: ${legacy}`).toContain(`'${legacy}'`);
    }
    for (const motor of [
      "sehir-yasam", "meslek-kariyer", "is-girisim", "alumni-akademik",
      "dayanisma-yardim", "aile-cocuk", "hobi-kultur",
    ]) {
      expect(constraint, `yeni anahtar eklenmeli: ${motor}`).toContain(`'${motor}'`);
    }
  });
});

describe("G18 · kabul #1 — dedup invite_code ile (G10 tek kaynak)", () => {
  it("kod G10'un group_invite_code'undan türetilir, ikinci regex YAZILMAZ", () => {
    const fn = rpc();

    expect(fn).toContain("public.group_invite_code(v_link)");
    // submit RPC'si kendi extraction regex'ini UYDURAMAZ (backfill'den ayrışır)
    expect(fn).not.toContain("A-Za-z0-9_-");
  });

  it("aynı kod zaten listedeyse INSERT YAPILMADAN already_listed döner", () => {
    const fn = rpc();
    const dedupBlock = sliceBetween(fn, "where invite_code = v_invite", "raise exception 'group_submission_banned'", "dedup→ban");

    expect(dedupBlock).toContain("'already_listed'");
    expect(dedupBlock).toContain("return jsonb_build_object");
    // early-return INSERT'ten ÖNCE olmalı
    expect(fn.indexOf("'already_listed'")).toBeLessThan(fn.indexOf("insert into public.whatsapp_landings"));
  });

  it("edge de dedup'u SQL'den yapar (TS regex'i yok) — kural 8: link dönmez", () => {
    const src = edge();

    expect(src).toContain('service.rpc("group_invite_code"');
    expect(src).not.toContain("A-Za-z0-9_-");
    // Log satırı BİREBİR: platform + sonuç, link/kullanıcı girdisi YOK.
    expect(src).toContain('console.info("group-preview", { platform, read_result: read.result, exists: false });');
    // Kural 8'in gerçek kilidi: dedup sorgusu `whatsapp_link` kolonunu HİÇ
    // SEÇMEZ — yanıt sızdıramaz çünkü veri hiç okunmaz.
    expect(src).toContain('.select("slug, group_name, ownership, listing_status")');
    expect(src).not.toContain("whatsapp_link");
  });
});

describe("G18 · platform üç yerde birebir şema-çıpalı", () => {
  it("migration, edge ve src aynı çapalı deseni kullanır", () => {
    // Migration (SQL literal)
    expect(rpc()).toContain("'^https?://chat\\.whatsapp\\.com/'");
    expect(rpc()).toContain("'^https?://(t\\.me|telegram\\.me)/'");
    expect(rpc()).toContain("'^https?://(discord\\.gg|discord\\.com/invite)/'");
    // Edge (JS regex)
    expect(edge()).toContain("/^https?:\\/\\/chat\\.whatsapp\\.com\\//i");
    expect(edge()).toContain("/^https?:\\/\\/(t\\.me|telegram\\.me)\\//i");
    expect(edge()).toContain("/^https?:\\/\\/(discord\\.gg|discord\\.com\\/invite)\\//i");
    // Src istemci (aynı JS regex)
    const client = readFileSync(SRC_CLIENT, "utf8");
    expect(client).toContain("/^https?:\\/\\/chat\\.whatsapp\\.com\\//i");
    expect(client).toContain("/^https?:\\/\\/(t\\.me|telegram\\.me)\\//i");
    expect(client).toContain("/^https?:\\/\\/(discord\\.gg|discord\\.com\\/invite)\\//i");
  });

  it("desteklenmeyen link reddedilir (tasarım §3.A adım 2)", () => {
    expect(rpc()).toContain("group_submit_link_unsupported");
  });
});

describe("G18 · kabul #2/#3 — hızlı şerit matrisi", () => {
  it("publish kararı DÖRT koşulun HEPSİNE bağlı", () => {
    expect(rpc()).toContain(
      "v_publish := v_fast and v_is_admin and p_claims_admin and cardinality(v_flags) = 0;",
    );
  });

  it("şerit bayrağı group_settings'ten (kodda sabit yok)", () => {
    expect(rpc()).toContain("group_setting_bool('groups.fast_lane_enabled'");
  });

  it("varsayılan durum pending_review; publish yalnız v_publish ile", () => {
    expect(rpc()).toContain(
      "v_listing := case when v_publish then 'published' else 'pending_review' end",
    );
  });

  it("hızlı şerit yayını moderasyon loguna yazılır (kabul #12 zinciri)", () => {
    const fn = rpc();

    expect(fn).toContain("insert into public.group_moderation_log");
    expect(fn).toContain("'fast_lane'");
  });

  it("admin olmayan claims_admin → claim_pending (tasarım §3.A adım 5)", () => {
    expect(rpc()).toContain("else 'claim_pending'");
  });
});

describe("G18 · kabul #4 — kara liste YALNIZ işaretler, reddetmez", () => {
  it("liste group_settings'ten; eşleşme review_flags'e yazılır", () => {
    const fn = rpc();

    expect(fn).toContain("group_setting_json('groups.blocklist_keywords'");
    expect(fn).toContain("v_flags := v_flags || v_kw");
    expect(fn).toContain("v_flags,");
  });

  it("kara liste eşleşmesi RAISE üretmez (tasarım §8: otomatik reddetmez)", () => {
    // Dilim: tarama bloğundan konum doğrulamasına (yorumlar code()'da atılır —
    // çıpa kod literalidir).
    const block = sliceBetween(
      rpc(),
      "group_setting_json('groups.blocklist_keywords'",
      "select id, code, name into v_country",
      "blocklist taraması",
    );

    expect(block).not.toContain("raise exception");
  });
});

describe("G18 · kabul #10 (bugünkü hâl) — aile-cocuk sunucuda kilitli", () => {
  it("G06/K09 gelene dek RPC reddeder; kilit kategoriden ÖNCE bakar", () => {
    const fn = rpc();

    expect(fn).toContain("if p_category = 'aile-cocuk' then");
    expect(fn).toContain("group_submit_category_locked");
    expect(fn.indexOf("group_submit_category_locked")).toBeLessThan(
      fn.indexOf("group_submit_invalid_category"),
    );
  });
});

describe("G18 · kapılar ve eşikler", () => {
  it("Grup Sözü, ad, açıklama, 160 sınırı, admin sorusu zorunlu", () => {
    const fn = rpc();

    expect(fn).toContain("group_submit_pledge_required");
    expect(fn).toContain("p_pledge_accepted is distinct from true");
    expect(fn).toContain("group_submit_name_required");
    expect(fn).toContain("group_submit_description_required");
    expect(fn).toContain("char_length(v_desc) > 160");
    expect(fn).toContain("group_submit_admin_answer_required");
  });

  it("günlük sınır group_settings'ten (politika §2: günde 5)", () => {
    expect(rpc()).toContain("group_setting_int('groups.daily_submit_limit'");
    expect(rpc()).toContain("group_submit_rate_limited");
  });

  it("yasaklı gönderici erken reddedilir (G15 yardımcısı) + trigger yedek", () => {
    expect(rpc()).toContain("public.group_submission_banned(v_uid)");
  });

  it("konum geo_* kataloğundan doğrulanır (serbest metin YOK)", () => {
    const fn = rpc();

    expect(fn).toContain("from public.geo_countries");
    expect(fn).toContain("group_submit_country_not_found");
    expect(fn).toContain("country_id = v_country.id");
    expect(fn).toContain("group_submit_city_not_found");
    expect(fn).not.toContain("cadde_");
  });

  it("grant yalnız authenticated — anon çağıramaz", () => {
    expect(flat()).toContain(
      "grant execute on function public.submit_group_v1(text, text, text, text, text, uuid, boolean, boolean, boolean, text) to authenticated;",
    );
    expect(flat()).toContain(
      "revoke all on function public.submit_group_v1(text, text, text, text, text, uuid, boolean, boolean, boolean, text) from public, anon;",
    );
  });
});

describe("G18 · legacy paralellik (canlı eski paket deploy'a dek okuyor)", () => {
  it("country/city metin kolonları geo'dan; Global → 'Genel'", () => {
    const fn = rpc();

    expect(fn).toContain("v_city_name := 'Genel'");
    expect(fn).toContain("v_country_name := v_country.name");
  });

  it("description etiketleri yazılır ([Platform:] + [Badge admin:])+ status eşlenir", () => {
    const fn = rpc();

    expect(fn).toContain("[Platform: '");
    expect(fn).toContain("[Badge admin: '");
    expect(fn).toContain("case when v_publish then 'approved' else 'pending' end");
    expect(fn).toContain("case when v_publish then now() else null end");
  });

  it("platform + invite_code + submitted_by + submitted_as_admin kolonları doldurulur", () => {
    const fn = rpc();

    expect(fn).toContain("v_platform, v_invite, v_listing, v_ownership,");
    expect(fn).toContain("v_uid, p_claims_admin, v_flags,");
  });
});

describe("G18 · group-preview edge — yetki ve sınır", () => {
  it("çağıran getUser ile doğrulanır (verify_jwt tek başına yetki değil)", () => {
    const src = edge();

    expect(src).toContain("authClient.auth.getUser(token)");
    expect(src).toContain('return jsonResponse({ error: "Giris gerekli." }, 401, corsHeaders);');
  });

  it("IP hız sınırı + origin allowlist + body limiti (mevcut _shared yardımcıları)", () => {
    const src = edge();

    expect(src).toContain('enforceRateLimit(service, req, "group-preview"');
    expect(src).toContain("isAssistantOriginAllowed(req.headers.get(\"Origin\"))");
    expect(src).toContain("readJsonWithLimit(req, MAX_BODY_BYTES)");
  });

  it("exists=true dalında DIŞ İSTEK ATILMAZ (dedup early-return)", () => {
    const src = edge();

    expect(src.indexOf("if (existing) {")).toBeLessThan(src.indexOf("readInvitePage(url, platform)"));
  });
});

describe("G18 · _shared/group-invite-read — görsel ön doldurma (tasarım §3.A adım 4)", () => {
  it("InviteRead.image alanı + og:image + Discord CDN okuması eklendi", () => {
    const src = readFileSync(INVITE_READ, "utf8");

    expect(src).toContain("image: string | null");
    expect(src).toContain('parseOgMeta(html, "og:image")');
    expect(src).toContain("https://cdn.discordapp.com/icons/");
  });

  it("mevcut geçerlilik semantiği DEĞİŞMEDİ (G08/G13 kilitleri yerinde)", () => {
    const src = readFileSync(INVITE_READ, "utf8");

    expect(src).toContain('name.trim() === ""');
    expect(src).toContain("TELEGRAM_GENERIC_TITLE");
    expect(src).toContain('result: "invalid", name: null, description: null, image: null');
  });
});
