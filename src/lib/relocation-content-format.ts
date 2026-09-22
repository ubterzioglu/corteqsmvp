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
  RelocationCostScope,
  RelocationFxRateRow,
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
 * Kapsam (ülke + şehir) bazında gruplar — çok hedefli taşınma dosyalarında ZORUNLUDUR.
 *
 * `groupCostsByItem` yalnız `item_key`'e göre grupladığı için, hedefte iki ülke
 * varsa (DE + NL) iki ülkenin "kira" satırı aynı gruba düşer ve `pickRowForHousehold`
 * bunlardan YALNIZ BİRİNİ seçer — hangisi olduğu DB sırasına bağlıdır. Sonuç: panelde
 * tek ülkenin rakamı görünür, toplam ona göre çıkar, ama AI bağlamı (ülke|kalem olarak
 * grupluyor) İKİ ülkeyi birden anlatır. Kullanıcı çelişen iki rakam görür.
 *
 * ⚠️ **Aynı kusur şehir ekseninde de vardı ve `city_code` doldurulduğu gün sessizce
 * canlıya çıkardı** (B29, ölçüldü 22.09: 192 satırın 192'sinde `city_code` NULL, yani
 * bugün hiç tetiklenmiyor). Yalnız ülkeye göre gruplansaydı "Berlin kirası" ile
 * "Almanya geneli kira" aynı kutuya düşer, `pickRowForHousehold` `household_size`'a
 * göre birini seçer, eşitlikte DİZİ SIRASINA göre karar verirdi. Hata vermez, test
 * kırılmaz — yalnız yanlış rakam gösterir. Bu yüzden anahtar ülke DEĞİL, **kapsamdır**:
 * `country_code` + `city_code`. Şehir satırı ile ülke geneli satırı ayrı kart çizer.
 *
 * Sıra: önce ülke, sonra kapsam — ülke geneli (`city_code = null`) o ülkenin şehir
 * kapsamlarından ÖNCE gelir, çünkü genel çerçeveyi kırılımdan önce okumak doğaldır.
 */
export function groupCostsByScope(rows: RelocationLivingCostRow[]): RelocationCostScope[] {
  const byScope = new Map<string, RelocationLivingCostRow[]>();
  for (const row of rows) {
    // \u0000 ayırıcı bilinçli: ülke/şehir kodunda geçemez, bu yüzden "TR|X" ile
    // "TR|" + "X" karışamaz.
    const key = `${row.country_code}\u0000${row.city_code ?? ""}`;
    const list = byScope.get(key);
    if (list) list.push(row);
    else byScope.set(key, [row]);
  }

  return [...byScope.values()]
    .map((scopeRows) => ({
      country_code: scopeRows[0].country_code,
      city_code: scopeRows[0].city_code,
      groups: groupCostsByItem(scopeRows),
      rows: scopeRows,
    }))
    .sort((a, b) => {
      const byCountry = a.country_code.localeCompare(b.country_code);
      if (byCountry !== 0) return byCountry;
      if (a.city_code === b.city_code) return 0;
      if (a.city_code === null) return -1;
      if (b.city_code === null) return 1;
      return a.city_code.localeCompare(b.city_code);
    });
}

/**
 * Kalem bazında gruplar; COST_ITEM_ORDER sırasını korur, verisi olmayan kalemi atlar.
 *
 * ⚠️ Bu fonksiyon ülke ya da şehir AYRIMI YAPMAZ. Çok hedefli veri için önce
 * `groupCostsByScope` ile ayır — yoksa iki kapsamın aynı kalemi tek grupta birleşir.
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

/**
 * Saklanan kurlarla tutarı hedef para birimine çevirir (B30).
 *
 * Kurlar tek bir baz para birimine (bugün EUR) göre saklanır, bu yüzden çapraz çevrim
 * baz üzerinden yapılır: `from → baz → to`. Aynı birime çevirmek kimliktir.
 *
 * ⚠️ Kur BULUNAMAZSA `null` döner ve arayüz karşılık GÖSTERMEZ. Yaklaşık bir değer
 * uydurmak ya da eksik kuru 1 kabul etmek, B28'de kapatılan "ölçülmemiş rakama
 * kesinlik havası verme" kusurunun aynısıdır.
 */
export function convertCostAmount(
  amount: number | null,
  from: string,
  to: string,
  rates: RelocationFxRateRow[],
): number | null {
  if (amount === null || !Number.isFinite(amount)) return null;
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) return amount;
  if (rates.length === 0) return null;

  const base = rates[0].base_currency.toUpperCase();
  const rateOf = (currency: string): number | null => {
    if (currency === base) return 1;
    const row = rates.find((r) => r.quote_currency.toUpperCase() === currency);
    return row && Number.isFinite(row.rate) && row.rate > 0 ? row.rate : null;
  };

  const fromRate = rateOf(source);
  const toRate = rateOf(target);
  if (fromRate === null || toRate === null) return null;

  // amount birim `from`; baza böl, hedefle çarp.
  return (amount / fromRate) * toRate;
}

/** Kurların ait olduğu en eski an — "bu karşılık ne kadar taze" sorusunun cevabı. */
export function oldestRateAt(rates: RelocationFxRateRow[]): string | null {
  const times = rates.map((r) => r.rate_at).filter(Boolean).sort();
  return times[0] ?? null;
}
