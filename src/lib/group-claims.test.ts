/**
 * G20 sözleşmesi — sahiplik istemcisi (`group-claims.ts`) ↔ G13 backend.
 *
 * Kapattığı sessiz başarısızlıklar:
 *   1. **Hata haritasının eksilmesi/uydurulması.** Kullanıcıya çağırılan iki
 *      RPC'nin (start_code + submit_screenshot) HER raise kodu Türkçeleşmeli;
 *      haritada migration'da olmayan hayali kod da olmamalı (KR03 çift yön).
 *   2. **Doğrulama çağrısının link/kod taşıması.** G08 kural 8: istemci
 *      `claim_id` dışında HİÇBİR ŞEY göndermez — sunucu linki ve kodu DB'den
 *      okur. Body'ye ek alan sızarsa (ör. "kolaylık" için kod) denetim izi
 *      ve okuma tekeli kırılır.
 *   3. **Sonuç metinlerinin tasarım dilinden kayması.** "Kodu artık
 *      silebilirsin" (tasarım §3.B.4 + §9 bildirimi) — kullanıcıya kodu
 *      grup adında bırakmasını söyleyen tek cümle.
 *   4. **Kova/klasör deseninin ayrışması.** RPC `split_part(path,'/',1)=uid`
 *      ve storage politikası `{uid}/screenshot-*` zorunlu kılar; istemci
 *      farklı üretirse her talep `group_claim_path_forbidden` ile düşer.
 */
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CLAIM_SCREENSHOT_BUCKET,
  CLAIM_VERIFY_RESULT_MESSAGES,
  GROUP_CLAIM_ERROR_MESSAGES,
} from "@/lib/group-claims";
import { sliceBetween } from "@/test/source-slice";

const G13 = "20261002040000_group_claims.sql";

const g13Sql = () => {
  const candidates = [`supabase/migrations/applied/${G13}`, `supabase/migrations/${G13}`];
  const path = candidates.find((candidate) => existsSync(candidate));
  if (!path) throw new Error(`${G13} bulunamadı`);
  return readFileSync(path, "utf8");
};

const raiseCodes = (fnName: string) => {
  const body = sliceBetween(
    g13Sql(),
    `create or replace function public.${fnName}(`,
    `comment on function public.${fnName}`,
    fnName,
  );
  return [...body.matchAll(/raise exception '(group_[a-z0-9_]+)'/g)].map((m) => m[1]);
};

describe("G20 · hata haritası çift yönlü (KR03 deseni)", () => {
  it("kullanıcının çağırdığı iki RPC'nin HER raise kodu haritada", () => {
    const codes = new Set([...raiseCodes("group_claim_start_code"), ...raiseCodes("group_claim_submit_screenshot")]);
    expect(codes.size).toBeGreaterThanOrEqual(5);

    const missing = [...codes].filter((code) => !(code in GROUP_CLAIM_ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });

  it("haritada migration'da OLMAYAN hayali kod yok", () => {
    const sql = g13Sql();
    const phantom = Object.keys(GROUP_CLAIM_ERROR_MESSAGES).filter((code) => !sql.includes(`'${code}'`));
    expect(phantom).toEqual([]);
  });
});

describe("G20 · doğrulama çağrısı kural 8'e uygun", () => {
  it("body YALNIZ claim_id taşır — link/kod istemciden gitmez", () => {
    const src = readFileSync("src/lib/group-claims.ts", "utf8");
    const fn = sliceBetween(src, "export async function verifyClaimCode(", "\n}", "verifyClaimCode");

    expect(fn).toContain("JSON.stringify({ claim_id: claimId })");
    expect(fn).not.toContain("whatsapp_link");
    expect(fn).not.toContain("invite");
    // Edge adı birebir (deploy edilmiş fonksiyon)
    expect(fn).toContain("functions/v1/group-claim-verify");
  });

  it("sonuç metinleri tasarım §3.B dili — 'Kodu artık silebilirsin' korunur", () => {
    expect(CLAIM_VERIFY_RESULT_MESSAGES.verified).toContain("Kodu artık silebilirsin");
    expect(CLAIM_VERIFY_RESULT_MESSAGES.invalid_link).toContain("deneme sayılmadı");
    expect(CLAIM_VERIFY_RESULT_MESSAGES.unknown).toContain("deneme sayılmadı");
  });
});

describe("G20 · ekran görüntüsü yolu G13 kovan/policy deseniyle birebir", () => {
  it("kova adı migration'dakiyle aynı", () => {
    expect(CLAIM_SCREENSHOT_BUCKET).toBe("group-claim-screenshots");
    expect(g13Sql()).toContain("'group-claim-screenshots'");
  });

  it("yükleme yolu KENDİ klasöründe ve `screenshot-` deseninde (RPC+policy kilidi)", () => {
    const src = readFileSync("src/lib/group-claims.ts", "utf8");
    const fn = sliceBetween(src, "export async function submitClaimScreenshot(", "\n}", "submitClaimScreenshot");

    expect(fn).toContain("`${uid}/screenshot-${Date.now()}-${safeName}`");
    // RPC tarafı: split_part(p_screenshot_path,'/',1) = uid — migration'da kilitli
    expect(g13Sql()).toContain("split_part(p_screenshot_path, '/', 1) <> v_uid::text");
  });
});
