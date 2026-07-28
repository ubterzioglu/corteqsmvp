import { describe, expect, it } from 'vitest';
import { buildButceCsv } from '@/lib/muhasebe-butce-csv';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

describe('buildButceCsv', () => {
  it('includes a header row with the year and basis', () => {
    const csv = buildButceCsv('2026', seedYear());
    const firstLine = csv.split('\r\n')[0];
    expect(firstLine).toContain('2026');
    expect(firstLine).toContain('Bütçe');
  });

  it('includes one row per revenue item plus commission, net revenue, department, total expense, and net cashflow rows', () => {
    const state = seedYear();
    const csv = buildButceCsv('2026', state);
    const lines = csv.split('\r\n');
    expect(lines.some((l) => l.startsWith('"Subscription (brüt)"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Komisyon kesintisi"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Net gelir"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Teknoloji & Altyapı"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Toplam gider"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Aylık net nakit akışı"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Kümülatif nakit"'))).toBe(true);
  });

  it('escapes double quotes inside item names', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) => (idx === 0 ? { ...r, name: 'Ürün "Pro"' } : r)),
    };
    const csv = buildButceCsv('2026', state);
    expect(csv).toContain('"Ürün ""Pro"" (brüt)"');
  });
});
