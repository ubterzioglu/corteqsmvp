/**
 * G22 sözleşmesi — 6 zamanlanmış görev (migration + `group-link-health` edge).
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **`unknown` sayacı artırır.** Tasarım §6 + G08 kural 5: üç değerli
 *      sonuçta `unknown` (ağ hatası, rate-limit, biçim değişimi) gruba MAL
 *      EDİLEMEZ — artıran kod 2 saatlik kesintide tüm dizini gizler.
 *   2. **health-score bayrağının varsayılanı açığa kayar.** G17 tuzağı: canlı
 *      eski kart "X / 10" çiziyor; bayrak `true` varsayılırsa cron ilk
 *      koşusunda kullanıcıya bozuk ölçek gösterir.
 *   3. **Yaymanın (stagger) kalkması.** 10 grup → 1000 grup olduğunda saatlik
 *      parti tümünü denerse Meta rate-limit (W04/Meta 200 dersi) tüm kontrolleri
 *      `unknown`'a çevirir.
 *   4. **Eşikte hardcoded.** link_fail_threshold/interval/grace ayarlardan
 *      okunmak zorunda (G09 doktrini).
 *   5. **Cron tanımının kayması** (job adları/programları) veya secret'ın
 *      migration'a LİTERAL girmesi.
 *   6. **Yenileme RPC'sinin sahibe sınırlanmaması** — herkes due uzatabilirse
 *      "30 gün yanıt yoksa unclaimed" yaptırımı ölür.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const MIGRATION = "20261002110000_group_scheduled_tasks.sql";
const EDGE = "supabase/functions/group-link-health/index.ts";

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

const fn = (name: string) =>
  sliceBetween(
    code(),
    `create or replace function public.${name}`,
    `comment on function public.${name}`,
    name,
  );

describe("G22 · salt ekleme + ayarlar", () => {
  it("kolon/tablo DÜŞÜRÜLMEZ, mevcut fonksiyon DEĞİŞMEZ", () => {
    const sql = code();

    expect(sql).not.toMatch(/drop\s+column/i);
    expect(sql).not.toMatch(/drop\s+table/i);
    // G16/G17 fonksiyonları yeniden TANIMLANMAZ — sarmal eklenir
    expect(sql).not.toContain("create or replace function public.group_posts_escalate_due");
    expect(sql).not.toContain("create or replace function public.group_health_scores_recompute_all");
  });

  it("7 yeni anahtar seed edilir (kaynaklılar tasarım §6/§8; ⚠️’ler ajan ihtiyatı)", () => {
    const sql = flat();

    expect(sql).toContain("('groups.link_fail_threshold', '2'::jsonb)");
    expect(sql).toContain("('groups.link_health_interval_days', '7'::jsonb)");
    expect(sql).toContain("('groups.link_health_batch_limit', '10'::jsonb)");
    expect(sql).toContain("('groups.link_health_request_delay_ms', '5000'::jsonb)");
    expect(sql).toContain("('groups.health_score_cron_enabled', 'false'::jsonb)");
    expect(sql).toContain("('groups.owner_renewal_interval_days', '365'::jsonb)");
    expect(sql).toContain("('groups.owner_renewal_grace_days', '30'::jsonb)");
  });
});

describe("G22 · link-health due — yayma + aralık + tavan ayarlardan", () => {
  it("saat yuvası mod-hash; haftalık aralık ve parti tavanı group_settings'ten", () => {
    const due = fn("group_link_health_due");

    expect(due).toContain("mod(abs(hashtext(w.slug)), 24)");
    expect(due).toContain("group_setting_int('groups.link_health_interval_days'");
    expect(due).toContain("group_setting_int('groups.link_health_batch_limit'");
  });

  it("linki boş grup TARANMAZ; link_dead gizliler geri açma için DAHİL", () => {
    const due = fn("group_link_health_due");

    expect(due).toContain("coalesce(btrim(w.whatsapp_link), '') <> ''");
    expect(due).toContain("w.listing_status = 'hidden' and w.hidden_reason = 'link_dead'");
  });

  it("due + record YALNIZ service_role", () => {
    const sql = flat();

    expect(sql).toContain(
      "grant execute on function public.group_link_health_due(integer, integer) to service_role;",
    );
    expect(sql).toContain(
      "grant execute on function public.group_link_health_record(uuid, text) to service_role;",
    );
    expect(sql).not.toContain("group_link_health_due(integer, integer) to authenticated");
    expect(sql).not.toContain("group_link_health_record(uuid, text) to authenticated");
  });
});

describe("G22 · kabul #8 — üç değerli sonuç işleme", () => {
  it("unknown sayaca DOKUNMAZ — yalnız link_checked_at tazelenir", () => {
    const record = fn("group_link_health_record");
    const unknownBranch = sliceBetween(record, "if p_result = 'unknown' then", "elsif p_result = 'ok' then", "unknown dalı");

    expect(unknownBranch).toContain("link_checked_at = now()");
    expect(unknownBranch).not.toContain("link_fail_count");
  });

  it("ok sayacı sıfırlar; invalid artırır — eşik AYARDAN (hardcoded 2 yok)", () => {
    const record = fn("group_link_health_record");

    expect(record).toContain("set link_fail_count = 0, link_checked_at = now()");
    expect(record).toContain("v_new := coalesce(v_count, 0) + 1");
    expect(record).toContain("group_setting_int('groups.link_fail_threshold'");
    expect(record).not.toMatch(/v_new\s*>=\s*2\b/);
  });

  it("geçişler TEK kapıdan: hidden(link_dead) + geri açma published — servis kimliği geçici ve GERİ YÜKLENİR", () => {
    const record = fn("group_link_health_record");

    expect(record).toContain("set_group_status_v1(p_landing_id, 'hidden', 'link_dead'");
    expect(record).toContain("set_group_status_v1(p_landing_id, 'published', 'published'");
    expect(record).toContain('v_prev_claims := current_setting(\'request.jwt.claims\', true)');
    expect(record).toContain('set_config(\'request.jwt.claims\', \'{"role":"service_role"}\', true)');
    expect(record).toContain("set_config('request.jwt.claims', coalesce(v_prev_claims, ''), true)");
    // Sayaçlar via_rpc bayrağıyla yazılır (guard v3)
    expect(record).toContain("set_config('group_status.via_rpc', 'on', true)");
  });
});

describe("G22 · health-score bayrağı (G17 tuzağı)", () => {
  it("varsayılan FALSE; kapalıyken -1, açıkken recompute_all", () => {
    const health = fn("group_health_score_cron()");

    expect(health).toContain("group_setting_bool('groups.health_score_cron_enabled', false)");
    expect(health).toContain("return -1;");
    expect(health).toContain("public.group_health_scores_recompute_all()");
    expect(health).not.toContain("group_setting_bool('groups.health_score_cron_enabled', true)");
  });
});

describe("G22 · suspension + owner-renewal + claim-expiry", () => {
  it("askı bırakma: süresi dolanlar published'a (tek kapı + servis kimliği)", () => {
    const susp = fn("group_suspensions_release_due()");

    expect(susp).toContain("listing_status = 'suspended'");
    expect(susp).toContain("suspended_until <= now()");
    expect(susp).toContain("set_group_status_v1(v_row.id, 'published', 'published'");
  });

  it("yenileme: çıpa bir kez, due aralıktan, düşürme grace'ten sonra — hepsi AYAR", () => {
    const renewals = fn("group_owner_renewals_process()");

    expect(renewals).toContain("group_setting_int('groups.owner_renewal_interval_days'");
    expect(renewals).toContain("group_setting_int('groups.owner_renewal_grace_days'");
    expect(renewals).toContain("owner_renewal_due is null");
    expect(renewals).toContain("owner_renewal_due < now() - make_interval(days => v_grace_days)");
    expect(renewals).toContain("ownership = 'unclaimed'");
    expect(renewals).toContain("set_config('group_status.via_rpc', 'on', true)");
  });

  it("renew_v1 SAHİBE SINIRLI (authenticated) — due yalnız ileri gider", () => {
    const renew = fn("group_owner_renew_v1()");

    expect(renew).toContain("ownership = 'verified' and owner_user_id = v_uid");
    expect(renew).toContain("group_owner_forbidden");
    expect(renew).toContain("now() + make_interval(days => v_interval_days)");
    expect(flat()).toContain(
      "grant execute on function public.group_owner_renew_v1() to authenticated;",
    );
  });

  it("claim-expiry yalnız bekleyen KOD taleplerini düşürür", () => {
    const expiry = fn("group_claims_expire_due()");

    expect(expiry).toContain("status = 'pending'");
    expect(expiry).toContain("method = 'code'");
    expect(expiry).toContain("code_expires_at < now()");
    expect(expiry).toContain("set status = 'expired'");
  });
});

describe("G22 · cron tanımları (6 görev, isimli, secret LİTERALİ YOK)", () => {
  const cronBlock = () => sliceBetween(code(), "do $$", "commit;", "cron bloğu");

  it("6 job da isimli schedule edilir", () => {
    const block = cronBlock();

    for (const job of [
      "'group_queue_escalation', '17 * * * *'",
      "'group_health_score', '31 4 * * *'",
      "'group_suspension_release', '37 4 * * *'",
      "'group_owner_renewal', '43 4 * * *'",
      "'group_claim_expiry', '*/10 * * * *'",
      "'group_link_health', '23 * * * *'",
    ]) {
      expect(block, `cron job: ${job}`).toContain(job);
    }
  });

  it("link-health cron'u vault'tan okur — migration secret TAŞIMAZ", () => {
    const block = cronBlock();

    expect(block).toContain("net.http_post(");
    expect(block).toContain("vault.decrypted_secrets where name = 'radar_news_cron_secret'");
    // 43 karakterlik gerçek secret değeri dosyada YOK (uzun hex/base64 dizisi taraması)
    expect(migrationSql()).not.toMatch(/['"][A-Za-z0-9+/_=-]{32,}['"]/);
  });
});

describe("G22 · group-link-health edge (radar/dispatcher deseni)", () => {
  const edge = () => readFileSync(EDGE, "utf8");

  it("secret sabit-zamanlı karşılaştırılır; env adı kilitli", () => {
    expect(edge()).toContain("secretsMatch(providedSecret, Deno.env.get(\"GROUP_LINK_HEALTH_CRON_SECRET\"))");
    expect(edge()).toContain("diff |= a[i] ^ b[i];");
  });

  it("istekler arasında AYARLANABİLİR gecikme (rate-limit dersi)", () => {
    expect(edge()).toContain("if (index > 0) await sleep(delayMs);");
    expect(edge()).toContain('p_key: "groups.link_health_request_delay_ms"');
    expect(edge()).toContain('p_key: "groups.link_health_batch_limit"');
  });

  it("kural 8: log/yanıt YALNIZ sayılar — link ve kimlik sızmaz", () => {
    expect(edge()).toContain('console.info("group-link-health", summary);');
    expect(edge()).not.toContain("console.info(\"group-link-health\", row");
    // JSON anahtarı olarak invite_link yanıta/log'a giremez (TS tip anotasyonu
    // `"invite_link:"` değil `"invite_link"` JSON biçimiyle ayırt edilir)
    expect(edge()).not.toContain('"invite_link"');
    expect(edge()).not.toContain("invite_link: row.invite_link");
    // Yanıt nesnesi summary'den ibaret
    expect(edge()).toContain("return jsonResponse(summary, 200);");
  });

  it("üç değerli sonuç readInvitePage'den record'a birebir taşınır", () => {
    expect(edge()).toContain("readInvitePage(row.invite_link, row.platform");
    expect(edge()).toContain('p_result: read.result,');
  });

  it("config.toml: verify_jwt=false + gerekçe yorumu (A99-R2 dersi)", () => {
    const config = readFileSync("supabase/config.toml", "utf8");

    expect(config).toContain("[functions.group-link-health]");
    expect(config).toMatch(/\[functions\.group-link-health\]\s*\nverify_jwt = false/);
    expect(config).toContain("A99-R2 dersi");
  });
});

describe("G22 · istemci yenileme sarmalayıcısı", () => {
  it("ownerRenew → group_owner_renew_v1", () => {
    const src = readFileSync("src/lib/group-owner-panel.ts", "utf8");
    const renewFn = sliceBetween(src, "export async function ownerRenew(", "\n}", "ownerRenew");

    expect(renewFn).toContain('supabase.rpc("group_owner_renew_v1" as never');
  });
});
