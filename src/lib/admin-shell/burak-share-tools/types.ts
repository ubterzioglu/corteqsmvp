// /admin/social-share-vault "BURAK BURAYA BAK" sekmesi — içerik tipleri.
// Araç kayıtları `tool-01.ts` … `tool-12.ts` dosyalarında; barrel
// `../burak-share-tools.ts` onları sıraya dizer.
//
// DİKKAT — bu klasördeki içe aktarımlarda `.ts` uzantısı bilinçlidir:
// scripts/social-generate/load-tools.mjs barrel'ı Node'un tip-sıyırma kipiyle
// (--experimental-strip-types) DOĞRUDAN import eder ve Node ESM uzantısız göreli
// yol çözmez. (tsconfig.app.json: allowImportingTsExtensions)

export type BurakShareVariant = {
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};

export type BurakShareTool = {
  /** Benzersiz kimlik ("burak-tool-1" ... "burak-tool-12"). */
  id: string;
  /** Kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — slot_key ve DB takibi bunu kullanır. */
  globalId: string;
  /** Görünüm sırası (1..12). */
  order: number;
  /** Test aracı adı, ör. "Hangi Ülke Sana Uygun?". */
  name: string;
  /** Aracın kısa açıklaması (HTML .desc metni). */
  description: string;
  /** 3 metin varyantı (A/B/C kopya alternatifleri). */
  variants: BurakShareVariant[];
};
