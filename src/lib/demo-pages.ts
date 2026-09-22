/**
 * DEMO içerik deseni — TEK KAYNAK.
 *
 * Bazı sayfalar canlıda yayında ama içeriği HENÜZ GERÇEK DEĞİL (örnek ödüller,
 * örnek takvim, örnek başvuru akışı). Ziyaretçi bunu anlamazsa gerçek bir
 * yarışmaya başvurduğunu sanar. Bu dosya "hangi sayfa demo" sorusunun tek
 * cevabıdır; iki görünür işaret buradan beslenir:
 *
 *   1. DÜĞME/KART ROZETİ — `components/common/DemoBadge.tsx`
 *      O sayfaya GÖTÜREN düğmenin sağ üst köşesinde minik "DEMO" etiketi.
 *   2. SAYFA BANDI — `components/common/DemoBanner.tsx`
 *      Sayfaya girince açık beta bandının HEMEN ALTINDA duran uyarı bandı.
 *      SiteHeader bunu rotaya bakarak kendisi çizer; sayfaya kod eklemek
 *      GEREKMEZ — yeni bir demo sayfası eklemek `DEMO_ROUTES`'a bir satırdır.
 *
 * ⚠️ Rozet ile bandı ayrı ayrı elle yazma. İkisi de bu dosyayı okur; aksi halde
 * bir sayfa "demo" bandı taşırken ona giden düğme rozetsiz kalır (bu depoda
 * "aynı bilginin iki yere kopyalanması" sınıfı defalarca sessiz kusur üretti).
 *
 * Bir sayfa GERÇEK içeriğe kavuştuğunda yapılacak TEK iş: satırı buradan silmek.
 */

export interface DemoRoute {
  /** Rota yolu — `App.tsx`'teki `path` ile BİREBİR aynı olmalı. */
  path: string;
  /** Bantta görünen sayfa adı. */
  label: string;
  /** Bu sayfada neyin demo olduğunu tek cümleyle anlatır. */
  note: string;
}

export const DEMO_ROUTES: DemoRoute[] = [
  {
    path: "/campaign/vlogger",
    label: "Vlogger Yarışması",
    note: "Ödüller, takvim ve başvuru akışı örnek verilerle gösteriliyor; yarışma henüz başlamadı.",
  },
  {
    path: "/campaign/blogger",
    label: "Blogger Yarışması",
    note: "Ödüller, takvim ve başvuru akışı örnek verilerle gösteriliyor; yarışma henüz başlamadı.",
  },
  {
    // Ölçüldü 2026-09-20: `Business_*` rollerinde canlıda 25 satırın 25'i de
    // `is_placeholder` — gerçek işletme kaydı SIFIR. Gerçek kayıtlar geldiğinde
    // liste onları kendiliğinden üstte gösterir; o zaman BU SATIR SİLİNİR.
    // ⚠️ `/isletme/:slug` buraya EKLENMEZ: `findDemoRoute` literal yol eşitliği
    // arar, dinamik yol asla eşleşmez. O sayfa `DemoPageBanner` kullanır.
    path: "/businesses",
    label: "İşletmeler",
    note: "Listedeki işletmeler örnektir. Gerçek işletme kayıtları başvurular değerlendirildikçe yayına alınır.",
  },
];

// ⚠️ `/relocation` 22.09'da bu listeden ÇIKARILDI (B27, karar: seçenek A).
// Sayfanın örnek içerik taşıyan üç sekmesi (İş & İşletmeler · Okullar · Hoşgeldin
// Paketi) besleyecek veri kaynağı olmadığı için kaldırıldı — `relocation_jobs` ve
// `relocation_services` canlıda 0 satır, Okullar/Hoşgeldin için tablo hiç yoktu.
// Geriye kalan beş sekme (şehir · servis · bürokrasi · maliyet · belge) GERÇEK veri
// okur, bu yüzden sayfa artık demo değildir. Üç sekme geri gelirse bu satır da geri
// gelmelidir — örnek içerik demo işareti olmadan canlıya çıkmaz.

/** Rozetin ve bandın paylaştığı metinler — çeviri/ton tek yerden değişir. */
export const DEMO_COPY = {
  badge: "DEMO",
  badgeTitle: "Bu sayfanın içeriği şu an demo",
  bannerPrefix: "Demo sayfa:",
  bannerFallbackNote: "Bu sayfadaki içerik örnektir, gerçek veri değildir.",
} as const;

/**
 * Verilen yol bir demo sayfası mı? Sorgu dizesi ve sondaki eğik çizgi yok
 * sayılır — `/campaign/vlogger?ref=x` de `/campaign/vlogger/` de demodur.
 */
export function findDemoRoute(pathname: string): DemoRoute | undefined {
  const normalized = normalizePath(pathname);
  return DEMO_ROUTES.find((route) => normalizePath(route.path) === normalized);
}

export function isDemoRoute(pathname: string): boolean {
  return findDemoRoute(pathname) !== undefined;
}

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0].split("#")[0];
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}
