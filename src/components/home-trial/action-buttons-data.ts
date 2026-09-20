// Ana sayfa eylem düğmelerinin KATALOĞU — bileşenden ayrı dosyada.
//
// Neden ayrı: bir dosya hem bileşen hem sabit dışa açınca Vite'ın hızlı yenilemesi
// (fast refresh) devre dışı kalıyor ve ESLint bunu uyarı olarak veriyor. Kataloğu
// ayırmak hem uyarıyı kapatır hem de "düğme metinleri nerede" sorusunun tek bir
// cevabı olmasını sağlar.
export interface ActionButtonSpec {
  /** Düğme etiketi — en çok ~17 karakter (bkz. dosya başı, 1. kural). */
  label: string;
  /** Fare/odak ipucunda görünen açıklama. */
  hint: string;
  /** Dolu gradyan — `from`/`to` çifti. */
  gradient: string;
  /** Gölge rengi; gradyanın koyu ucuyla aynı aileden. */
  shadow: string;
  /** Uygulama içi hedef. `onClick` ile birlikte verilmez. */
  to?: string;
  /** Aynı sayfada iş yapan düğmeler için (ör. haritaya kaydır). */
  onClick?: () => void;
  /** Geldiği sayfayı `state.from` ile taşı (SiteHeader'daki desen). */
  carryOrigin?: boolean;
  /**
   * Düğmenin götürdüğü içerik şu an DEMO ise sağ üst köşeye "DEMO" rozeti
   * konur. Kural ve gerekçe: `src/lib/demo-pages.ts` + `DemoBadge.tsx`.
   */
  demo?: boolean;
}

/**
 * Ana sayfadaki "Ağı keşfet" düğmesi — hem hero'da hem kapanış kartında kullanılır,
 * ikisi de aynı bölüme (diaspora atlası) iner. Kapanıştan tıklanınca sayfa yukarı
 * kayar; bu bilinçlidir (kullanıcı kararı, 2026-09-20).
 */
const scrollToAtlas = () => {
  const el = document.getElementById("landingtrial-atlas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/**
 * BİRİNCİL eylemler. Hero ve kapanış kartı aynı havuzdan seçer, böylece iki bölüm
 * arasında renk/metin/ipucu ayrışması olamaz.
 *
 * `join` ile `signup` AYNI hedefe gider; etiketleri bilinçli farklı — sayfanın
 * sonunda okuyan kişi karara daha yakındır ve "ücretsiz" bilgisi orada daha çok
 * iş görür.
 */
export const PRIMARY_ACTIONS = {
  join: {
    to: "/login?mode=signup",
    label: "Ağa Katıl",
    hint: "Ücretsiz üye ol. Profilini oluştur, şehrindeki ağı gör, etkinlik ve grup ekleyebil.",
    gradient: "from-[#00ACC1] to-[#0097A7]",
    shadow: "hsl(var(--glow-teal) / 0.6)",
  },
  signup: {
    to: "/login?mode=signup",
    label: "Ücretsiz Kayıt Ol",
    hint: "Ücretsiz üye ol. Profilini oluştur, şehrindeki ağı gör, etkinlik ve grup ekleyebil.",
    gradient: "from-[#00ACC1] to-[#0097A7]",
    shadow: "hsl(var(--glow-teal) / 0.6)",
  },
  tools: {
    to: "/tools",
    label: "Araçlar!",
    hint: "18 ücretsiz araç: ülke, şehir, maaş ve vize kararların için birkaç soruluk yol haritası. Kayıt gerekmez.",
    gradient: "from-[#F59E0B] to-[#EA580C]",
    shadow: "rgba(234,88,12,0.55)",
  },
  explore: {
    onClick: scrollToAtlas,
    label: "Ağı keşfet",
    hint: "Sayfadaki diaspora haritasına git — hangi ülkede kimler var, ağ nerede yoğunlaşmış gör.",
    gradient: "from-[#34A853] to-[#2F9B4D]",
    shadow: "rgba(52,168,83,0.55)",
  },
  founders: {
    to: "/founders",
    label: "Biz kimiz?",
    hint: "CorteQS'i kimler kurdu, neyi neden yapıyoruz — kurucu ekip ve projenin hikâyesi.",
    gradient: "from-[#334155] to-[#0F172A]",
    shadow: "rgba(15,23,42,0.5)",
  },
} satisfies Record<string, ActionButtonSpec>;

/**
 * Hero ve CTA kartının PAYLAŞTIĞI kısayollar. Renkler logonun kollarından seçildi;
 * birincil düğmeler teal/turuncu/yeşil/lacivert kullandığı için hiçbiri karışmaz.
 *
 * ⚠️ Kampanyalar ve Yarışmalar BİLEREK aynı hedefe (`/campaign`) gider — kullanıcı
 * kararı, 2026-09-20: yarışmalar şimdilik kampanya hub'ının içinde listeleniyor,
 * ayrı bir rota açılmadı. Yarışmalara ayrı bir sayfa geldiğinde yalnız `to`
 * değişecek. Aynı hedefli iki düğme olduğu için renkleri de kardeş tonlardır.
 */
export const SECONDARY_ACTIONS = {
  campaigns: {
    to: "/campaign",
    label: "Kampanyalar",
    hint: "Founding 1000 erken üyelik programı ve yürüyen tüm CorteQS kampanyaları tek sayfada.",
    gradient: "from-[#D97706] to-[#A85B06]",
    shadow: "rgba(168,91,6,0.55)",
  },
  contests: {
    to: "/campaign",
    label: "Yarışmalar",
    hint: "Vlogger ve blogger yarışmaları — ödüller, katılım koşulları ve başvuru adımları. İçerik şu an DEMO.",
    gradient: "from-[#0E9F6E] to-[#047857]",
    shadow: "rgba(4,120,87,0.55)",
    // Her iki yarışma sayfası da DEMO_ROUTES içinde; rozet bu yüzden var.
    demo: true,
  },
  radar: {
    to: "/radar",
    label: "Radar",
    hint: "Diaspora gündeminden derlenen haberler ve rehberler. Kaynaklar her gün taranır, ülke ve dile göre süzülür.",
    gradient: "from-[#2B7FD4] to-[#1B63B0]",
    shadow: "rgba(27,99,176,0.55)",
  },
  groups: {
    to: "/addcom",
    label: "Dijital Gruplar",
    hint: "Şehrine ve ilgi alanına göre WhatsApp, Telegram, LinkedIn ve Discord toplulukları. Kendi grubunu da ücretsiz ekleyebilirsin.",
    gradient: "from-[#6D5BD0] to-[#5442B6]",
    shadow: "rgba(84,66,182,0.55)",
  },
  events: {
    to: "/events",
    label: "Etkinlikler",
    hint: "Yurt dışındaki buluşmalar, atölyeler ve networking akşamları. Kendi etkinliğini duyurmak da ücretsiz.",
    gradient: "from-[#E0559B] to-[#C33C82]",
    shadow: "rgba(195,60,130,0.55)",
  },
  feedback: {
    to: "/feedback",
    label: "Geri Bildirim",
    hint: "Eksik bulduğun, takıldığın ya da eklenmesini istediğin ne varsa yaz. Her mesaj okunur ve yanıtlanır.",
    gradient: "from-[#E4574A] to-[#C63A2D]",
    shadow: "rgba(198,58,45,0.55)",
    carryOrigin: true,
  },
} satisfies Record<string, ActionButtonSpec>;

/**
 * İKİ SATIRLIK DÜZENİN İKİNCİ SATIRI — hero ve kapanış kartı AYNI beşliyi çizer.
 *
 * Birinci satır her bölümün kendi birincil çağrıları + `SECONDARY_ACTIONS.campaigns`
 * olur (hero "Ağa Katıl" ile, kapanış kartı "Ücretsiz Kayıt Ol" ile başlar —
 * tek fark budur). Beşe beş bölme kullanıcı kararıdır, 2026-09-20.
 *
 * ⚠️ Buraya altıncı bir düğme eklemek İKİ bölümü birden üçüncü satıra taşırır.
 * Ölçü: düğme 10rem (160px) + gap 0.625rem (10px) → 5 düğme = 840px; hero
 * `max-w-4xl` (896px), kapanış kartı `max-w-5xl` bölüm içinde ~880px taşır.
 * Eklemeden önce iki sarmalayıcının da genişliğini yeniden hesapla.
 */
export const ACTION_ROW_TWO: ActionButtonSpec[] = [
  SECONDARY_ACTIONS.contests,
  SECONDARY_ACTIONS.radar,
  SECONDARY_ACTIONS.groups,
  SECONDARY_ACTIONS.events,
  SECONDARY_ACTIONS.feedback,
];
