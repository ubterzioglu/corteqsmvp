import { describe, it, expect } from "vitest";

// ── canonicalize-url ────────────────────────────────────────────────────────
// Edge Function'daki mantığın frontend-safe kopyası (aynı algoritma)

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "source",
  "_ga", "msclkid", "twclid", "igshid",
]);

function canonicalizeUrl(rawUrl: string): string | null {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return null; }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const params = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) params.append(key, value);
  }
  const host = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  const query = params.toString();
  return `https://${host}${pathname}${query ? "?" + query : ""}`;
}

// ── hash helpers ────────────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\sÀ-ɏ]/g, "").normalize("NFC");
}

// ── SSRF guard ───────────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^::1$/, /^0\.0\.0\.0$/,
];

function validateSourceUrl(url: string): { ok: boolean; reason?: string } {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return { ok: false, reason: "Geçersiz URL" }; }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: `Engellenen protokol: ${parsed.protocol}` };
  }
  const h = parsed.hostname.toLowerCase();
  for (const p of PRIVATE_IP_PATTERNS) {
    if (p.test(h)) return { ok: false, reason: `Özel IP: ${h}` };
  }
  return { ok: true };
}

// ── relevance score (basit kopya) ──────────────────────────────────────────

function scoreRelevance(title: string): number {
  const t = title.toLowerCase();
  let score = 0;
  if (t.includes("turkish diaspora") || t.includes("türk diasporası")) score += 35;
  if (t.includes("almanya") || t.includes("germany")) score += 25;
  if (t.includes("spor magazin") || t.includes("maç sonucu")) score -= 40;
  return Math.max(0, Math.min(100, score));
}

// ───────────────────────────────────────────────────────────────────────────

describe("canonicalizeUrl", () => {
  it("utm parametrelerini temizler", () => {
    const result = canonicalizeUrl(
      "https://example.com/article?utm_source=twitter&utm_medium=social&id=42"
    );
    expect(result).toBe("https://example.com/article?id=42");
  });

  it("fbclid parametresini kaldırır", () => {
    const result = canonicalizeUrl("https://example.com/page?fbclid=abc123");
    expect(result).toBe("https://example.com/page");
  });

  it("aynı haber farklı tracking URL ile aynı canonical üretir", () => {
    const a = canonicalizeUrl("https://news.site/story?utm_source=a&utm_campaign=b");
    const b = canonicalizeUrl("https://news.site/story?utm_source=x&utm_content=y");
    expect(a).toBe(b);
    expect(a).toBe("https://news.site/story");
  });

  it("gerekli query paramları korur", () => {
    const result = canonicalizeUrl("https://example.com/search?q=diaspora&page=2");
    expect(result).toBe("https://example.com/search?q=diaspora&page=2");
  });

  it("trailing slash kaldırır", () => {
    const result = canonicalizeUrl("https://example.com/article/");
    expect(result).toBe("https://example.com/article");
  });

  it("http'yi https'e yükseltir", () => {
    const result = canonicalizeUrl("http://example.com/article");
    expect(result).toBe("https://example.com/article");
  });

  it("geçersiz protokolü reddeder", () => {
    expect(canonicalizeUrl("ftp://example.com/file")).toBeNull();
    expect(canonicalizeUrl("file:///etc/passwd")).toBeNull();
    expect(canonicalizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("geçersiz URL için null döner", () => {
    expect(canonicalizeUrl("not-a-url")).toBeNull();
    expect(canonicalizeUrl("")).toBeNull();
  });
});

describe("sha256Hex + normalizeTitle", () => {
  it("aynı input aynı hash üretir (deterministic)", async () => {
    const h1 = await sha256Hex("turkish diaspora|GDELT|2026-06-15");
    const h2 = await sha256Hex("turkish diaspora|GDELT|2026-06-15");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("farklı input farklı hash üretir", async () => {
    const h1 = await sha256Hex("haber a|kaynak a|2026-06-15");
    const h2 = await sha256Hex("haber b|kaynak a|2026-06-15");
    expect(h1).not.toBe(h2);
  });

  it("normalizeTitle lowercase, trim, çoklu boşluğu teke indirir", () => {
    expect(normalizeTitle("  TÜRK   Diasporası  ")).toBe("türk diasporası");
    expect(normalizeTitle("Hello   World")).toBe("hello world");
  });

  it("normalizeTitle punctuation temizler", () => {
    const result = normalizeTitle("Breaking: Türk diaspora'sı büyüyor!");
    expect(result).not.toContain("!");
    expect(result).not.toContain(":");
  });
});

describe("validateSourceUrl (SSRF guard)", () => {
  it("geçerli HTTPS URL kabul eder", () => {
    expect(validateSourceUrl("https://api.gdeltproject.org/api/v2/doc/doc").ok).toBe(true);
    expect(validateSourceUrl("https://feeds.example.com/rss").ok).toBe(true);
  });

  it("localhost engeller", () => {
    expect(validateSourceUrl("http://localhost:3000/feed").ok).toBe(false);
    expect(validateSourceUrl("http://localhost/secret").ok).toBe(false);
  });

  it("127.x.x.x engeller", () => {
    expect(validateSourceUrl("http://127.0.0.1/admin").ok).toBe(false);
    expect(validateSourceUrl("http://127.0.0.2/feed").ok).toBe(false);
  });

  it("10.x.x.x iç ağ engeller", () => {
    expect(validateSourceUrl("http://10.0.0.1/data").ok).toBe(false);
    expect(validateSourceUrl("http://10.255.255.255/api").ok).toBe(false);
  });

  it("192.168.x.x engeller", () => {
    expect(validateSourceUrl("http://192.168.1.1/").ok).toBe(false);
  });

  it("169.254.x.x (metadata) engeller", () => {
    expect(validateSourceUrl("http://169.254.169.254/latest/meta-data/").ok).toBe(false);
  });

  it("file:// engeller", () => {
    expect(validateSourceUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("ftp:// engeller", () => {
    expect(validateSourceUrl("ftp://example.com/feed").ok).toBe(false);
  });
});

describe("scoreRelevance", () => {
  it("güçlü diaspora keyword yüksek skor getirir", () => {
    const score = scoreRelevance("Turkish diaspora grows in Germany");
    expect(score).toBeGreaterThanOrEqual(35);
  });

  it("Almanya keyword ek skor getirir", () => {
    const scoreWith = scoreRelevance("Turkish diaspora in Germany");
    const scoreWithout = scoreRelevance("Turkish diaspora in Europe");
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  it("negatif keyword skoru düşürür", () => {
    const score = scoreRelevance("Spor magazin: maç sonucu açıklandı");
    expect(score).toBe(0);
  });

  it("skor 0-100 arasında kalır", () => {
    const scores = [
      scoreRelevance("Turkish diaspora Germany"),
      scoreRelevance("random unrelated content"),
      scoreRelevance("Spor magazin maç sonucu turkish diaspora germany"),
    ];
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it("ilgisiz içerik düşük skor alır", () => {
    const score = scoreRelevance("Weather forecast for tomorrow");
    expect(score).toBeLessThan(20);
  });
});
