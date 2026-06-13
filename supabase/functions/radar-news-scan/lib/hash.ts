export async function sha256Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\sÀ-ɏ]/g, "")
    .normalize("NFC");
}

export async function buildCanonicalUrlHash(canonicalUrl: string): Promise<string> {
  return sha256Hex(canonicalUrl);
}

export async function buildContentHash(
  normalizedTitle: string,
  sourceName: string,
  publishedAt: string | null,
): Promise<string> {
  const day = publishedAt ? publishedAt.slice(0, 10) : "unknown";
  return sha256Hex(`${normalizedTitle}|${sourceName}|${day}`);
}
