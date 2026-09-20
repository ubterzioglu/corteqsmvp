/**
 * Public liste sayfalarının (İşletmeler / Uzmanlar / Şehir Elçileri) veri kancası.
 *
 * `listPublicCatalogRows` anonim ziyaretçi için çalışır — giriş GEREKTİRMEZ.
 * Ayrıntı ve ölçüm: `public-catalog-api.ts` dosya başı.
 */

import { useQuery } from "@tanstack/react-query";
import { listPublicCatalogRows, type PublicCatalogRow } from "@/lib/public-catalog-api";

/**
 * Verilen rollerdeki herkese açık kayıtları getirir.
 *
 * `queryKey` rol anahtarlarının SIRALANMIŞ halinden üretilir: çağıran taraf
 * dizi kimliğini her render'da yeniden oluştursa bile (`roleKeysOf(...)` böyle
 * çalışır) önbellek anahtarı sabit kalır, sorgu sonsuz döngüye girmez.
 */
export function usePublicListing(roleKeys: readonly string[]) {
  const normalizedKeys = [...roleKeys].filter(Boolean).sort();

  return useQuery<PublicCatalogRow[]>({
    queryKey: ["public-catalog", normalizedKeys],
    queryFn: () => listPublicCatalogRows(normalizedKeys),
    // Vitrin verisi saatlerce aynı kalır; her odaklanmada yeniden çekmek
    // 1 GB'lık üretim örneğinde gereksiz yük demektir (CLAUDE.md bellek notu).
    staleTime: 1000 * 60 * 10,
    enabled: normalizedKeys.length > 0,
  });
}
