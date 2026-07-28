import { describe, expect, it } from 'vitest';
import {
  DEPTS,
  REV_SEEDS,
  butceYearStateSchema,
  seedYear,
  zeroMonths,
} from '@/lib/muhasebe-butce-schemas';

describe('muhasebe-butce-schemas', () => {
  it('zeroMonths returns 12 zeros', () => {
    expect(zeroMonths()).toEqual(Array(12).fill(0));
  });

  it('DEPTS has 4 fixed departments in the original order', () => {
    expect(DEPTS.map((d) => d.id)).toEqual(['tech', 'mkt', 'hr', 'admin']);
  });

  it('REV_SEEDS has 7 revenue seed rows', () => {
    expect(REV_SEEDS).toHaveLength(7);
  });

  it('seedYear produces a schema-valid state with one item list per department', () => {
    const year = seedYear();
    expect(() => butceYearStateSchema.parse(year)).not.toThrow();
    DEPTS.forEach((d) => {
      expect(year.expenses[d.id]).toHaveLength(d.seeds.length);
    });
    expect(year.revenue).toHaveLength(REV_SEEDS.length);
  });

  it('seedYear sets default fx and opening balance', () => {
    const year = seedYear();
    expect(year.fx).toEqual({ EUR: 1.08, TRY: 0.024 });
    expect(year.opening).toBe(0);
    expect(year.basis).toBe('plan');
  });
});
