// Almanya Sosyal Sigorta Hesaplama (2026).
// Kaynak: ref101/lib/salary/social-insurance.ts — hesap mantığı BİREBİR korunmuştur.

import { roundCent, safeNumber } from "@/lib/germany-salary/util";

export interface SocialInsuranceParams {
  grossMonthly: number;
  kvBase: number;
  kvZusatz: number;
  hasChildren: boolean;
  state: string;
  age23Plus: boolean;
  childrenUnder25Count: number;
}

export interface SocialInsuranceResult {
  kv: number;
  pv: number;
  rv: number;
  av: number;
  total: number;
  pvEmployeeRate: number;
  pvTotalRate: number;
  childlessSurchargeApplied: boolean;
  pvReductionChildrenCount: number;
}

/** Rentenversicherung + Arbeitslosenversicherung işçi payı. */
function calcRvAv(grossMonthly: number): { rv: number; av: number } {
  const BBG_RV_AV = 8450.0; // 2026 aylık tavan
  const rvEmployeeRate = 0.093;
  const avEmployeeRate = 0.013;
  const rvBaseAmount = Math.min(grossMonthly, BBG_RV_AV);

  return {
    rv: roundCent(rvBaseAmount * rvEmployeeRate),
    av: roundCent(rvBaseAmount * avEmployeeRate),
  };
}

/** Ana sosyal sigorta hesabı (KV/PV/RV/AV işçi payları). */
export function calcSocialInsurance(params: SocialInsuranceParams): SocialInsuranceResult {
  const { grossMonthly, kvBase, kvZusatz, hasChildren, state, age23Plus, childrenUnder25Count } = params;

  const BBG_KV_PV = 5812.5; // 2026 aylık tavan

  const kvBaseRate = Math.max(0, kvBase / 100);
  const kvZusatzRate = Math.max(0, kvZusatz / 100);
  const kvEmployeeRate = (kvBaseRate + kvZusatzRate) / 2;

  const isSaxony = state === "SN";
  const under25 = Math.max(0, Math.floor(safeNumber(childrenUnder25Count, 0)));

  let pvEmployeeRate = isSaxony ? 0.023 : 0.018;
  const childlessSurchargeApplied = Boolean(age23Plus) && !hasChildren;

  if (childlessSurchargeApplied) {
    pvEmployeeRate += 0.006;
  }

  let pvReductionChildrenCount = 0;
  if (under25 >= 2) {
    pvReductionChildrenCount = Math.min(under25, 5) - 1;
    pvEmployeeRate -= pvReductionChildrenCount * 0.0025;
  }
  pvEmployeeRate = Math.max(0, pvEmployeeRate);

  const baseTotalRate = isSaxony ? 0.046 : 0.036;
  const childlessSurchargeTotal = 0.012;
  const reductionPerChildTotal = 0.005;

  let pvTotalRate =
    baseTotalRate +
    (childlessSurchargeApplied ? childlessSurchargeTotal : 0) -
    pvReductionChildrenCount * reductionPerChildTotal;
  pvTotalRate = Math.max(0, pvTotalRate);

  const kvBaseAmount = Math.min(grossMonthly, BBG_KV_PV);

  const kv = roundCent(kvBaseAmount * kvEmployeeRate);
  const pv = roundCent(kvBaseAmount * pvEmployeeRate);
  const rvAv = calcRvAv(grossMonthly);

  return {
    kv,
    pv,
    rv: rvAv.rv,
    av: rvAv.av,
    total: roundCent(kv + pv + rvAv.rv + rvAv.av),
    pvEmployeeRate,
    pvTotalRate,
    childlessSurchargeApplied,
    pvReductionChildrenCount,
  };
}
