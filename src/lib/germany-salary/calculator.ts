// Almanya Maaş Hesaplama — ana fonksiyonlar (Brüt↔Net).
// Kaynak: ref101/lib/salary/calculator.ts — hesap mantığı BİREBİR korunmuştur.
// Netten brüte: ikili arama (binary search) ile hedef nete ulaşan brütü bulur.

import { calcCompanyCarBenefit } from "@/lib/germany-salary/company-car";
import { calcSocialInsurance, type SocialInsuranceParams } from "@/lib/germany-salary/social-insurance";
import { calcChurchTax, calcTax, type TaxParams } from "@/lib/germany-salary/tax-calculator";
import type { SalaryInput, SalaryPeriod, SalaryResult } from "@/lib/germany-salary/types";
import { clampNonNegative, roundCent } from "@/lib/germany-salary/util";

function toMonthly(amount: number, period: SalaryPeriod): number {
  return period === "yearly" ? amount / 12 : amount;
}

/** Brütten neti hesapla (tüm kesintiler + şirket aracı menfaati). */
function netFromGross(
  grossMonthly: number,
  input: SalaryInput,
): Omit<SalaryResult, "grossMonthly" | "grossYearly"> {
  const companyCarBenefit = calcCompanyCarBenefit(
    input.companyCar ?? {
      enabled: false,
      listPrice: 0,
      rate: 0,
      commuteEnabled: false,
      commuteKm: 0,
      commuteMode: "monthly",
      commuteDays: 0,
    },
  );

  const taxableGross = roundCent(grossMonthly + companyCarBenefit);

  const socialParams: SocialInsuranceParams = {
    grossMonthly: taxableGross,
    kvBase: input.kvBase,
    kvZusatz: input.kvZusatz,
    hasChildren: input.hasChildren,
    state: input.state,
    age23Plus: input.age23Plus,
    childrenUnder25Count: input.childrenUnder25Count,
  };

  const social = calcSocialInsurance(socialParams);

  // PKV override (özel sağlık sigortası primi sabit girilir).
  let kv = social.kv;
  let pv = social.pv;
  if (input.insuranceType === "pkv") {
    kv = clampNonNegative(input.pkvPremium);
    pv = clampNonNegative(input.ppvPremium);
  }

  const taxParams: TaxParams = {
    grossMonthly: taxableGross,
    taxClass: input.taxClass,
    kvZusatz: input.kvZusatz,
    hasChildren: input.hasChildren,
    age23Plus: input.age23Plus,
    churchTaxEnabled: input.churchTax,
    state: input.state,
    childAllowance: input.childAllowance,
    childrenUnder25Count: input.childrenUnder25Count,
    insuranceType: input.insuranceType,
    pkvEmployeePremiumMonthly: input.pkvPremium,
    ppvEmployeePremiumMonthly: input.ppvPremium,
  };

  const tax = calcTax(taxParams);

  const kirchensteuer = calcChurchTax({
    base: tax.kirchensteuerBase,
    lohnsteuer: tax.lohnsteuer,
    state: input.state,
    enabled: input.churchTax,
  });

  const deductions = roundCent(kv + pv + social.rv + social.av + tax.lohnsteuer + tax.soli + kirchensteuer);
  const net = roundCent(grossMonthly - deductions - companyCarBenefit);

  return {
    netMonthly: net,
    netYearly: roundCent(net * 12),
    deductionsMonthly: deductions,
    deductionsYearly: roundCent(deductions * 12),
    tax,
    social: {
      kv,
      pv,
      rv: social.rv,
      av: social.av,
      total: roundCent(kv + pv + social.rv + social.av),
    },
    kirchensteuer,
    companyCarBenefit,
    taxableGross,
  };
}

/** Hedef net için brütü ikili aramayla bul. */
function findGrossForTargetNet(
  targetNetMonthly: number,
  input: SalaryInput,
): { grossMonthly: number } & Omit<SalaryResult, "grossMonthly" | "grossYearly"> {
  let lo = 0;
  let hi = Math.max(2000, targetNetMonthly * 2.2);

  // Üst sınırı net hedefi karşılayana dek büyüt.
  for (let i = 0; i < 30; i++) {
    const out = netFromGross(hi, { ...input, amount: hi, period: "monthly", type: "gross" });
    if (out.netMonthly >= targetNetMonthly) break;
    hi *= 1.3;
  }

  const EPS = 0.01;
  const MAX_IT = 60;

  let bestGross = hi;
  let bestOut = netFromGross(hi, { ...input, amount: hi, period: "monthly", type: "gross" });

  for (let i = 0; i < MAX_IT; i++) {
    const mid = (lo + hi) / 2;
    const out = netFromGross(mid, { ...input, amount: mid, period: "monthly", type: "gross" });

    if (
      Math.abs(out.netMonthly - targetNetMonthly) < Math.abs(bestOut.netMonthly - targetNetMonthly)
    ) {
      bestGross = mid;
      bestOut = out;
    }

    if (out.netMonthly < targetNetMonthly) lo = mid;
    else hi = mid;

    if (Math.abs(out.netMonthly - targetNetMonthly) <= EPS) break;
  }

  return { grossMonthly: roundCent(bestGross), ...bestOut };
}

/** Ana hesaplama: brütten nete veya netten brüte. */
export function calculateSalary(input: SalaryInput): SalaryResult {
  const amountMonthly = toMonthly(input.amount, input.period);

  if (input.type === "gross") {
    const grossMonthly = roundCent(amountMonthly);
    const result = netFromGross(grossMonthly, input);
    return {
      grossMonthly,
      grossYearly: roundCent(grossMonthly * 12),
      ...result,
    };
  }

  const targetNet = roundCent(amountMonthly);
  const result = findGrossForTargetNet(targetNet, input);
  return {
    grossMonthly: result.grossMonthly,
    grossYearly: roundCent(result.grossMonthly * 12),
    netMonthly: targetNet,
    netYearly: roundCent(targetNet * 12),
    deductionsMonthly: result.deductionsMonthly,
    deductionsYearly: result.deductionsYearly,
    tax: result.tax,
    social: result.social,
    kirchensteuer: result.kirchensteuer,
    companyCarBenefit: result.companyCarBenefit,
    taxableGross: result.taxableGross,
  };
}
