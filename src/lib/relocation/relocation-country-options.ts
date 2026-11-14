// Taşınma sihirbazının ülke seçeneklerini üretir (revizyon 2b1c1960).
//
// Bileşenden AYRI: bir `.tsx` dosyasından bileşen dışı sembol export etmek
// `react-refresh/only-export-components` uyarısı üretir ve lint taban çizgisi 0 problem.

import type { GeoCountry } from "@/lib/geo";
import { trCompare } from "@/lib/text-normalization";

export interface CountryOption {
  code: string;
  label: string;
}

/**
 * ISO kodlarını `geo_countries` adlarıyla etiketler.
 *
 * Sihirbaz eskiden `{ code, label: code }` üretiyordu; ekranda "DE", "GB", "US" yazıyordu.
 * DEĞER hâlâ ISO kodudur — `createMove` sözleşmesi (`moveCreateSchema.target_country_codes`)
 * alpha-2 bekler; değişen yalnız GÖRÜNEN etikettir. Katalogda karşılığı olmayan kod
 * kaybolmaz, kodun kendisi etiket olarak kalır. Sıralama Türkçe'ye göredir.
 */
export function buildCountryOptions(codes: string[], countries: GeoCountry[]): CountryOption[] {
  const nameByCode = new Map(countries.map((country) => [country.code, country.name]));
  const unique = Array.from(new Set(codes.map((code) => code.trim()).filter(Boolean)));
  return unique
    .map((code) => ({ code, label: nameByCode.get(code) ?? code }))
    .sort((left, right) => trCompare(left.label, right.label));
}
