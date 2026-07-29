// Cadde metin ayrıştırma: hashtag + mention.
//
// AYNA SÖZLEŞMESİ (kritik): `normalizeHashtag` burada, `cadde_normalize_tag` SQL'de —
// ikisi AYNI anahtarı üretmek ZORUNDA. Aksi halde "#İstanbul" ile "#istanbul" ayrı
// etiketlere bölünür ve etiket sayfaları parçalanır.
//
// Neden bu kadar hassas: hem JS'in hem PostgreSQL'in varsayılan `lower()`'ı Türkçe'de
// yanlıştır — ikisi de "İ"yi "i + birleşen nokta" (U+0069 U+0307) yapar ve sade "i" ile
// EŞLEŞMEZ. Bu yüzden TS tarafı `trFold` (locale'li lower + NFD + aksan temizliği),
// SQL tarafı `lower(unaccent(...))` kullanır. Denklik canlı DB'ye karşı ölçüldü ve
// cadde-text.test.ts içindeki külliyatta sabitlendi.

import { trFold } from "@/lib/text-normalization";

/** Gövdede hashtag yakalayan desen — Türkçe harfler dahil, 2-32 karakter. */
const HASHTAG_PATTERN = /#([\p{L}\p{N}_]{2,32})/gu;

/** Gövdede mention yakalayan desen. Mention metni görünen ad değil, seçim sırasında eklenen slug'dır. */
const MENTION_PATTERN = /@([\p{L}\p{N}_.-]{2,64})/gu;

/**
 * Etiketi arama/gruplama anahtarına çevirir.
 * SQL karşılığı: `public.cadde_normalize_tag` → `regexp_replace(lower(unaccent(x)), '[^a-z0-9]', '', 'g')`
 */
export function normalizeHashtag(raw: string): string {
  return trFold(raw.replace(/^#/, "")).replace(/[^a-z0-9]/g, "");
}

/**
 * Gövdedeki hashtag'leri sırayla, tekrarsız çıkarır.
 * `display` ilk görülen özgün yazımdır (#İstanbul), `tag` normalize anahtardır (istanbul).
 */
export function extractHashtags(body: string): Array<{ tag: string; display: string }> {
  const seen = new Set<string>();
  const result: Array<{ tag: string; display: string }> = [];
  for (const match of body.matchAll(HASHTAG_PATTERN)) {
    const display = match[1];
    const tag = normalizeHashtag(display);
    // Yalnız noktalama/emoji içeren etiketler normalize sonrası boşalır — atlanır.
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push({ tag, display });
  }
  return result;
}

/** Gövdedeki @mention token'larını tekrarsız çıkarır (hedef çözümü DB'de yapılır). */
export function extractMentionTokens(body: string): string[] {
  const seen = new Set<string>();
  for (const match of body.matchAll(MENTION_PATTERN)) {
    const token = match[1];
    if (!seen.has(token)) seen.add(token);
  }
  return [...seen];
}

/**
 * İmlecin solundaki yarım kalmış @token'ı bulur; yoksa null.
 * Composer'ın autocomplete'i buna bakar — "a@b" gibi e-posta ortasındaki @ mention sayılmaz.
 */
export function activeMentionToken(value: string, caret: number): { token: string; start: number } | null {
  const upToCaret = value.slice(0, caret);
  const at = upToCaret.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && /[\p{L}\p{N}]/u.test(upToCaret[at - 1])) return null;

  const token = upToCaret.slice(at + 1);
  if (/[\s\n]/.test(token)) return null;
  return { token, start: at };
}

export type CaddeBodySegment =
  | { kind: "text"; value: string }
  | { kind: "hashtag"; value: string; tag: string }
  | { kind: "mention"; value: string; token: string };

/**
 * Gövdeyi render edilebilir parçalara böler; hashtag ve mention'lar link olarak
 * işaretlenir. Bilinçli olarak JSX üretmez — saf ve test edilebilir kalsın diye
 * render işi CaddePostBody bileşenine bırakılır.
 */
export function splitCaddeBody(body: string): CaddeBodySegment[] {
  if (!body) return [];

  type Hit = { start: number; end: number; segment: CaddeBodySegment };
  const hits: Hit[] = [];

  for (const match of body.matchAll(HASHTAG_PATTERN)) {
    const tag = normalizeHashtag(match[1]);
    if (!tag) continue;
    hits.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      segment: { kind: "hashtag", value: match[0], tag },
    });
  }

  for (const match of body.matchAll(MENTION_PATTERN)) {
    hits.push({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
      segment: { kind: "mention", value: match[0], token: match[1] },
    });
  }

  hits.sort((left, right) => left.start - right.start);

  const segments: CaddeBodySegment[] = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start < cursor) continue; // örtüşen eşleşme — ilki kazanır
    if (hit.start > cursor) {
      segments.push({ kind: "text", value: body.slice(cursor, hit.start) });
    }
    segments.push(hit.segment);
    cursor = hit.end;
  }
  if (cursor < body.length) {
    segments.push({ kind: "text", value: body.slice(cursor) });
  }
  return segments;
}
