import { loadUserSubcategories } from "@/data/userSubcategories";

/**
 * Interest-based targeting for the individual role.
 *
 * Reads the interests the user picked on their profile (Bireysel İlgi Alanlarım)
 * and exposes helpers to score arbitrary content (feed posts, events, ads)
 * against those interests. Used by Cadde feed, event lists and ad/vitrin
 * placements to surface more relevant items first.
 */

// Map each interest label to keywords/synonyms used for matching against
// free-text content (post bodies, event titles, ad tags, etc.).
const INTEREST_KEYWORDS: Record<string, string[]> = {
  "Networking": ["network", "tanış", "buluşma", "meetup", "bağlantı"],
  "Yeni Geldim": ["yeni geldim", "welcome", "newcomer", "yeni gelen", "ilk gün", "taşındım"],
  "Aile & Çocuk": ["aile", "çocuk", "anne", "baba", "okul", "kreş", "playgroup"],
  "Kariyer & İş": ["kariyer", "iş ilan", "cv", "mülakat", "linkedin", "career", "job"],
  "Girişimcilik": ["girişim", "startup", "yatırım", "founder", "vc", "kurucu"],
  "Eğitim": ["eğitim", "kurs", "üniversite", "öğrenci", "burs", "okul", "workshop"],
  "Teknoloji": ["teknoloji", "tech", "yazılım", "developer", "ai", "yapay zeka", "kod", "saas", "data"],
  "Sanat & Kültür": ["sanat", "kültür", "müze", "sergi", "tiyatro", "konser", "art"],
  "Spor": ["spor", "futbol", "koşu", "fitness", "yoga", "basket", "maraton"],
  "Yemek & Mutfak": ["yemek", "restoran", "mutfak", "kafe", "tarif", "lezzet", "food"],
  "Seyahat": ["seyahat", "gezi", "tatil", "uçuş", "travel", "tur"],
  "Gönüllülük": ["gönüllü", "yardım", "bağış", "volunteer", "dayanışma"],
  "Mentorluk": ["mentor", "rehber", "koç", "danışman", "coach"],
};

export const getUserInterests = (userId?: string | null): string[] => {
  return loadUserSubcategories("individual", userId);
};

const normalize = (s: string) => s.toLocaleLowerCase("tr-TR");

/**
 * Score how well a piece of content matches the user's interests.
 * Returns a non-negative number: 0 = no match.
 * Inputs can be a string (content) or an array of tags — both are accepted.
 */
export const scoreByInterests = (
  content: string | string[] | undefined | null,
  interests: string[],
): number => {
  if (!interests.length || !content) return 0;
  const haystack = normalize(Array.isArray(content) ? content.join(" ") : content);
  let score = 0;
  for (const interest of interests) {
    if (haystack.includes(normalize(interest))) {
      score += 2;
      continue;
    }
    const keys = INTEREST_KEYWORDS[interest] || [];
    for (const k of keys) {
      if (haystack.includes(normalize(k))) {
        score += 1;
        break;
      }
    }
  }
  return score;
};

/**
 * Stable sort: items with a higher interest score come first.
 * Items that don't match preserve their original relative order.
 */
export const sortByInterests = <T>(
  items: T[],
  interests: string[],
  getText: (item: T) => string | string[] | undefined | null,
): T[] => {
  if (!interests.length) return items;
  return items
    .map((item, idx) => ({ item, idx, s: scoreByInterests(getText(item), interests) }))
    .sort((a, b) => (b.s - a.s) || (a.idx - b.idx))
    .map((x) => x.item);
};
