// Almanya 2026 Vergi Hesaplama (BMF PAP 2026 / EStG §32a).
// Kaynak: ref101/lib/salary/tax-calculator.ts — hesap mantığı BİREBİR korunmuştur.
// Vergi tabloları 2026 yılına gömülüdür; güncellik bilgilendirme amaçlıdır (yasal tavsiye değil).

import { roundCent } from "@/lib/germany-salary/util";

export interface TaxParams {
  grossMonthly: number;
  taxClass: string;
  kvZusatz: number;
  hasChildren: boolean;
  age23Plus: boolean;
  churchTaxEnabled: boolean;
  state: string;
  childAllowance: number;
  childrenUnder25Count: number;
  insuranceType: "gkv" | "pkv";
  pkvEmployeePremiumMonthly?: number;
  ppvEmployeePremiumMonthly?: number;
}

export interface TaxResult {
  lohnsteuer: number;
  soli: number;
  kirchensteuerBase: number | null;
  source: "pap" | "legacy";
}

// 2026 German Income Tax (Einkommensteuer) — BMF Programmablaufplan 2026 / EStG §32a.
const TAX_2026 = {
  year: 2026,
  grundfreibetrag: 12096, // Bu tutara kadar vergi yok
  zone2End: 17443,
  zone3End: 68480,
  zone4End: 277825,
  soliFreigrenze: 19488, // Yıllık LSt bu değerin altındaysa soli yok (eşli: 38976)
  soliRate: 0.055,
} as const;

/** Yıllık Einkommensteuer (§32a EStG 2026 formülü). */
function calcEinkommensteuer2026(zvE: number): number {
  if (zvE <= TAX_2026.grundfreibetrag) {
    return 0;
  }
  if (zvE <= TAX_2026.zone2End) {
    const y = (zvE - TAX_2026.grundfreibetrag) / 10000;
    return roundCent((922.98 * y + 1400) * y);
  }
  if (zvE <= TAX_2026.zone3End) {
    const z = (zvE - TAX_2026.zone2End) / 10000;
    return roundCent((181.19 * z + 2397) * z + 1025.38);
  }
  if (zvE <= TAX_2026.zone4End) {
    return roundCent(0.42 * zvE - 10637.88);
  }
  return roundCent(0.45 * zvE - 18971.21);
}

/** Vorsorgepauschale tahmini (Steuerklasse 1-4 için sadeleştirilmiş). */
function calcVorsorgepauschale(grossYearly: number, _kvZusatz: number): number {
  const BBG_RV = 8450 * 12; // 101.400 €/yıl (2026)
  const BBG_KV = 5812.5 * 12; // 69.750 €/yıl (2026)

  const rvBasis = Math.min(grossYearly, BBG_RV);
  const rvBeitrag = rvBasis * 0.093;

  const kvBasis = Math.min(grossYearly, BBG_KV);
  const kvBeitrag = kvBasis * 0.12;

  return roundCent(rvBeitrag + kvBeitrag);
}

/** Vergi sınıfına göre aylık Lohnsteuer. */
function calcLohnsteuer(params: { grossMonthly: number; taxClass: string; kvZusatz: number }): number {
  const { grossMonthly, taxClass, kvZusatz } = params;
  const grossYearly = grossMonthly * 12;

  const werbungskosten = 1230;
  const sonderausgaben = 36;
  const vorsorgepauschale = calcVorsorgepauschale(grossYearly, kvZusatz);

  const zvEStandard = grossYearly - werbungskosten - sonderausgaben - vorsorgepauschale;
  const zvENoAllowance = grossYearly - vorsorgepauschale + TAX_2026.grundfreibetrag;

  let lstYearly = 0;
  switch (taxClass) {
    case "1":
    case "4":
      lstYearly = calcEinkommensteuer2026(Math.max(0, zvEStandard));
      break;
    case "2":
      // Tek ebeveyn: ek Entlastungsbetrag (4.260 € baz)
      lstYearly = calcEinkommensteuer2026(Math.max(0, zvEStandard - 4260));
      break;
    case "3":
      // Evli, yüksek gelirli: Splittingtarif
      lstYearly = 2 * calcEinkommensteuer2026(Math.max(0, zvEStandard / 2));
      break;
    case "5":
    case "6":
      lstYearly = calcEinkommensteuer2026(Math.max(0, zvENoAllowance));
      break;
    default:
      lstYearly = calcEinkommensteuer2026(Math.max(0, zvEStandard));
  }

  return roundCent(lstYearly / 12);
}

/** Solidaritätszuschlag. */
function calcSoli(lohnsteuerMonthly: number, taxClass: string): number {
  const lstYearly = lohnsteuerMonthly * 12;
  const freigrenze = taxClass === "3" ? TAX_2026.soliFreigrenze * 2 : TAX_2026.soliFreigrenze;

  if (lstYearly <= freigrenze) {
    return 0;
  }

  const soliYearly = lstYearly * TAX_2026.soliRate;
  const maxSoli = (lstYearly - freigrenze) * 0.119;

  return roundCent(Math.min(soliYearly, maxSoli) / 12);
}

/** Kilise vergisi (Kirchensteuer) — BY/BW %8, diğer eyaletler %9. */
export function calcChurchTax(params: {
  base: number | null;
  lohnsteuer: number;
  state: string;
  enabled: boolean;
}): number {
  const { base, lohnsteuer, state, enabled } = params;
  if (!enabled) return 0;

  const basis = Number.isFinite(base) && base !== null && base > 0 ? base : lohnsteuer;
  if (!basis || basis <= 0) return 0;

  const rate = state === "BY" || state === "BW" ? 0.08 : 0.09;
  return roundCent(basis * rate);
}

/** Vergi hesaplama (legacy fallback). */
export function calcTaxLegacy(params: TaxParams): TaxResult {
  const lohnsteuer = calcLohnsteuer({
    grossMonthly: params.grossMonthly,
    taxClass: params.taxClass,
    kvZusatz: params.kvZusatz,
  });
  const soli = calcSoli(lohnsteuer, params.taxClass);

  return { lohnsteuer, soli, kirchensteuerBase: null, source: "legacy" };
}

/** Ana vergi hesaplama. */
export function calcTax(params: TaxParams): TaxResult {
  return calcTaxLegacy(params);
}
