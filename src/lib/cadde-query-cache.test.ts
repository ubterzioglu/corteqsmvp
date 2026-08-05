// Cadde tazelik sözleşmesi (B4) — gerekçe: `src/lib/cadde-query-cache.ts`.
//
// KURAL: Cadde yüzeylerindeki her `useQuery` / `useInfiniteQuery` ya `staleTime`
// (açıkça önbelleklenmiş) ya da `refetchInterval` (açıkça canlı) taşımalıdır.
// İkisi de yoksa sorgu "kazara canlı"dır: React Query v5 varsayılanı `staleTime: 0`
// + `refetchOnWindowFocus: true` olduğu için her sekme odağında yeniden çekilir.
//
// Bu sınıf hata sessizdir — ekranda hiçbir şey bozulmaz, yalnız her odakta bir RPC
// dalgası gider. 04.08.2026 denetiminde /cadde'de 8 sorgu bu durumdaydı.
//
// Test kaynak METNİNİ tarar (davranışı değil): yeni bir sorgu ikisinden birini
// taşımadan eklenirse burada düşer. Testi susturma — sorguya pencere ver.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CADDE_LIST_STALE_MS,
  CADDE_PROMO_STALE_MS,
  CADDE_REFERENCE_STALE_MS,
} from "@/lib/cadde-query-cache";

/** Aynı QueryClient'ı paylaşan, /cadde ile birlikte mount olan yüzeyler. */
const caddeQuerySurfaces = [
  "src/pages/cadde/CaddePage.tsx",
  "src/components/cadde/PromotionRail.tsx",
  "src/components/cadde/CarsiGlobalTicker.tsx",
  "src/components/cadde/CaddeTrendingHashtags.tsx",
  "src/components/cadde/NotificationsBell.tsx",
];

/**
 * `useQuery({ ... })` çağrısının seçenek nesnesini metin olarak döndürür.
 * Süslü parantezleri sayarken string literal ve satır yorumlarının içindeki
 * parantezleri atlar — yoksa `"}"` içeren bir metin sayacı kaydırır.
 */
const readOptionsObject = (source: string, openBraceIndex: number): string => {
  let depth = 0;
  let quote: string | null = null;
  let inLineComment = false;

  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    const previous = index > 0 ? source[index - 1] : "";

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === "/" && source[index + 1] === "/") {
      inLineComment = true;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(openBraceIndex, index + 1);
    }
  }

  throw new Error("Dengeli süslü parantez bulunamadı — seçenek nesnesi okunamadı.");
};

/** Dosyadaki her useQuery/useInfiniteQuery çağrısının seçenek nesnesi. */
const queryOptionBlocks = (file: string): Array<{ file: string; options: string }> => {
  const source = readFileSync(file, "utf8");
  const blocks: Array<{ file: string; options: string }> = [];
  const callPattern = /\buse(?:Infinite)?Query\(\s*\{/g;

  for (const match of source.matchAll(callPattern)) {
    const braceIndex = source.indexOf("{", match.index ?? 0);
    blocks.push({ file, options: readOptionsObject(source, braceIndex) });
  }

  return blocks;
};

/** İnsan tarafından okunabilir bir etiket: sorgunun queryKey satırı. */
const labelFor = (options: string): string =>
  options.split("\n").find((line) => line.includes("queryKey"))?.trim() ?? options.slice(0, 60);

describe("cadde sorgu tazelik sözleşmesi", () => {
  it("her Cadde sorgusu ya staleTime ya refetchInterval taşır", () => {
    const offenders = caddeQuerySurfaces
      .flatMap(queryOptionBlocks)
      .filter(({ options }) => !options.includes("staleTime") && !options.includes("refetchInterval"))
      .map(({ file, options }) => `${file}: ${labelFor(options)}`);

    expect(offenders).toEqual([]);
  });

  it("taranan her dosyada gerçekten sorgu bulunur (regex bozulursa test boşa geçmesin)", () => {
    for (const file of caddeQuerySurfaces) {
      expect(queryOptionBlocks(file).length, `${file} içinde sorgu bulunamadı`).toBeGreaterThan(0);
    }
  });

  it("global bir QueryClient varsayılanı yerine sayfa bazlı pencere kullanılır", () => {
    // Global default vermek 209 sayfanın tazeleme davranışını sessizce değiştirir.
    // Bu satır değişirse buradaki tüm gerekçe geçersiz kalır — bilerek kilitlendi.
    expect(readFileSync("src/App.tsx", "utf8")).toContain("new QueryClient()");
  });

  it("pencereler artan sırada ve makul aralıkta", () => {
    expect(CADDE_LIST_STALE_MS).toBeGreaterThan(0);
    expect(CADDE_PROMO_STALE_MS).toBeGreaterThan(CADDE_LIST_STALE_MS);
    expect(CADDE_REFERENCE_STALE_MS).toBeGreaterThan(CADDE_PROMO_STALE_MS);
  });
});
