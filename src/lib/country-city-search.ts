export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/İ/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .replace(/\u00C4/g, "a")
    .replace(/\u00E4/g, "a")
    .replace(/ß/g, "ss")
    .replace(/Ø/g, "o")
    .replace(/ø/g, "o")
    .replace(/\u00C5/g, "a")
    .replace(/\u00E5/g, "a")
    .replace(/Ń/g, "n")
    .replace(/ń/g, "n")
    .replace(/Ł/g, "l")
    .replace(/ł/g, "l");
}

export function filterByQuery(items: string[], query: string): string[] {
  if (!query.trim()) return items;
  const normalized = normalizeSearchText(query);
  return items.filter((item) => normalizeSearchText(item).includes(normalized));
}
