/**
 * ANONİM ziyaretçiye açık katalog okuma — public liste sayfalarının veri katmanı.
 *
 * ⚠️ NEDEN `search_directory_catalog` RPC'Sİ KULLANILMIYOR (ölçüldü 2026-09-20):
 * O fonksiyon ilk satırında `auth.uid()` null ise `authentication required`
 * (42501) ile PATLAR. `/directory` bu yüzden giriş yapmamış ziyaretçiye içerik
 * DEĞİL, giriş duvarı gösterir. Public bir keşif sayfası bunu yapamaz — arama
 * motorları da anonimdir.
 *
 * Bunun yerine `catalog_items` DOĞRUDAN okunur; tablonun RLS politikası
 * (`catalog_items_public_or_manager_read`, roller `{anon, authenticated}`)
 * `catalog_item_is_publicly_visible(id)` koşuluyla yalnız
 * `status='published' AND visibility='public'` satırlarını verir. Doğrulandı:
 * `set role anon` ile 10 şehir elçisi + 38 uzman satırı okunabildi, `roles`
 * tablosu ise 0 satır döndü (etiketler bu yüzden `directory-role-groups.ts`'te).
 *
 * Buradaki `status`/`visibility` süzgeçleri RLS'i TEKRARLAMAK için değil,
 * `is_placeholder` ve sıralamayla birlikte niyeti açık yazmak için duruyor —
 * RLS tek başına yeterli güvenlik sınırıdır, bu satırlar okunabilirlik içindir.
 */

import { supabase } from "@/integrations/supabase/client";
import { geoCountrySeeds } from "@/data/geoCountries.generated";
import { directoryHrefFor } from "@/lib/catalog-directory";

/** Bir liste kartının ihtiyaç duyduğu alanlar. */
export interface PublicCatalogRow {
  id: string;
  slug: string;
  title: string;
  /** Kısa tanıtım satırı. Ölçüm: şehir elçilerinin 9/9'unda DOLU. */
  headline: string | null;
  /** Uzun açıklama. Ölçüm: şehir elçilerinin hiçbirinde YOK — null bekle. */
  description: string | null;
  roleKey: string | null;
  countryCode: string | null;
  /** `countryCode` → Türkçe ülke adı; eşleşme yoksa kodun kendisi. */
  countryName: string | null;
  city: string | null;
  isVerified: boolean;
  /** Detay sayfası — üye ise profil, değilse katalog öğesi. */
  href: string;
}

type CatalogItemRow = {
  id: string;
  slug: string | null;
  title: string | null;
  headline: string | null;
  short_description: string | null;
  item_type: string | null;
  platform_role_key: string | null;
  country_code: string | null;
  city: string | null;
  is_verified: boolean | null;
};

const SELECT_COLUMNS =
  "id, slug, title, headline, short_description, item_type, platform_role_key, country_code, city, is_verified";

/**
 * PostgREST tek istekte en çok 1000 satır döner ve FAZLASINI SESSİZCE KESER
 * (CLAUDE.md "Değişmez sözleşmeler" md.5). Bugün bu sayfalarda ~20 satır var,
 * ama katalog büyüdüğünde kesilme hata vermeden eksik liste üretir. Sayfa boyu
 * bilinçli olarak 1000'in ALTINDA tutulur ki "tam sayfa geldi → devam et"
 * mantığı çalışsın.
 */
const PAGE_SIZE = 500;

const countryNameByCode = new Map(
  geoCountrySeeds.map((seed) => [seed.code.toUpperCase(), seed.name]),
);

/** `DE` → `Almanya`. Bilinmeyen kod kendisi olarak döner (boş rozet yerine kod). */
export function countryNameOf(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;
  return countryNameByCode.get(trimmed) ?? trimmed;
}

const mapRow = (row: CatalogItemRow): PublicCatalogRow => ({
  id: row.id,
  slug: row.slug ?? "",
  title: row.title ?? "",
  headline: row.headline,
  description: row.short_description,
  roleKey: row.platform_role_key,
  countryCode: row.country_code,
  countryName: countryNameOf(row.country_code),
  city: row.city,
  isVerified: row.is_verified === true,
  href: directoryHrefFor(row.item_type, row.slug ?? ""),
});

/**
 * Verilen rollerdeki, herkese açık ve yayında olan katalog kayıtlarını getirir.
 *
 * Yer tutucular (`is_placeholder`) DIŞARIDA bırakılır: bunlar rol iskeletini
 * kurmak için açılmış boş satırlardır, gerçek kayıt değildir (ölçüm 2026-09-20:
 * 25 `Business_*` satırının 25'i de yer tutucu).
 *
 * Hata durumunda BOŞ dizi döner ve fırlatmaz — bu sayfalar public vitrindir,
 * tek bir sorgu hatası yüzünden beyaz ekran vermemeleri gerekir. Çağıran taraf
 * boş listeyi kendi "kayıt yok" durumuyla karşılar.
 */
export async function listPublicCatalogRows(roleKeys: readonly string[]): Promise<PublicCatalogRow[]> {
  if (roleKeys.length === 0) return [];

  const collected: PublicCatalogRow[] = [];

  for (let page = 0; ; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("catalog_items")
      .select(SELECT_COLUMNS)
      .in("platform_role_key", roleKeys as string[])
      .eq("status", "published")
      .eq("visibility", "public")
      .eq("is_placeholder", false)
      .is("deleted_at", null)
      .order("is_verified", { ascending: false })
      .order("title", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) return collected;

    const rows = (data ?? []) as unknown as CatalogItemRow[];
    collected.push(...rows.filter((row) => row.slug).map(mapRow));

    // Tam sayfa gelmediyse kayıtlar bitti. Bu kontrol olmadan döngü sonsuza gider.
    if (rows.length < PAGE_SIZE) break;
  }

  return collected;
}
