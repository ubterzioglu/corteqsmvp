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
  RECOMMENDATION_TITLE_MAX,
  RECOMMENDATION_RPC_ERROR_MESSAGES,
  resolveRecommendationRpcErrorMessage,
} from "@/lib/recommendations-rules";

const MIGRATIONS = [
  "20261003140000_recommendation_requests.sql",
  "20261003150000_match_recommendation_professionals.sql",
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
    expect(raisedCodes().size).toBeGreaterThanOrEqual(7);
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

  it("uzunluk mesajları sabiti kullanıyor (elle yazılmış ikinci sayı yok)", () => {
    expect(RECOMMENDATION_RPC_ERROR_MESSAGES.recommendation_invalid_title).toContain(
      `${RECOMMENDATION_TITLE_MAX}`,
    );
    expect(RECOMMENDATION_RPC_ERROR_MESSAGES.recommendation_invalid_body).toContain(
      `${RECOMMENDATION_BODY_MAX}`,
    );
  });
});
