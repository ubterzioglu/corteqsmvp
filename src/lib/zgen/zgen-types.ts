// ZGEN — Nesil Bulucu tipleri. Kaynak: docs/history/... (bkz. zgen-data.ts başlığı).

export interface ZgenGenerationAvatars {
  m: string;
  f: string;
}

export interface ZgenGeneration {
  id: string;
  name: string;
  /** [ilkYıl, sonYıl] — dahil aralık. */
  range: [number, number];
  avatars: ZgenGenerationAvatars;
  avatarAlt: string;
}

export interface ZgenProfile {
  traits: string[];
  vibes: string[];
}

export interface ZgenCompatEntry {
  dos: string[];
  donts: string[];
  joke: string;
}

export interface ZgenData {
  generations: ZgenGeneration[];
  profiles: Record<string, ZgenProfile>;
  /** Yönlü: compat[senin][diğeri] — senin bakış açından diğer kuşakla nasıl geçinilir. */
  compat: Record<string, Record<string, ZgenCompatEntry>>;
}
