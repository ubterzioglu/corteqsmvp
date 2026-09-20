// Relocation içerik — sunum biçimlendirme + gruplama (saf fonksiyonlar).
// Desen: src/lib/muhasebe-format.ts.
//
// Referans Lovable uygulaması tutarları "€800 - €1,500/ay" gibi METİN olarak saklıyordu;
// bu yüzden ne toplanabiliyor ne para birimi değiştirilebiliyordu. Bizde DB sayısal
// tutar tutar, biçimlendirme BURADA yapılır.

import { trCompare } from "@/lib/text-normalization";
import type {
  RelocationCostGroup,
  RelocationCostItemKey,
  RelocationDocumentGroup,
  RelocationLivingCostRow,
  RelocationRequiredDocumentRow,
} from "@/lib/relocation-content-types";

/** Kalemlerin ekranda görünme sırası — sözlük anahtarı değil, yalnız sıralama. */
export const COST_ITEM_ORDER: RelocationCostItemKey[] = [
  "rent",
  "groceries",
  "transport",
  "insurance",
  "utilities",
  "childcare",
];

/**
 * Para biçimlendirme. Türkçe yerel ayar kullanılır (binlik ayırıcı nokta).
 * `toUpperCase()` burada TEKNİK değer üzerindedir (ISO 4217 para kodu) — Türkçe
 * locale kuralı gerekmez (CLAUDE.md "Türkçe Metin Kuralları" md.1 istisnası).
 */
export function formatCostAmount(amount: number | null, currency: string): string {
  if (amount === null || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Bir kalemin aralığını metne çevirir.
 *
 * Tek değer varsa aralık gösterilmez ("1.200 €"), ikisi de varsa aralık kurulur.
 * İkisi de yoksa "—" döner — burada UYDURMA yapılmaz; referans uygulama veri
 * bulunmayan ülkede sessizce Almanya rakamını gösteriyordu, o kusuru taşımıyoruz.
 */
export function formatCostRange(
  row: Pick<RelocationLivingCostRow, "amount_min" | "amount_max" | "currency">,
): string {
  const { amount_min: min, amount_max: max, currency } = row;
  if (min === null && max === null) return "—";
  if (min !== null && max === null) return formatCostAmount(min, currency);
  if (min === null && max !== null) return formatCostAmount(max, currency);
  if (min === max) return formatCostAmount(min, currency);
  return `${formatCostAmount(min, currency)} – ${formatCostAmount(max, currency)}`;
}

/**
 * Hane büyüklüğüne en uygun satırı seçer.
 *
 * Tam eşleşme yoksa, hane büyüklüğünü AŞMAYAN en büyük satır kullanılır (ör. 4 kişilik
 * hane için 1 ve 2 kişilik satır varsa 2 seçilir). Hiçbiri yoksa en küçük satır döner.
 * Katsayıyla çarpma YAPILMAZ — referanstaki `* 1.6` uydurmaydı.
 */
export function pickRowForHousehold(
  rows: RelocationLivingCostRow[],
  householdSize: number,
): RelocationLivingCostRow | null {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => a.household_size - b.household_size);
  const exact = sorted.find((r) => r.household_size === householdSize);
  if (exact) return exact;

  const fitting = sorted.filter((r) => r.household_size <= householdSize);
  if (fitting.length > 0) return fitting[fitting.length - 1];

  return sorted[0];
}

/**
 * Ülke bazında gruplar — çok hedefli taşınma dosyalarında ZORUNLUDUR.
 *
 * `groupCostsByItem` yalnız `item_key`'e göre grupladığı için, hedefte iki ülke
 * varsa (DE + NL) iki ülkenin "kira" satırı aynı gruba düşer ve `pickRowForHousehold`
 * bunlardan YALNIZ BİRİNİ seçer — hangisi olduğu DB sırasına bağlıdır. Sonuç: panelde
 * tek ülkenin rakamı görünür, toplam ona göre çıkar, ama AI bağlamı (ülke|kalem olarak
 * grupluyor) İKİ ülkeyi birden anlatır. Kullanıcı çelişen iki rakam görür.
 * Bu yüzden panel her zaman ülke ülke çizer.
 */
export function groupCostsByCountry(
  rows: RelocationLivingCostRow[],
): Array<{ country_code: string; groups: RelocationCostGroup[]; rows: RelocationLivingCostRow[] }> {
  const byCountry = new Map<string, RelocationLivingCostRow[]>();
  for (const row of rows) {
    const list = byCountry.get(row.country_code);
    if (list) list.push(row);
    else byCountry.set(row.country_code, [row]);
  }

  return [...byCountry.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([country_code, countryRows]) => ({
      country_code,
      groups: groupCostsByItem(countryRows),
      rows: countryRows,
    }));
}

/**
 * Kalem bazında gruplar; COST_ITEM_ORDER sırasını korur, verisi olmayan kalemi atlar.
 *
 * ⚠️ Bu fonksiyon ülke AYRIMI YAPMAZ. Çok ülkeli veri için önce `groupCostsByCountry`
 * ile ayır — yoksa iki ülkenin aynı kalemi tek grupta birleşir.
 */
export function groupCostsByItem(rows: RelocationLivingCostRow[]): RelocationCostGroup[] {
  const byItem = new Map<RelocationCostItemKey, RelocationLivingCostRow[]>();
  for (const row of rows) {
    const list = byItem.get(row.item_key);
    if (list) list.push(row);
    else byItem.set(row.item_key, [row]);
  }

  return COST_ITEM_ORDER.filter((key) => byItem.has(key)).map((key) => ({
    item_key: key,
    rows: byItem.get(key) ?? [],
  }));
}

/**
 * Aylık toplamın alt/üst sınırı. Yalnız `period === "monthly"` satırları toplanır.
 *
 * Karışık para birimi varsa toplama YAPILMAZ (null döner) — kur çevrimi bu katmanın
 * işi değil ve sessiz yanlış toplam, eksik toplamdan kötüdür.
 */
export function sumMonthlyCosts(
  rows: RelocationLivingCostRow[],
): { min: number; max: number; currency: string } | null {
  const monthly = rows.filter((r) => r.period === "monthly");
  if (monthly.length === 0) return null;

  const currencies = new Set(monthly.map((r) => r.currency.toUpperCase()));
  if (currencies.size !== 1) return null;

  let min = 0;
  let max = 0;
  for (const row of monthly) {
    min += row.amount_min ?? row.amount_max ?? 0;
    max += row.amount_max ?? row.amount_min ?? 0;
  }
  return { min, max, currency: [...currencies][0] };
}

/**
 * Belgeleri kategoriye göre gruplar.
 * Kategori adları Türkçe serbest metindir — sıralama `trCompare` ile yapılır,
 * `localeCompare` varsayılanı Türkçe'de yanlış sonuç verir (CLAUDE.md md.1).
 */
export function groupDocumentsByCategory(
  rows: RelocationRequiredDocumentRow[],
): RelocationDocumentGroup[] {
  const byCategory = new Map<string, RelocationRequiredDocumentRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category);
    if (list) list.push(row);
    else byCategory.set(row.category, [row]);
  }

  return [...byCategory.entries()]
    .sort((a, b) => trCompare(a[0], b[0]))
    .map(([category, documents]) => ({
      category,
      documents: [...documents].sort((a, b) => a.sort_order - b.sort_order),
    }));
}

/** Tamamlanma yüzdesi (0..100, tam sayı). Payda 0 ise 0 döner — NaN sızdırmaz. */
export function completionPercent(doneCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((doneCount / totalCount) * 100);
}
