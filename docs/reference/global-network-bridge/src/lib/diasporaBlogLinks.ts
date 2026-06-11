// Lightweight client-side store for blogger-submitted blog post links.
// These appear in the Medya (CityNews) page under the "Türk Diaspora Medyası" filter.

export interface DiasporaBlogLink {
  id: string;
  url: string;
  title: string;
  author: string;
  city?: string;
  country?: string;
  description?: string;
  createdAt: string;
}

const KEY = "corteqs:diaspora-blog-links";

function read(): DiasporaBlogLink[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiasporaBlogLink[];
    if (!Array.isArray(parsed)) return [];
    // Purge legacy seed entries from older versions
    const cleaned = parsed.filter((b) => !b.id?.startsWith("seed-"));
    if (cleaned.length !== parsed.length) write(cleaned);
    return cleaned;
  } catch {
    return [];
  }
}

function write(items: DiasporaBlogLink[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function getDiasporaBlogLinks(city?: string, country?: string): DiasporaBlogLink[] {
  return read().filter((b) => {
    const cityOk = !city || city === "all" || b.city === city;
    const countryOk = !country || country === "all" || b.country === country;
    return cityOk && countryOk;
  });
}

export function addDiasporaBlogLink(input: Omit<DiasporaBlogLink, "id" | "createdAt">): DiasporaBlogLink {
  const items = read();
  const item: DiasporaBlogLink = {
    ...input,
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  write([item, ...items]);
  return item;
}

export function removeDiasporaBlogLink(id: string) {
  write(read().filter((b) => b.id !== id));
}

export function getDiasporaBlogLinksByAuthor(author: string): DiasporaBlogLink[] {
  return read().filter((b) => b.author === author);
}
