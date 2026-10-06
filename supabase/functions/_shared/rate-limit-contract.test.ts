import { existsSync, readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("assistant rate-limit single-source contract", () => {
  it("routes site-assistant through the shared epoch-based limiter", () => {
    const source = readFileSync("supabase/functions/site-assistant/index.ts", "utf8");
    const relocationSource = readFileSync("supabase/functions/relocation-assistant/index.ts", "utf8");

    expect(source).toContain('import { enforceRateLimit } from "../_shared/rate-limit.ts"');
    expect(source).toContain('await enforceRateLimit(supabase, req, "site-assistant"');
    expect(relocationSource).toContain('import { enforceRateLimit as enforceSharedRateLimit } from "../_shared/rate-limit.ts"');
    expect(relocationSource).toContain("await enforceSharedRateLimit(");
    expect(relocationSource).not.toContain("async function enforceRateLimit");
  });
});

// SG9: select+update ayrı ayrı yapan yerel kopyalar yarış durumuna açıktır — iki eşzamanlı
// istek aynı satırı okuyup ikisi de "sınır altında" sanır. `find-matches` ve
// `send-submission-email` böyle kendi kopyalarını taşıyordu; atomik tek kaynak
// (`_shared/rate-limit.ts` → `edge_rate_limit_atomic` RPC) dışına çıkılmamalı.
describe("rate-limit: yerel select+update kopyası yasak", () => {
  const read = (fn: string) => readFileSync(`supabase/functions/${fn}/index.ts`, "utf8");

  for (const fn of ["find-matches", "send-submission-email"]) {
    it(`${fn} paylaşılan atomik sürümü kullanır, kendi kopyasını taşımaz`, () => {
      const source = read(fn);

      expect(source).toContain('import { enforceRateLimit } from "../_shared/rate-limit.ts"');
      expect(source).not.toContain("async function enforceRateLimit");
      expect(source).not.toContain("function getClientKey");
    });
  }

  it("find-matches sınırı IP'ye değil user.id'ye göre uygular (sahtecilik önleme)", () => {
    expect(read("find-matches")).toMatch(
      /await enforceRateLimit\(\s*supabase,\s*req,\s*"find-matches",\s*RATE_LIMIT_MAX,\s*RATE_LIMIT_WINDOW_SECONDS,\s*user\.id,?\s*\)/,
    );
  });

  it("submit-survey-response anahtarlı atomik sürümü kullanır, 429 eşlemesini korur", () => {
    const source = read("submit-survey-response");

    expect(source).toContain('import { enforceRateLimitForKey } from "../_shared/rate-limit.ts"');
    // Atomik çağrı + tuzlanmış IP hash'i ile anket başına kapsam.
    expect(source).toMatch(/enforceRateLimitForKey\(\s*supabase,\s*`survey-submit:\$\{survey\.id\}`,\s*ipHash,/);
    // "RATE_LIMITED" yakalanıp 429'a çevrilmeli; yoksa sınır aşımı 500 olur.
    expect(source).toContain('rateLimitError.message === "RATE_LIMITED"');
    expect(source).toContain('json({ error: "Too many requests" }, 429)');
  });

  // BİLİNEN BORÇ (ratchet): bot kapalı/deploy edilmedi, kendi 24 saatlik kayan pencere
  // semantiği var ve test tablo adını sabitliyor. Taşınınca bu test düşer → listeden sil.
  it("whatsapp-autoreply hâlâ doğrudan edge_rate_limits kullanıyor (bilinen borç)", () => {
    const source = readFileSync("supabase/functions/_shared/whatsapp-autoreply.ts", "utf8");

    expect(source, "borç kapandı: bu ratchet testini ve notunu sil").toMatch(
      /from\(\s*["']edge_rate_limits["']\s*\)/,
    );
  });

  it("hiçbir edge function edge_rate_limits tablosuna doğrudan dokunmaz", () => {
    const dirs = readdirSync("supabase/functions", { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name);
    expect(dirs.length, "edge function dizinleri bulunamadı").toBeGreaterThan(5);

    const ihlal = dirs.filter((fn) => {
      const path = `supabase/functions/${fn}/index.ts`;
      return existsSync(path) && /from\(\s*["']edge_rate_limits["']\s*\)/.test(readFileSync(path, "utf8"));
    });

    expect(ihlal, `edge_rate_limits'e doğrudan erişen fonksiyon: ${ihlal.join(", ")}`).toEqual([]);
  });
});
