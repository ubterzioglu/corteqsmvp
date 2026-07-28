// src/lib/muhasebe-butce-aggregations.test.ts
import { describe, expect, it } from 'vitest';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';
import {
  allocUSD,
  averageMonthlyBurn,
  consolidatedMonthlyNet,
  cumulativeCash,
  deptActualUSD,
  deptPlanUSD,
  departmentTotals,
  fxRate,
  revComm,
  revGross,
  revNet,
  runwayMonthsIndex,
} from '@/lib/muhasebe-butce-aggregations';

function withTechPlan(base: ButceYearState, month: number, usdAmount: number): ButceYearState {
  return {
    ...base,
    expenses: {
      ...base.expenses,
      tech: base.expenses.tech.map((item, idx) =>
        idx === 0
          ? { ...item, plan: item.plan.map((v, m) => (m === month ? usdAmount : v)) }
          : item,
      ),
    },
  };
}

describe('muhasebe-butce-aggregations', () => {
  it('fxRate returns 1 for USD and the configured rate for EUR/TRY', () => {
    const state = seedYear();
    expect(fxRate(state, 'USD')).toBe(1);
    expect(fxRate(state, 'EUR')).toBe(1.08);
    expect(fxRate(state, 'TRY')).toBe(0.024);
  });

  it('deptPlanUSD sums plan amounts converted to USD for a given month', () => {
    const state = withTechPlan(seedYear(), 0, 100);
    expect(deptPlanUSD(state, 'tech', 0)).toBe(100);
    expect(deptPlanUSD(state, 'tech', 1)).toBe(0);
  });

  it('deptActualUSD mirrors deptPlanUSD for the actual column', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      expenses: {
        ...base.expenses,
        tech: base.expenses.tech.map((item, idx) =>
          idx === 0 ? { ...item, actual: item.actual.map((v, m) => (m === 2 ? 50 : v)) } : item,
        ),
      },
    };
    expect(deptActualUSD(state, 'tech', 2)).toBe(50);
  });

  it('revGross/revComm/revNet compute gross, commission, and net revenue for a month', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) =>
        idx === 0 ? { ...r, price: 5, comm: 10, qty: r.qty.map((v, m) => (m === 0 ? 20 : v)) } : r,
      ),
    };
    expect(revGross(state, 0)).toBe(100);
    expect(revComm(state, 0)).toBe(10);
    expect(revNet(state, 0)).toBe(90);
  });

  it('allocUSD returns fixed amount in fixed mode', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      alloc: {
        ...base.alloc,
        tech: { mode: 'fixed', fixed: base.alloc.tech.fixed.map((v, m) => (m === 0 ? 500 : v)), pct: 0 },
      },
    };
    expect(allocUSD(state, 'tech', 0)).toBe(500);
  });

  it('allocUSD returns a percentage of net revenue in pct mode', () => {
    const base = seedYear();
    const withRevenue: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) =>
        idx === 0 ? { ...r, price: 10, comm: 0, qty: r.qty.map((v, m) => (m === 0 ? 100 : v)) } : r,
      ),
    };
    const state: ButceYearState = {
      ...withRevenue,
      alloc: { ...withRevenue.alloc, tech: { mode: 'pct', fixed: withRevenue.alloc.tech.fixed, pct: 20 } },
    };
    expect(allocUSD(state, 'tech', 0)).toBe(200);
  });

  it('departmentTotals sums alloc/plan/actual/remaining across all 12 months', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      alloc: { ...base.alloc, tech: { mode: 'fixed', fixed: Array(12).fill(100), pct: 0 } },
      expenses: {
        ...base.expenses,
        tech: base.expenses.tech.map((item, idx) =>
          idx === 0 ? { ...item, actual: Array(12).fill(30) } : item,
        ),
      },
    };
    const totals = departmentTotals(state, 'tech');
    expect(totals.alloc).toBe(1200);
    expect(totals.actual).toBe(360);
    expect(totals.remaining).toBe(840);
  });

  it('consolidatedMonthlyNet is net revenue minus total department spend per month', () => {
    const state = seedYear();
    const net = consolidatedMonthlyNet(state);
    expect(net).toHaveLength(12);
    expect(net.every((v) => v === 0)).toBe(true);
  });

  it('cumulativeCash accumulates opening balance plus monthly net', () => {
    const base = seedYear();
    const state: ButceYearState = { ...base, opening: 1000 };
    const cum = cumulativeCash(state);
    expect(cum).toHaveLength(12);
    expect(cum[0]).toBe(1000);
    expect(cum[11]).toBe(1000);
  });

  it('runwayMonthsIndex returns -1 when cumulative cash never goes negative', () => {
    expect(runwayMonthsIndex(Array(12).fill(100))).toBe(-1);
  });

  it('runwayMonthsIndex returns the first negative month index', () => {
    expect(runwayMonthsIndex([100, 50, -10, -20])).toBe(2);
  });

  it('averageMonthlyBurn averages the absolute value of negative months only', () => {
    expect(averageMonthlyBurn([100, -50, -150, 30])).toBe(100);
    expect(averageMonthlyBurn([10, 20, 30])).toBe(0);
  });
});
