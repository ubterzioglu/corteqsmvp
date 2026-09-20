/**
 * İşletmeler sayfasının DEMO kartları — `src/data/mock.ts`'teki `businesses`
 * verisini liste kartı şekline çevirir.
 *
 * ⚠️ NEDEN BU SAYFA TAMAMEN DEMO: ölçüldü 2026-09-20 — `Business_*` rollerinde
 * canlıda **25 satır var ve 25'i de `is_placeholder`**. Yani gerçek işletme
 * kaydı SIFIR. Rol iskeleti kurulmuş, içine hiç işletme girmemiş. Sayfa bu
 * yüzden `DEMO_ROUTES`'ta yer alır ve üstünde kapatılamaz bir bant taşır.
 *
 * Gerçek işletme kayıtları geldiğinde: `PublicListingPage` onları ZATEN
 * gösterir (gerçekler üstte, rozetsiz). Yapılacak tek iş, gerçek kayıt sayısı
 * yeterli olunca bu dosyayı ve `DEMO_ROUTES` satırını kaldırmaktır.
 */

import { businesses } from "@/data/mock";
import type { PublicCatalogRow } from "@/lib/public-catalog-api";

/**
 * ⚠️ GERÇEK MARKALAR LİSTEDEN ÇIKARILIR.
 *
 * `mock.ts`'te "// Loyalty partnerleri" yorumundan sonra gelen kayıtlar gerçek
 * şirketlerdir (HSBC, Türk Hava Yolları, Vodafone ve "Turkish Market Europe").
 * Bunları herkese açık bir sayfada CorteQS listesi gibi göstermek — DEMO rozeti
 * olsa bile — var olmayan bir iş ortaklığı ima eder. Uydurma işletme göstermek
 * ile gerçek bir markayı kendi vitrinine koymak AYNI ŞEY DEĞİLDİR.
 *
 * Gerçek bir ortaklık kurulursa bu kayıtlar demo listesinden değil, gerçek
 * katalogdan (`catalog_items`) gelmelidir.
 */
const EXCLUDED_REAL_BRAND_IDS = new Set([
  "hsbc-turkey",
  "thy-global",
  "vodafone-de",
  "turkish-market-chain",
]);

/**
 * mock `sector` → canlı `Business_*` rol anahtarı.
 *
 * Eşleşmeyen sektör kartı DÜŞÜRÜR (sessizce yanlış role atamaz) — bu yüzden
 * `business-demo-rows.test.ts` her mock sektörünün burada karşılığı olduğunu
 * doğrular. `mock.ts`'e yeni sektör eklenirse test düşer, kart sessizce
 * kaybolmaz.
 */
const SECTOR_TO_ROLE_KEY: Record<string, string> = {
  Sağlık: "Business_HealthcareClinic",
  Gastronomi: "Business_RestaurantCafe",
  Teknoloji: "Business_ITSoftware",
  Perakende: "Business_RetailStore",
  İnşaat: "Business_ConstructionRenovation",
  Turizm: "Business_TravelAgency",
  Tekstil: "Business_Wholesale",
  Lojistik: "Business_TransportLogistics",
};

/** Demo işletme kartının detay adresi — `/isletme/:slug`. */
export const businessDemoHref = (id: string): string => `/isletme/${id}`;

/**
 * Listede gösterilecek demo işletmeler.
 *
 * `countryCode` BİLEREK null: mock veri Türkçe ülke ADI taşır (`Almanya`,
 * `Katar`), kod değil. Filtreler `countryName` üzerinden çalıştığı için bu
 * yeterlidir; uydurma bir kod üretmek yanlış veri olurdu.
 */
export const BUSINESS_DEMO_ROWS: readonly PublicCatalogRow[] = businesses
  .filter((business) => !EXCLUDED_REAL_BRAND_IDS.has(business.id))
  .filter((business) => Boolean(SECTOR_TO_ROLE_KEY[business.sector]))
  .map((business) => ({
    id: `demo-${business.id}`,
    slug: business.id,
    title: business.name,
    headline: `${business.sector} · ${business.employees} çalışan · ${business.founded}'ten beri`,
    description: business.description,
    roleKey: SECTOR_TO_ROLE_KEY[business.sector],
    countryCode: null,
    countryName: business.country,
    city: business.city,
    // Demo kayıt "doğrulanmış" görünmemeli — güven rozetini uydurma veriye vermeyiz.
    isVerified: false,
    href: businessDemoHref(business.id),
  }));

/** Detay sayfasının kaynağı — slug ile mock kaydı bulur. */
export function findBusinessDemo(slug: string | undefined) {
  if (!slug) return undefined;
  if (EXCLUDED_REAL_BRAND_IDS.has(slug)) return undefined;
  return businesses.find((business) => business.id === slug);
}

/** Test ve denetim için dışa açılır. */
export const EXCLUDED_REAL_BRAND_ID_LIST = [...EXCLUDED_REAL_BRAND_IDS];
export const KNOWN_BUSINESS_SECTORS = Object.keys(SECTOR_TO_ROLE_KEY);
