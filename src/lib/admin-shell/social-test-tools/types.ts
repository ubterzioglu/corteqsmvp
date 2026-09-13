// Admin Panel V2 — Test araçları: kayıtların ortak tipleri.
// Parça dosyalar (tools-XX-YY.ts) ve barrel (../social-test-tools.ts) bu
// tipleri paylaşır.

export type SocialTestVariant = {
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};

export type SocialTestTool = {
  /** Benzersiz kimlik ("test-tool-1" ... "test-tool-10"). */
  id: string;
  /** Kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — slot_key ve DB takibi bunu kullanır. */
  globalId: string;
  /** Görünüm sırası (1..10). */
  order: number;
  /** Test aracı adı, ör. "Hangi Ülke Sana Uygun?". */
  name: string;
  /** Aracın kısa açıklaması (HTML .desc metni). */
  description: string;
  /** 3 metin varyantı (A/B/C kopya alternatifleri). */
  variants: SocialTestVariant[];
};
