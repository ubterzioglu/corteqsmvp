/**
 * Public liste sayfalarının süzme ve filtre-seçeneği mantığı — SAF fonksiyonlar.
 *
 * ⚠️ FİLTRE SEÇENEKLERİ NEDEN `geo_countries`/`geo_cities`'DEN DEĞİL, VERİDEN
 * TÜRETİLİYOR: ikisi de anonime açıktır (ölçüldü 2026-09-20: 251 / 76.880), yani
 * teknik bir engel YOK. Gerekçe başka:
 *   1. Bu sayfalarda bugün 9 (elçi) ve 20 (uzman) kayıt var. 251 ülkelik bir
 *      açılır listede 244 seçenek boş sonuç verir — kullanıcıyı yanıltır.
 *   2. CLAUDE.md'nin belgelediği İKİ KATALOG UYUŞMAZLIĞI sınıfı: üyenin
 *      kaydındaki şehir, katalogda bulunmayabilir. Canlı örnek bizim veri
 *      kümemizde zaten var — `Düsseldorf/Grevenbroich` (tek alanda iki şehir).
 *      Seçenekleri katalogdan alsak bu kaydı HİÇBİR filtre bulamaz; veriden
 *      alınca her kayıt kendi seçeneğini getirir.
 *
 * Türkçe eşleşme/sıralama `text-normalization.ts` üzerinden yapılır — bare
 * `toLowerCase()` Türkçe'de yanlıştır (`"İstanbul".toLowerCase()` sade
 * "istanbul" ile EŞLEŞMEZ).
 */

import { trCompare, trIncludes, trLower, trUpper } from "@/lib/text-normalization";
import type { PublicCatalogRow } from "@/lib/public-catalog-api";
import { roleKeysForGroup, type RoleGroup } from "@/lib/directory-role-groups";

/** Filtre durumu. `"all"` = süzme yok. */
export interface ListingFilterState {
  groupKey: string;
  country: string;
  city: string;
  searchText: string;
}

export const EMPTY_LISTING_FILTER: ListingFilterState = {
  groupKey: "all",
  country: "all",
  city: "all",
  searchText: "",
};

/**
 * Görüntüleme için Türkçe duyarlı baş harf büyütme: `vancouver` → `Vancouver`,
 * `istanbul` → `İstanbul` (bare `toUpperCase()` burada `Istanbul` üretirdi).
 *
 * YALNIZ şehir/ülke gibi YER adlarına uygulanır. Kişi ve kurum adlarına
 * UYGULANMAZ — `Yasin KASIRGA` gibi bilinçli büyük yazımları bozardı.
 */
export function trTitleCasePlace(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .split(/([\s/-]+)/)
    .map((part) => {
      if (/^[\s/-]+$/.test(part) || part.length === 0) return part;
      return trUpper(part.slice(0, 1)) + trLower(part.slice(1));
    })
    .join("");
}

/** Bir satırın metin aramasında taranan alanları. */
const searchableOf = (row: PublicCatalogRow): string[] =>
  [row.title, row.headline, row.description, row.city, row.countryName].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

/**
 * Satırları filtreye göre süzer.
 *
 * Arama ÇOK KELİMELİ ve VE-anlamlıdır: "berlin hukuk" hem berlin hem hukuk
 * içeren kayıtları döner — `search_directory_catalog` RPC'sindeki davranışla
 * aynı, böylece iki yüzey arasında beklenti ayrışmaz.
 */
export function filterListingRows(
  rows: readonly PublicCatalogRow[],
  filter: ListingFilterState,
  groups: readonly RoleGroup[],
): PublicCatalogRow[] {
  const allowedRoleKeys =
    filter.groupKey === "all" ? null : new Set(roleKeysForGroup(groups, filter.groupKey));

  const words = filter.searchText.trim().split(/\s+/).filter(Boolean);

  return rows.filter((row) => {
    if (allowedRoleKeys && (!row.roleKey || !allowedRoleKeys.has(row.roleKey))) return false;
    if (filter.country !== "all" && row.countryName !== filter.country) return false;
    if (filter.city !== "all" && row.city !== filter.city) return false;

    if (words.length > 0) {
      const haystack = searchableOf(row);
      const everyWordMatches = words.every((word) =>
        haystack.some((field) => trIncludes(field, word)),
      );
      if (!everyWordMatches) return false;
    }

    return true;
  });
}

/** Bir filtre açılır listesinin seçeneği; `count` o seçenekteki kayıt sayısı. */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

const toOptions = (
  values: readonly (string | null)[],
  labelOf: (value: string) => string,
): FilterOption[] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelOf(value), count }))
    .sort((left, right) => trCompare(left.label, right.label));
};

/**
 * Mevcut satırlardan ülke seçeneklerini üretir. Ülke seçimi şehir seçeneklerini
 * daraltır; bu yüzden şehirler AYRI fonksiyonda ve seçili ülkeye bağlıdır.
 */
export function deriveCountryOptions(rows: readonly PublicCatalogRow[]): FilterOption[] {
  return toOptions(
    rows.map((row) => row.countryName),
    (value) => value,
  );
}

/** Seçili ülkedeki şehir seçenekleri. `country="all"` ise tüm şehirler. */
export function deriveCityOptions(
  rows: readonly PublicCatalogRow[],
  country: string,
): FilterOption[] {
  const scoped = country === "all" ? rows : rows.filter((row) => row.countryName === country);
  return toOptions(
    scoped.map((row) => row.city),
    trTitleCasePlace,
  );
}

/**
 * Grup sekmelerinin yanında gösterilecek kayıt sayıları.
 * Ülke/şehir/arama süzgeçleri UYGULANMIŞ sayılar döner — sekmede "0" görünen
 * grup, o anki filtrede gerçekten boştur.
 */
export function deriveGroupCounts(
  rows: readonly PublicCatalogRow[],
  filter: ListingFilterState,
  groups: readonly RoleGroup[],
): Map<string, number> {
  const withoutGroup: ListingFilterState = { ...filter, groupKey: "all" };
  const scoped = filterListingRows(rows, withoutGroup, groups);

  const counts = new Map<string, number>([["all", scoped.length]]);
  for (const group of groups) {
    const keys = new Set(group.roles.map((role) => role.key));
    counts.set(group.key, scoped.filter((row) => row.roleKey && keys.has(row.roleKey)).length);
  }
  return counts;
}
