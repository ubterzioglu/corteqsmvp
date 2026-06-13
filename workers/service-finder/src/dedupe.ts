import type { CandidateResult } from "./schemas.js";

/** URL'i job içi tekilleştirme için normalize eder. */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    url.hash = "";
    const dropParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref"];
    for (const param of dropParams) url.searchParams.delete(param);
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let pathname = url.pathname.replace(/\/+$/, "");
    if (pathname === "") pathname = "/";
    const search = url.searchParams.toString();
    return `${url.protocol}//${url.hostname}${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

export function extractDomain(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/** ASCII-slug — duplicate key üretiminde kullanılır (görüntüleme amaçlı DEĞİL). */
function asciiSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Aday tekilleştirme anahtarı: telefon > web alan adı > isim+şehir.
 * service_finder_candidates.unique(job_id, duplicate_key) ile birlikte çalışır.
 */
export function makeDuplicateKey(result: CandidateResult): string {
  const phone = result.contacts.find((contact) => contact.type === "phone")?.value;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 6) return `phone:${digits}`;
  }
  const website = result.website_url ?? result.contacts.find((contact) => contact.type === "website")?.value;
  if (website) {
    const domain = extractDomain(website);
    if (domain !== "unknown") return `domain:${domain}`;
  }
  const name = asciiSlug(result.canonical_name ?? "");
  const city = asciiSlug(result.city ?? "");
  return `name:${name}|city:${city}`;
}
