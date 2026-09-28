// RPC hata metni çıkarımı — TEK KAYNAK sözleşmesi.
//
// ⚠️ Bu sınıf CANLIDA İKİ KEZ KIRILDI ve ikisi de aynı kök nedendendi:
//   1. cadde-rules (2026-08-05'e kadar) — Türkçe mesaj haritası AYLARCA ölüydü
//   2. service-finder (S05, 2026-09-28) — kullanıcı "[object Object]" görüyordu
// İkincisi, birincisi düzeltildikten SONRA yaşandı: çözüm kopyalanmamıştı.
// Bu test tek kaynağı ve iki tüketicisini birden kilitler.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { resolveCaddeRpcErrorMessage } from "@/lib/cadde-rules";
import { extractRpcErrorText } from "@/lib/rpc-error-text";
import { SF_ERROR_MESSAGES, sfErrorMessage } from "@/lib/service-finder-format";

describe("extractRpcErrorText", () => {
  it("Error örneğinden mesajı alır", () => {
    expect(extractRpcErrorText(new Error("patladı"))).toBe("patladı");
  });

  it("DÜZ NESNEDEN de alır — asıl kusur buydu", () => {
    // supabase-js RPC hataları `Error` örneği DEĞİLDİR.
    expect(extractRpcErrorText({ message: "cadde_banned" })).toContain("cadde_banned");
  });

  it("kodu `code`/`details`/`hint` alanında taşıyan hatayı da okur", () => {
    expect(extractRpcErrorText({ code: "P0001", details: "sf_job_not_found" })).toContain(
      "sf_job_not_found",
    );
    expect(extractRpcErrorText({ hint: "cadde_rate_limited" })).toContain("cadde_rate_limited");
  });

  it("dizeyi olduğu gibi döndürür", () => {
    expect(extractRpcErrorText("ham metin")).toBe("ham metin");
  });

  it("null/undefined/sayıda boş metin döner (çökmez)", () => {
    for (const value of [null, undefined, 42, true]) {
      expect(extractRpcErrorText(value)).toBe("");
    }
  });

  it("dize olmayan alanları atlar", () => {
    expect(extractRpcErrorText({ message: 5, code: "sf_x" })).toBe("sf_x");
  });
});

describe("iki tüketici de düz nesneyi çözer", () => {
  it("cadde çözümleyicisi düz nesnedeki kodu bulur", () => {
    const resolved = resolveCaddeRpcErrorMessage({ message: "cadde_banned" });

    // Ham kod DEĞİL, Türkçe karşılık dönmeli.
    expect(resolved).not.toContain("cadde_banned");
    expect(resolved.length).toBeGreaterThan(5);
  });

  it("service-finder çözümleyicisi düz nesnedeki kodu bulur", () => {
    expect(sfErrorMessage({ message: "sf_job_not_found", code: "P0001" })).toBe(
      SF_ERROR_MESSAGES.sf_job_not_found,
    );
  });
});

describe("kopya geri gelmesin", () => {
  it("iki çözümleyici de KENDİ çıkarıcısını tanımlamaz", () => {
    // ⚠️ Asıl risk bu: düzeltme kopyalanmadığı için ikinci modül aylarca bozuk kaldı.
    // Kendi `extract...` fonksiyonunu tanımlayan modül tek kaynaktan ayrışır.
    for (const file of ["src/lib/cadde-rules.ts", "src/lib/service-finder-format.ts"]) {
      const source = readFileSync(file, "utf8");

      expect(source, `${file} tek kaynağı kullanmalı`).toContain("extractRpcErrorText");
      expect(source, `${file} kendi çıkarıcısını tanımlamamalı`).not.toMatch(
        /function extract\w*ErrorText\(/,
      );
    }
  });
});
