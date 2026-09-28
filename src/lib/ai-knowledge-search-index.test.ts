// `ai_knowledge_search` HNSW indeks kullanımının sözleşme testi.
//
// 27 Eylül 2026'da ölçüldü: indeks 36 MB yer kaplıyordu ama `idx_scan = 0`,
// yani HİÇ kullanılmamıştı. Her arama 4.794 satırı sıralı tarıyordu.
// Tek sebep, mesafe eşiğinin WHERE yan tümcesinde olmasıydı:
//
//   and (d.embedding <=> p_embedding) <= p_max_distance   ← indeksi öldürür
//
// HNSW yalnız `order by <=> ... limit n` desenini hızlandırır. Eşik bir filtre
// koşuluna dönüştüğü anda planlayıcı her satır için mesafeyi hesaplamak zorunda
// kalır ve sıralı taramaya düşer (EXPLAIN ile doğrulandı).
//
// Bu testin kilitlediği şey: eşik ALT SORGUNUN DIŞINDA kalmalı. Birisi "daha
// okunaklı olsun" diye içeri taşırsa test patlar — gevşetmeyin, düzeltin.

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween, sliceFrom } from "@/test/source-slice";

const SQL = readFileSync(
  "supabase/migrations/applied/20260927140000_ai_knowledge_search_index_kullanimi.sql",
  "utf8",
);

/** Fonksiyon gövdesindeki `return query` ile biten ifadeyi çıkarır. */
const body = sliceBetween(SQL, "return query", "end;\n$function$", "ai_knowledge_search gövdesi");

describe("ai_knowledge_search — HNSW indeks deseni", () => {
  it("mesafe sıralamasını limit ile birlikte alt sorguda tutar", () => {
    // `order by ... <=> ... limit` bitişikliği indeksin kullanılma koşuludur.
    expect(body).toMatch(/order by\s+d\.embedding <=> p_embedding\s+limit v_limit/);
  });

  it("mesafe eşiğini alt sorgunun DIŞINDA uygular", () => {
    // Eşik dış sorguda, türetilmiş sütun üzerinden olmalı.
    expect(body).toMatch(/\)\s*s\s*\n\s*where s\.distance <= coalesce\(p_max_distance/);
  });

  it("alt sorgunun WHERE'inde mesafe hesabı YOKTUR", () => {
    const subquery = sliceBetween(body, "from (", "order by");
    // Alt sorgunun filtre bölümünde `<=>` geçerse indeks devre dışı kalır.
    const whereBlock = sliceFrom(subquery, "where", "alt sorgu WHERE bloğu");
    expect(whereBlock).not.toContain("<=>");
  });

  it("kitle filtresi RPC içinde kalır (istemci rol iddiasına güvenilmez)", () => {
    expect(body).toContain("d.audience = any (coalesce(p_audiences");
    expect(SQL).toContain("auth.role() <> 'service_role'");
  });

  it("imza, volatilite ve search_path canlıdakiyle aynı bırakılır", () => {
    // Fark = ikinci bir aşırı yükleme = PostgREST karar veremez.
    expect(SQL).toContain("p_embedding vector,");
    expect(SQL).not.toMatch(/^\s*STABLE\s*$/m);
    expect(SQL).toContain("SET search_path TO 'public'");
  });
});
