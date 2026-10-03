/**
 * G06b sözleşmeleri — `org-verification-api.ts` ↔ G06a migration
 * (`20261003100000_org_verification.sql`).
 *
 * Kapatılan sessiz başarısızlık sınıfları (careers-api.test deseni):
 *   1. SQL'deki `org_verification_` kodunun Türkçe karşılığının unutulması
 *      (ÇİFT YÖNLÜ: SQL'de olup haritada olmayan + haritada olup SQL'de olmayan).
 *   2. İstemci dosya sınırının kova sınırını AŞMASI (15 MB ↔ 15728640).
 *   3. `accept=` ile gerçek doğrulamanın ayrışması + ham `file.name`'in depolama
 *      anahtarına girmesi + anahtarın politika deseninden (`<uid>/…`) sapması.
 *   4. Belgenin `getPublicUrl` ile sızdırılması (kova PRIVATE) / RPC hatasının
 *      `instanceof Error` ile daraltılması (haritayı ölü bırakır).
 *
 * 🔴 KOŞUL kilidi (metin değil): davranış iddiaları düz-nesne RPC hatası, içerik
 * türü türetme ve anahtar sanitizasyonu üzerinde ölçülür — kaynak metni silmek
 * bunları düşürür.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ORG_VERIFICATION_ACCEPT,
  ORG_VERIFICATION_BUCKET,
  ORG_VERIFICATION_ERROR_MESSAGES,
  ORG_VERIFICATION_EXTENSIONS,
  ORG_VERIFICATION_MAX_DOCUMENTS,
  ORG_VERIFICATION_MAX_SIZE,
  isOrgVerificationNotLinkedError,
  orgVerificationContentType,
  orgVerificationErrorMessage,
  orgVerificationStorageKey,
} from "@/lib/org-verification-api";

const MIGRATION = "supabase/migrations/applied/20261003100000_org_verification.sql";
const API_SOURCE = "src/lib/org-verification-api.ts";
const migrationSql = () => readFileSync(MIGRATION, "utf8");
const apiSource = () => readFileSync(API_SOURCE, "utf8");

const sqlCodes = (() => {
  const codes = new Set<string>();
  for (const match of migrationSql().matchAll(/raise\s+exception\s+'(org_verification_[a-z0-9_]+)'/gi)) {
    codes.add(match[1]);
  }
  return codes;
})();

describe("G06b · RPC hata kodu ↔ Türkçe mesaj (ÇİFT YÖNLÜ)", () => {
  it("SQL'den kod toplayabiliyor (tarama boşa düşmesin)", () => {
    // Bu kapan olmadan aşağıdaki iddialar çıpasızdır: regex/yal bozulunca
    // "hiç eksik yok" derler (careers dersi).
    expect(sqlCodes.size, "SQL'den org_verification_ kodu toplanamadı").toBe(9);
  });

  it("her SQL kodunun Türkçe karşılığı var", () => {
    const missing = [...sqlCodes].filter((code) => !(code in ORG_VERIFICATION_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada SQL'de olmayan kod yok (ters yön)", () => {
    const stale = Object.keys(ORG_VERIFICATION_ERROR_MESSAGES).filter((code) => !sqlCodes.has(code));
    expect(stale).toEqual([]);
  });

  it("mesajların hepsi dolu ve ham kod DEĞİL", () => {
    for (const [code, message] of Object.entries(ORG_VERIFICATION_ERROR_MESSAGES)) {
      expect(message.trim(), code).not.toBe("");
      expect(message, code).not.toMatch(/^org_verification_/);
    }
  });

  it("düz nesne hatadan kodu çıkarır (Error örneği DEĞİL — instanceof daraltması ölür)", () => {
    const rpcError = { message: "org_verification_pending_exists", code: "P0001", details: null, hint: null };
    expect(orgVerificationErrorMessage(rpcError)).toBe(
      ORG_VERIFICATION_ERROR_MESSAGES.org_verification_pending_exists,
    );
  });

  it("bilinmeyen hatada ham metin DEĞİL, genel mesaj döner", () => {
    expect(orgVerificationErrorMessage({ message: "PGRST204 something broke" })).not.toContain("PGRST204");
    expect(orgVerificationErrorMessage(null)).not.toBe("");
  });

  it("not_linked yardımcısı yalnız o kodu tanır (UI 'önce sahiplen' yolu)", () => {
    expect(isOrgVerificationNotLinkedError({ message: "org_verification_not_linked" })).toBe(true);
    expect(isOrgVerificationNotLinkedError({ message: "org_verification_already_verified" })).toBe(false);
    expect(isOrgVerificationNotLinkedError(null)).toBe(false);
  });
});

describe("G06b · kova sınırları ve depolama anahtarı", () => {
  it("istemci boyut sınırı kovanın SQL sınırını AŞMAZ (iki sayı karşılaştırılır)", () => {
    const bucketLimit = Number(migrationSql().match(/false,\s+(\d+),/)?.[1]);
    expect(bucketLimit, "kova sınırı migration'dan okunamadı").toBeGreaterThan(0);
    expect(ORG_VERIFICATION_MAX_SIZE).toBeLessThanOrEqual(bucketLimit);
    expect(ORG_VERIFICATION_MAX_SIZE).toBe(15 * 1024 * 1024);
  });

  it("istemci belge sınırı RPC gövdesindeki c_max_documents ile birebir", () => {
    const sqlMax = Number(migrationSql().match(/c_max_documents\s+constant\s+int\s*:=\s*(\d+)/)?.[1]);
    expect(sqlMax, "c_max_documents migration'dan okunamadı").toBeGreaterThan(0);
    expect(ORG_VERIFICATION_MAX_DOCUMENTS).toBe(sqlMax);
  });

  it("`accept` niteliği doğrulanan uzantılarla birebir aynı küme", () => {
    const fromAccept = ORG_VERIFICATION_ACCEPT.split(",").map((s) => s.replace(".", "")).sort();
    expect(fromAccept).toEqual([...ORG_VERIFICATION_EXTENSIONS].sort());
    // Kovanın 4 MIME'ı: pdf + jpeg(jpg/jpeg) + png + webp — octet-stream YOK.
    expect(ORG_VERIFICATION_EXTENSIONS).toEqual(new Set(["pdf", "jpg", "jpeg", "png", "webp"]));
  });

  it("MIME türü UZANTIDAN belirlenir (file.type DEĞİL), dar liste", () => {
    expect(orgVerificationContentType("tuzuk.pdf")).toBe("application/pdf");
    expect(orgVerificationContentType("belge.JPG")).toBe("image/jpeg");
    expect(orgVerificationContentType("belge.jpeg")).toBe("image/jpeg");
    expect(orgVerificationContentType("gorsel.png")).toBe("image/png");
    expect(orgVerificationContentType("gorsel.webp")).toBe("image/webp");
    // Kova listesinde olmayan tür undefined → upload'da contentType boş düşmez.
    expect(orgVerificationContentType("virus.exe")).toBeUndefined();
    expect(orgVerificationContentType("arsiv.zip")).toBeUndefined();
  });

  it("ham dosya adı depolama anahtarına girmez + İLK klasör kullanıcı kimliği", () => {
    const uid = "11111111-2222-3333-4444-555555555555";
    const itemId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const key = orgVerificationStorageKey(uid, itemId, "../../etc/pa sswd;rm -rf.pdf");

    expect(key.startsWith(`${uid}/${itemId}/`)).toBe(true);
    expect(key).not.toContain("..");
    expect(key).not.toContain(" ");
    // <uuid>/<uuid>/<güvenli-ad> — güvenli ad yalnız [A-Za-z0-9._-], ≤120.
    expect(key).toMatch(
      /^[0-9a-fA-F-]{36}\/[0-9a-fA-F-]{36}\/[A-Za-z0-9._-]{1,120}$/,
    );
  });

  it("anahtar kovanın INSERT politikası deseniyle uyumlu (ilk klasör = auth.uid())", () => {
    // Politika: (storage.foldername(name))[1] = auth.uid()::text. Anahtarın İLK
    // segmenti uuid olmalı ki politika çağıranın klasörünü doğrulayabilsin.
    const policy = migrationSql();
    expect(policy, "politika foldername desenini içermeli").toContain(
      "(storage.foldername(name))[1] = auth.uid()",
    );
    const uid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const key = orgVerificationStorageKey(uid, "11111111-2222-3333-4444-555555555555", "Tüzük.pdf");
    expect(key.split("/")[0]).toBe(uid);
  });

  it("kova PRIVATE (migration'da public=false) — getPublicUrl sızıntısı olamaz", () => {
    expect(migrationSql()).toMatch(/'org-verification-docs',\s*\n\s*'org-verification-docs',\s*\n\s*false,/);
    expect(ORG_VERIFICATION_BUCKET).toBe("org-verification-docs");
  });
});

describe("G06b · kaynak kilitleri (PRIVATE URL + düz-nesne hata)", () => {
  it("belge yalnız createSignedUrl ile açılır — getPublicUrl KULLANILMAZ", () => {
    const src = apiSource();
    expect(src).toContain("createSignedUrl");
    expect(src).not.toContain("getPublicUrl");
  });

  it("RPC hatası instanceof Error ile DARALTILMAZ (extractRpcErrorText tek kaynak)", () => {
    const src = apiSource();
    expect(src).not.toContain("instanceof Error");
    expect(src).toContain("extractRpcErrorText");
  });

  it("claim_type/status istemciden parametre GÖNDERİLMEZ (gövdede zorlanır)", () => {
    // İstemci RPC'ye yalnız p_item_id/p_doc_paths/p_note geçirir; verification_level_2
    // ve pending SQL gövdesinde sabittir (M02/M03 dersi). API kaynağında bu iki
    // alanı PARAMETRE olarak geçiren hiçbir çağrı olmamalı.
    const src = apiSource();
    expect(src).not.toMatch(/p_claim_type|p_status/);
    expect(src).not.toMatch(/claim_type\s*:|status\s*:\s*["']pending/);
    // RPC çağrısı tam olarak üç parametre geçirir.
    expect(src).toContain("p_item_id:");
    expect(src).toContain("p_doc_paths:");
    expect(src).toContain("p_note:");
  });
});
