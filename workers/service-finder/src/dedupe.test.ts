import { describe, expect, it } from "vitest";

import { extractDomain, makeDuplicateKey, normalizeUrl } from "./dedupe.js";
import type { CandidateResult } from "./schemas.js";

function makeResult(overrides: Partial<CandidateResult> = {}): CandidateResult {
  return {
    is_match: true,
    match_reason: "test",
    confidence_score: 80,
    canonical_name: "Dr. Test",
    organization_name: null,
    profession_label: "Doktor",
    role_key: "Healthcare_Doctor",
    item_type: "advisor",
    category_slug: null,
    city: "Dortmund",
    country_code: "DE",
    languages: ["tr", "de"],
    services: [],
    contacts: [],
    website_url: null,
    appointment_url: null,
    evidence_quotes: [],
    ...overrides,
  };
}

describe("normalizeUrl", () => {
  it("utm parametrelerini ve fragment'ı atar", () => {
    expect(normalizeUrl("https://example.com/page?utm_source=x&id=5#section")).toBe(
      "https://example.com/page?id=5",
    );
  });

  it("www önekini ve sondaki slash'ı temizler", () => {
    expect(normalizeUrl("https://www.Example.com/doctors/")).toBe("https://example.com/doctors");
  });

  it("kök path / olarak korunur", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("geçersiz URL'de küçük harfe çevrilmiş trim uygulanır", () => {
    expect(normalizeUrl("  NOT-A-URL  ")).toBe("not-a-url");
  });
});

describe("extractDomain", () => {
  it("alan adını www'siz döndürür", () => {
    expect(extractDomain("https://www.praxis-dortmund.de/tr")).toBe("praxis-dortmund.de");
  });

  it("geçersiz URL'de unknown döner", () => {
    expect(extractDomain("foo")).toBe("unknown");
  });
});

describe("makeDuplicateKey", () => {
  it("telefon önceliklidir ve yalnız rakamlar kullanılır", () => {
    const key = makeDuplicateKey(
      makeResult({ contacts: [{ type: "phone", value: "+49 (231) 555-1234" }] }),
    );
    expect(key).toBe("phone:492315551234");
  });

  it("telefon yoksa web alan adı kullanılır", () => {
    const key = makeDuplicateKey(makeResult({ website_url: "https://www.praxis.de/page" }));
    expect(key).toBe("domain:praxis.de");
  });

  it("telefon ve site yoksa isim+şehir kullanılır (Türkçe karakterler ASCII'leşir)", () => {
    const key = makeDuplicateKey(
      makeResult({ canonical_name: "Dr. Özgür Şahin", city: "Köln" }),
    );
    expect(key).toBe("name:dr-ozgur-sahin|city:koln");
  });

  it("aynı sağlayıcının farklı utm'li sayfaları aynı anahtara düşer", () => {
    const a = makeDuplicateKey(makeResult({ website_url: "https://praxis.de/?utm_source=a" }));
    const b = makeDuplicateKey(makeResult({ website_url: "https://www.praxis.de" }));
    expect(a).toBe(b);
  });
});
