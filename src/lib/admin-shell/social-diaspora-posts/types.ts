// Admin Panel V2 — Diaspora postları: kayıtların ortak tipleri.
// Parça dosyalar (posts-XX-YY.ts), tema etiketleri (theme-labels.ts) ve
// barrel (../social-diaspora-posts.ts) bu tipleri paylaşır.

export type DiasporaPostTheme =
  | "gurbet"
  | "kimlik"
  | "ulke-dagilimi"
  | "dil"
  | "mutfak"
  | "bayram"
  | "gelenek"
  | "basari"
  | "yeni-gelenler"
  | "isletme"
  | "ogrenci"
  | "networking"
  | "mentorluk"
  | "aidiyet"
  | "geri-donus"
  | "etkinlik"
  | "carsi"
  | "dayanisma"
  | "spor"
  | "teknoloji"
  | "ebeveyn"
  | "tatil"
  | "cadde"
  | "kadin"
  | "kusaklar"
  | "manifesto"
  | "radar"
  | "blog"
  | "referans"
  | "kariyer"
  | "uzaktan-calisma"
  // post-67 zaten `theme: "ambasador"` kullanıyordu ama union'da yoktu; etiket
  // haritası Record<DiasporaPostTheme, string> olduğu için etiketi de eksikti.
  | "ambasador"
  | "yalnizlik";

export type DiasporaPost = {
  /** Benzersiz kimlik ("post-1" ... "post-50"). */
  id: string;
  /** Kaynaklar arası sabit tekil kimlik ("item-1".."item-100") — slot_key ve DB takibi bunu kullanır. */
  globalId: string;
  /** Görünüm sırası (1..50). */
  order: number;
  theme: DiasporaPostTheme;
  /** Post başlığı (numarasız). */
  title: string;
  /** 2 metinsiz İngilizce ChatGPT görsel promptu (aynı temanın 2 farklı kompozisyonu). */
  imagePrompts: string[];
  /** Hazır Türkçe LinkedIn postu (numarasız gövde, emoji dahil). */
  linkedinPost: string;
  /** Hazır Türkçe Instagram postu (kısa, emoji-ağırlıklı, yoğun hashtag bloğu). */
  instagramPost: string;
  /** Hazır Türkçe Reddit postu (soru/tartışma tonu, az emoji, hashtag yok). */
  redditPost: string;
};
