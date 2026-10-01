/**
 * KR03 sözleşmeleri.
 *
 * Üç sessiz başarısızlık sınıfını kapatır:
 *   1. SQL'e eklenen `career_` kodunun Türkçe karşılığının unutulması
 *      (kullanıcı ham kodu görür) — ve tersi, haritada olup SQL'de olmayan kod.
 *   2. İstemci dosya sınırının kova sınırını AŞMASI: dosya istemciden geçer,
 *      kovadan döner, kullanıcı sebebi anlaşılmayan bir hata görür.
 *   3. `accept=` ile gerçek doğrulamanın ayrışması + ham `file.name`'in depolama
 *      anahtarına girmesi (`service-attachment-security.test.ts` ile aynı sözleşme).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CAREER_CV_ACCEPT,
  CAREER_CV_MAX_SIZE,
  CAREER_ERROR_MESSAGES,
  CAREER_PRESENTATION_ACCEPT,
  CAREER_PRESENTATION_MAX_SIZE,
  careerContentType,
  careerErrorMessage,
  careerStorageKey,
} from "@/lib/careers/careers-api";

const MIGRATION_DIRS = ["supabase/migrations/applied", "supabase/migrations/archive"];

const sqlCodes = (() => {
  const codes = new Map<string, string>();
  for (const dir of MIGRATION_DIRS) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith(".sql"));
    } catch {
      continue;
    }
    for (const file of files) {
      const sql = readFileSync(join(dir, file), "utf8");
      for (const match of sql.matchAll(/raise\s+exception\s+'(career_[a-z0-9_]+)'/gi)) {
        if (!codes.has(match[1])) codes.set(match[1], `${dir}/${file}`);
      }
    }
  }
  return codes;
})();

const migrationSql = () =>
  readFileSync("supabase/migrations/applied/20261001130000_career_applications.sql", "utf8");

describe("career RPC hata kodu ↔ Türkçe mesaj sözleşmesi", () => {
  it("SQL'den kod toplayabiliyor (tarama boşa düşmesin)", () => {
    // Bu kapan olmadan aşağıdaki iddialar çıpasızdır: regex ya da yol bozulunca
    // "hiç eksik yok" derler.
    expect(sqlCodes.size, "SQL'den career_ kodu toplanamadı").toBeGreaterThanOrEqual(12);
  });

  it("her SQL kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes.entries()]
      .filter(([code]) => !(code in CAREER_ERROR_MESSAGES))
      .map(([code, file]) => `${code} (${file})`);

    expect(missing).toEqual([]);
  });

  it("haritada SQL'de olmayan kod yok (ters yön)", () => {
    const stale = Object.keys(CAREER_ERROR_MESSAGES).filter((code) => !sqlCodes.has(code));

    expect(stale).toEqual([]);
  });

  it("mesajların hepsi dolu ve Türkçe cümle", () => {
    for (const [code, message] of Object.entries(CAREER_ERROR_MESSAGES)) {
      expect(message.trim(), code).not.toBe("");
      expect(message, code).not.toMatch(/^career_/);
    }
  });

  it("düz nesne hatadan kodu çıkarır (Error örneği DEĞİL)", () => {
    // supabase-js RPC hatası düz nesnedir; `instanceof Error` daraltması bu
    // haritayı canlıda iki kez tamamen ölü bıraktı.
    const rpcError = { message: "career_email_daily_limit", code: "53400", details: null, hint: null };

    expect(careerErrorMessage(rpcError)).toBe(CAREER_ERROR_MESSAGES.career_email_daily_limit);
  });

  it("bilinmeyen hatada ham metin DEĞİL, genel mesaj döner", () => {
    expect(careerErrorMessage({ message: "PGRST204 something broke" })).not.toContain("PGRST204");
    expect(careerErrorMessage(null)).not.toBe("");
  });
});

describe("career dosya sınırları ve depolama anahtarı", () => {
  it("istemci sınırları kovanın SQL sınırını AŞMAZ", () => {
    const bucketLimit = Number(migrationSql().match(/false,\s*\n\s*(\d+),/)?.[1]);

    expect(bucketLimit, "kova sınırı migration'dan okunamadı").toBeGreaterThan(0);
    expect(CAREER_CV_MAX_SIZE).toBeLessThanOrEqual(bucketLimit);
    expect(CAREER_PRESENTATION_MAX_SIZE).toBeLessThanOrEqual(bucketLimit);
  });

  it("`accept` niteliği doğrulanan uzantılarla birebir aynı", () => {
    expect(CAREER_CV_ACCEPT).toBe(".pdf,.doc,.docx");
    expect(CAREER_PRESENTATION_ACCEPT).toBe(".pdf,.ppt,.pptx,.key");
  });

  it("MIME türü uzantıdan belirlenir — `.key` için boş dönmez", () => {
    // `.key` dosyaları tarayıcıya göre boş ya da application/zip gelir; kova
    // listesi dar olduğu için tür dosyadan değil uzantıdan verilir.
    expect(careerContentType("sunum.key")).toBe("application/vnd.apple.keynote");
    expect(careerContentType("cv.PDF")).toBe("application/pdf");
    expect(careerContentType("virus.exe")).toBeUndefined();
  });

  it("ham dosya adı depolama anahtarına girmez", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    const key = careerStorageKey(id, "cv", "../../etc/pa sswd;rm -rf.pdf");

    expect(key.startsWith(`${id}/cv-`)).toBe(true);
    expect(key).not.toContain("..");
    expect(key).not.toContain(" ");
    expect(key.slice(id.length + 1)).toMatch(/^(cv|cover-letter|presentation)-[A-Za-z0-9._-]{1,120}$/);
  });

  it("üretilen anahtar kovanın INSERT politikasındaki desene uyar", () => {
    // Politika deseni migration'da; ikisi ayrışırsa yükleme canlıda 403 döner.
    const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const policy = /\^\[0-9a-fA-F\]\{8\}-/.test(migrationSql());

    expect(policy, "politika deseni migration'da bulunamadı").toBe(true);
    for (const kind of ["cv", "cover-letter", "presentation"] as const) {
      expect(careerStorageKey(id, kind, "Özgeçmiş Son.pdf")).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/(cv|cover-letter|presentation)-[A-Za-z0-9._-]{1,120}$/,
      );
    }
  });
});
