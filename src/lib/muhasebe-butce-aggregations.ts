// Muhasebe > Bütçe sekmesi — pure hesaplama fonksiyonları.
// Orijinal prototipteki deptPlanUSD/revNet/allocUSD/runway mantığının
// state mutasyonu içermeyen TS karşılığı.

import { DEPTS } from '@/lib/muhasebe-butce-schemas';
import type { ButceCurrency, ButceYearState, DeptId } from '@/lib/muhasebe-butce-schemas';

function num(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function fxRate(state: ButceYearState, cur: ButceCurrency): number {
  if (cur === 'USD') return 1;
  return num(state.fx[cur]);
}

export function deptPlanUSD(state: ButceYearState, id: DeptId, month: number): number {
  return state.expenses[id].reduce(
    (sum, item) => sum + num(item.plan[month]) * fxRate(state, item.cur),
    0,
  );
}

export function deptActualUSD(state: ButceYearState, id: DeptId, month: number): number {
  return state.expenses[id].reduce(
    (sum, item) => sum + num(item.actual[month]) * fxRate(state, item.cur),
    0,
  );
}

export function revGross(state: ButceYearState, month: number): number {
  return state.revenue.reduce((sum, r) => sum + num(r.qty[month]) * num(r.price), 0);
}

export function revComm(state: ButceYearState, month: number): number {
  return state.revenue.reduce(
    (sum, r) => sum + (num(r.qty[month]) * num(r.price) * num(r.comm)) / 100,
    0,
  );
}

export function revNet(state: ButceYearState, month: number): number {
  return revGross(state, month) - revComm(state, month);
}

export function allocUSD(state: ButceYearState, id: DeptId, month: number): number {
  const alloc = state.alloc[id];
  return alloc.mode === 'pct'
    ? (revNet(state, month) * num(alloc.pct)) / 100
    : num(alloc.fixed[month]);
}

export function departmentTotals(
  state: ButceYearState,
  id: DeptId,
): { alloc: number; plan: number; actual: number; remaining: number } {
  let alloc = 0;
  let plan = 0;
  let actual = 0;
  for (let m = 0; m < 12; m += 1) {
    alloc += allocUSD(state, id, m);
    plan += deptPlanUSD(state, id, m);
    actual += deptActualUSD(state, id, m);
  }
  return { alloc, plan, actual, remaining: alloc - actual };
}

export function consolidatedMonthlyNet(state: ButceYearState): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    const totalDeptSpend = DEPTS.reduce(
      (sum, d) => sum + deptActualExpenseByBasis(state, d.id, m),
      0,
    );
    return revNet(state, m) - totalDeptSpend;
  });
}

function deptActualExpenseByBasis(state: ButceYearState, id: DeptId, month: number): number {
  return state.basis === 'actual' ? deptActualUSD(state, id, month) : deptPlanUSD(state, id, month);
}

export function cumulativeCash(state: ButceYearState): number[] {
  const net = consolidatedMonthlyNet(state);
  let acc = num(state.opening);
  return net.map((v) => {
    acc += v;
    return acc;
  });
}

export function runwayMonthsIndex(cumulative: number[]): number {
  return cumulative.findIndex((v) => v < 0);
}

export function averageMonthlyBurn(monthlyNet: number[]): number {
  const burnMonths = monthlyNet.filter((v) => v < 0);
  if (burnMonths.length === 0) return 0;
  return Math.abs(burnMonths.reduce((sum, v) => sum + v, 0) / burnMonths.length);
}
