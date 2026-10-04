/**
 * M19 ayna sözleşmesi — `recommendations-rules.ts` ↔ M17/M18 migration'ları.
 *
 * Desen: `events-first-approval.test.ts` + `cadde-error-map.test.ts`. Kapattığı
 * sessiz başarısızlıklar:
 *   1. Harita eksik/hayalet kod (ÇİFT YÖN): yeni `recommendation_` raise kodu
 *      haritada yoksa kullanıcı genel mesaja düşer (teşhis ölür); haritada
 *      migration'da olmayan kod varsa ölü ağırlık.
 *   2. Sabit aynalarının kayması: başlık/gövde uzunluğu + diaspora kümesi migration
 *      metninden okunur; istemci sabiti ayrışırsa UI yalan söyler.
 *   3. Çözümleyicinin DÜZ NESNE hatadan çözmesi (instanceof Error YASAK — m75).
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  RECOMMENDATION_BODY_MAX,
  RECOMMENDATION_DIASPORA_KEYS,
  RECOMMENDATION_MATCH_DEFAULT_LIMIT,
  RECOMMENDATION_TITLE_MAX,
  RECOMMENDATION_RPC_ERROR_MESSAGES,
  resolveRecommendationRpcErrorMessage,
} from "@/lib/recommendations-rules";

const MIGRATIONS = [
  "20261003140000_recommendation_requests.sql",
  "20261003150000_match_recommendation_professionals.sql",
  // 🔴 inceleme W8: create RPC'yi YENİDEN tanımlayan migration'lar da aynaya
  // GİRMEK ZORUNDA — canlı tanım sonuncusudur; yalnız M17'yi okumak ölü kopyayı
  // kilitler (sabitler/kodlar sessizce ayrışabilirdi).
  "20261004110000_recommendation_match_notification.sql",
  "20261004220000_recommendation_answer_self_guard.sql",
  "20261004240000_recommendation_already_answered.sql",
];

const readMigration = (name: string) => {
  for (const dir of ["supabase/migrations/applied/", "supabase/migrations/"]) {
    const path = dir + name;
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  throw new Error(`${name} bulunamadı`);
};

const allSql = () => MIGRATIONS.map(readMigration).join("\n");

const raisedCodes = () =>
  new Set([...allSql().matchAll(/raise exception '(recommendation_[a-z0-9_]+)'/g)].map((m) => m[1]));

describe("M19 · hata haritası iki migration'a karşı çift yönlü", () => {
  it("migration'lardan kod toplayabiliyor (tarama boşa düşmesin)", () => {
    // Bu kapan olmazsa aşağıdaki iddialar çıpasızdır (events dersi).
    // 9 kod: M17 (7) + self_answer (20261004220000) + already_answered (20261004240000).
    expect(raisedCodes().size).toBeGreaterThanOrEqual(9);
  });

  it("migration'lardaki HER recommendation_* kodu haritada", () => {
    const codes = raisedCodes();
    const missing = [...codes].filter((code) => !(code in RECOMMENDATION_RPC_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada migration'larda OLMAYAN hayalet kod yok (ters yön)", () => {
    const sql = allSql();
    const phantom = Object.keys(RECOMMENDATION_RPC_ERROR_MESSAGES).filter(
      (code) => !sql.includes(`'${code}'`),
    );
    expect(phantom).toEqual([]);
  });

  it("mesajlar dolu ve ham kod DEĞİL", () => {
    for (const [code, message] of Object.entries(RECOMMENDATION_RPC_ERROR_MESSAGES)) {
      expect(message.trim(), code).not.toBe("");
      expect(message, code).not.toMatch(/^recommendation_/);
    }
  });

  it("çözümleyici DÜZ NESNE hatadan Türkçe üretir (instanceof Error YASAK)", () => {
    const plain = { message: "recommendation_request_closed", code: "22023", details: null, hint: null };
    expect(resolveRecommendationRpcErrorMessage(plain)).toBe(
      RECOMMENDATION_RPC_ERROR_MESSAGES.recommendation_request_closed,
    );
    // Bilinmeyen kod → ham metin SIZMAZ, genel mesaj.
    expect(resolveRecommendationRpcErrorMessage({ message: "PGRST204 boom" })).not.toContain("PGRST204");
    expect(resolveRecommendationRpcErrorMessage({ message: "PGRST204 boom" })).toContain("tekrar dene");
    expect(resolveRecommendationRpcErrorMessage(null)).not.toBe("");
  });
});

describe("M19 · sabit aynaları (migration metniyle birebir)", () => {
  it("başlık/gövde uzunluk sınırları migration'daki sayılarla aynı", () => {
    const sql = allSql();
    expect(sql).toContain(`length(v_title) > ${RECOMMENDATION_TITLE_MAX}`);
    expect(sql).toContain(`length(v_body) > ${RECOMMENDATION_BODY_MAX}`);
  });

  it("diaspora kümesi migration CHECK'iyle aynı (tr/in/cn/ph)", () => {
    const sql = allSql();
    for (const key of RECOMMENDATION_DIASPORA_KEYS) {
      expect(sql, `${key} migration'da yok`).toContain(`'${key}'`);
    }
    expect(RECOMMENDATION_DIASPORA_KEYS).toEqual(["tr", "in", "cn", "ph"]);
  });

  it("F16: match varsayılan limiti M18 imzasıyla birebir (queryKey sabiti kaymasın)", () => {
    const m18 = readMigration("20261003150000_match_recommendation_professionals.sql");
    expect(m18).toContain(`p_limit integer default ${RECOMMENDATION_MATCH_DEFAULT_LIMIT}`);
    expect(RECOMMENDATION_MATCH_DEFAULT_LIMIT).toBe(25);
  });

  it("uzunluk mesajları sabiti kullanıyor (elle yazılmış ikinci sayı yok)", () => {
    expect(RECOMMENDATION_RPC_ERROR_MESSAGES.recommendation_invalid_title).toContain(
      `${RECOMMENDATION_TITLE_MAX}`,
    );
    expect(RECOMMENDATION_RPC_ERROR_MESSAGES.recommendation_invalid_body).toContain(
      `${RECOMMENDATION_BODY_MAX}`,
    );
  });
});

/**
 * İnceleme W7 · SKORER AYNASI: eşleştirme skoru İKİ migration'da kopya
 * (M18 match RPC + M22 bildirim enqueue). Ağırlık/normalize/görünürlük
 * kümesinden biri TEK tarafta değişirse görüntülenen eşleşme listesi ile
 * bildirilen küme SESSİZCE ayrışır — bu blok iki dosyayı birbirine kilitler.
 */
describe("M18↔M22 · skorlayıcı aynası (drift kilidi)", () => {
  const m18 = () => readMigration("20261003150000_match_recommendation_professionals.sql").replace(/\s+/g, " ");
  const m22 = () => readMigration("20261004110000_recommendation_match_notification.sql").replace(/\s+/g, " ");

  const sharedClauses = [
    "then 100 else 0 end", // kategori ağırlığı
    "then 30 else 0 end", // şehir ağırlığı
    "then 15 else 0 end", // ülke ağırlığı
    "ci.item_type = 'member'",
    "ci.status = 'published'",
    "ci.visibility = 'public'",
    "coalesce(ci.is_placeholder, false) = false",
    "rl.is_directory_visible = true",
    "public.catalog_search_normalize(",
  ];

  it("aynı ağırlık + görünürlük + normalize kümesi İKİ dosyada da birebir var", () => {
    for (const clause of sharedClauses) {
      expect(m18(), `M18 eksik: ${clause}`).toContain(clause);
      expect(m22(), `M22 eksik: ${clause}`).toContain(clause);
    }
  });

  it("BİLİNÇLİ ASİMETRİ kararı: bildirim banlıyı+sahibi ELER, görüntüleme listesi ELEMEZ", () => {
    // KARAR (inceleme W7): ban CADDE-yazma kapsamıdır; banlı kullanıcının
    // DİZİN kaydı herkese açık kalır (eşleşme listesi dizin görünürlüğünü
    // yansıtır), ama platform ona mail GÖNDERMEZ. Asimetri bilinçli ve burada
    // kilitli: M22'de is_cadde_banned + requester dışlaması VAR, M18'de YOK —
    // biri "düzeltme" adına kaydırırsa bu test düşer ve karar tartışmaya açılır.
    expect(m22()).toContain("is_cadde_banned(cim.user_id)");
    expect(m22()).toContain("cim.user_id <> v_uid");
    expect(m18()).not.toContain("is_cadde_banned");
  });
});
