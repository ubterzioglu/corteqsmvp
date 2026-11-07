// Açıklama / tutar / tarih normalizasyonu

import type { Currency } from "./types.ts";

/** Türkçe karakterleri ASCII'ye indirger ve büyük harfe çevirir. */
export function foldTr(s: string): string {
  return s
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/Ü/g, "U").replace(/ü/g, "u")
    .replace(/Ö/g, "O").replace(/ö/g, "o")
    .replace(/Ç/g, "C").replace(/ç/g, "c")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

// Ödeme aracısı önekleri: "IYZICO/GODADDY", "PAYPAL *ZOOM", "STRIPE* Z.AI", "PADDLE.NET* HIGGSFIELD"
const PROCESSOR_PREFIXES = [
  /^IYZICO\s*[\/*-]\s*/,
  /^IYZ\s*\*\s*/,
  /^PAYPAL\s*\*\s*/,
  /^PP\s*\*\s*/,
  /^STRIPE\s*[\/*-]?\s*/,
  /^PADDLE(\.NET)?\s*\*\s*/,
  /^SQ\s*\*\s*/,
  /^2CO\.COM\s*\*\s*/,
  /^FS\s*\*\s*/,          // FastSpring
  /^GOOGLE\s*\*\s*(?=GOOGLE|CLOUD|ONE|GSUITE|WORKSPACE)/,
];

// Satır sonundaki şehir/ülke kalıntıları ("SAN FRANCISCO US", "DUBLIN IE", "ISTANBUL TR")
const TRAILING_NOISE = [
  /\s+(US|USA|IE|IRL|GB|UK|DE|NL|SG|TR|QA|CA|FR|EE|LU|CY)$/,
  /\s+(SAN FRANCISCO|DUBLIN|ISTANBUL|LONDON|BERLIN|AMSTERDAM|SINGAPORE|DOHA|NEW YORK|WILMINGTON|PALO ALTO|MOUNTAIN VIEW|SEATTLE|KARLSRUHE|DELFT|TALLINN|MINNEAPOLIS)$/,
  /\s+\+?\d[\d\s-]{6,}$/,          // telefon
  /\s+[A-Z]{2}\d{2,}$/,            // referans kodu
  /\s+HTTPS?:\/\/\S+$/,
  /\s+WWW\.\S+$/,
];

/** Kural eşlemesi için kanonik bir açıklama üretir. */
export function normalizeDescription(raw: string): string {
  let s = foldTr(raw || "")
    .replace(/[“”"'`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  for (const p of PROCESSOR_PREFIXES) s = s.replace(p, "");
  let prev = "";
  while (prev !== s) {
    prev = s;
    for (const p of TRAILING_NOISE) s = s.replace(p, "").trim();
  }
  return s.replace(/\s{2,}/g, " ").trim();
}

/**
 * Türk ve ABD sayı biçimlerini çözer:
 * "1.199,99" -> 1199.99 · "1,199.99" -> 1199.99 · "25" -> 25 · "-120" -> -120
 * "$1.594,43", "₺54.864,49", "€2,43", "—" -> null
 */
export function parseAmount(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = String(input).trim();
  if (!s || s === "—" || s === "-" || s === "–") return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  s = s.replace(/[₺$€£]|TL|TRY|USD|EUR|GBP|QAR|\s/gi, "");
  if (s.startsWith("-")) { neg = !neg; s = s.slice(1); }
  if (s.endsWith("-")) { neg = !neg; s = s.slice(0, -1); }   // bazı ekstreler "25,00-" yazar
  if (/[+]$/.test(s)) s = s.slice(0, -1);
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // hangisi sondaysa ondalık ayırıcı odur
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // sadece virgül: TR biçimi -> ondalık ("19,19", "2,43")
    s = s.replace(",", ".");
  } else if (lastDot > -1) {
    // sadece nokta: "1.199" TR binlik, "2.77" ondalık
    const parts = s.split(".");
    const dec = parts[parts.length - 1].length;
    if (parts.length > 2 || (dec === 3 && parts[0].length <= 3 && parts[0] !== "0")) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/** "07.12.2025", "07/12/2025", "2025-12-07", "07.12.25" -> "2025-12-07" */
export function parseDate(input: string): string | null {
  const s = (input || "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

export function parseCurrency(input: string | null | undefined): Currency | null {
  const s = foldTr(input || "").trim();
  if (!s) return null;
  if (["TL", "TRY", "₺"].includes(s) || s.includes("TL")) return "TRY";
  if (s.includes("USD") || s === "$" || s.includes("DOLAR")) return "USD";
  if (s.includes("EUR") || s === "€" || s.includes("AVRO") || s.includes("EURO")) return "EUR";
  if (s.includes("GBP") || s === "£" || s.includes("STERLIN")) return "GBP";
  if (s.includes("QAR") || s.includes("RIYAL")) return "QAR";
  return null;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Basit token-tabanlı benzerlik (0..1), mükerrer tespiti için. */
export function similarity(a: string, b: string): number {
  const ta = new Set(normalizeDescription(a).split(/[^A-Z0-9]+/).filter((t) => t.length > 1));
  const tb = new Set(normalizeDescription(b).split(/[^A-Z0-9]+/).filter((t) => t.length > 1));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.min(ta.size, tb.size);
}
