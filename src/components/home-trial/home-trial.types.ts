/**
 * Deneme landing (/landingtrial) için paylaşılan tipler.
 * Vodafone tarzı anlatı sayfasının 7 bölümünü besleyen veri sözleşmeleri.
 */

/** Atlas haritasındaki bir diaspora şehri (coğrafi koordinat + ekran etiketi). */
export interface AtlasCity {
  /** Görünen şehir adı (Türkçe). */
  name: string;
  /** Boylam (-180..180). */
  lng: number;
  /** Enlem (-90..90). */
  lat: number;
  /** Etiket kutusunun düğüme göre yatay hizası (taşmayı önlemek için). */
  align?: "left" | "right";
  /** Etiketin düğüme göre x ofseti (px) — çakışan şehirleri ayırmak için override. */
  labelDx?: number;
  /** Etiketin düğüme göre y ofseti (px) — çakışan şehirleri ayırmak için override. */
  labelDy?: number;
}

/** Atlas üzerinde iki şehir arasında animasyonlu route bağlantısı. */
export type AtlasLink = readonly [fromCityIndex: number, toCityIndex: number];

/** Ekosistem rayındaki tek bir ürün taksonomisi kartı. */
export interface EcosystemCard {
  /** Kart başlığı (örn. "İnsanlar"). */
  title: string;
  /** Tek cümlelik açıklama. */
  description: string;
  /** İç yönlendirme hedefi — yalnızca var olan route'lar. */
  to: string;
  /** Karttaki sessiz CTA metni. */
  cta: string;
  /** lucide-react ikon adı yerine doğrudan ikon bileşeni iletmek için kullanılır. */
  iconKey: EcosystemIconKey;
}

/** Ekosistem kartlarında kullanılan ikon anahtarları (lucide-react eşlemesi bileşende). */
export type EcosystemIconKey =
  | "people"
  | "communities"
  | "organizations"
  | "experts"
  | "businesses"
  | "ambassadors";

/** Kanıt bandındaki tek bir kavramsal/ölçüsel ifade. */
export interface ProofStat {
  /**
   * Sayan değer. Bilinen kavramsal bir üst sınır verildiğinde sayaç animasyonu
   * için sayısal değer; "∞" gibi sembolik ifadeler için null.
   */
  value: number | null;
  /** value null ise gösterilecek sembolik metin (örn. "∞"). */
  display?: string;
  /** Değerin önüne/sonuna eklenen sabit ek (örn. "+", "M+"). */
  suffix?: string;
  /** Açıklayıcı etiket (Türkçe). */
  label: string;
}

/** Hikaye nehrindeki tek bir diaspora hikayesi/kampanya kartı. */
export interface DiasporaStory {
  /** Üst kategori etiketi (örn. "Berlin"). */
  eyebrow: string;
  /** Hikaye başlığı. */
  title: string;
  /** Kısa özet. */
  excerpt: string;
  /** Devamı için yönlendirme hedefi — var olan route. */
  to: string;
}
