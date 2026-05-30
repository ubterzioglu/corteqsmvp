import { describe, expect, it } from 'vitest';

import {
  aggregateCashflowMonthly,
  aggregateExpenseByCategory,
  aggregateExpenseByPerson,
  aggregateKpiSummary,
  getCurrencyTotal,
} from '@/lib/muhasebe-aggregations';
import type { ExpenseRow, IncomeRow } from '@/types/muhasebe';

const expenses: ExpenseRow[] = [
  {
    id: 'exp-1',
    expense_date: '2026-05-01',
    person: 'burak',
    category: 'hosting_sunucu',
    description: 'AWS',
    amount: 100,
    currency: 'USD',
    status: 'odendi',
    payment_method: null,
    invoice_url: null,
    note: null,
    is_virtual_card: false,
    created_at: '',
    updated_at: '',
    created_by: null,
  },
  {
    id: 'exp-2',
    expense_date: '2026-05-15',
    person: 'baris',
    category: 'hosting_sunucu',
    description: 'Hetzner',
    amount: 2000,
    currency: 'TRY',
    status: 'bekliyor',
    payment_method: null,
    invoice_url: null,
    note: null,
    is_virtual_card: false,
    created_at: '',
    updated_at: '',
    created_by: null,
  },
  {
    id: 'exp-3',
    expense_date: '2026-06-02',
    person: 'ortak',
    category: 'pazarlama_reklam',
    description: 'Campaign',
    amount: 50,
    currency: 'EUR',
    status: 'odendi',
    payment_method: null,
    invoice_url: null,
    note: null,
    is_virtual_card: false,
    created_at: '',
    updated_at: '',
    created_by: null,
  },
];

const incomes: IncomeRow[] = [
  {
    id: 'inc-1',
    income_date: '2026-05-03',
    source: 'Pilot',
    category: 'pilot_gelir',
    description: 'Pilot invoice',
    amount: 150,
    currency: 'USD',
    status: 'tahsil_edildi',
    link: null,
    note: null,
    created_at: '',
    updated_at: '',
    created_by: null,
  },
  {
    id: 'inc-2',
    income_date: '2026-05-20',
    source: 'Grant',
    category: 'hibe_grant',
    description: 'Grant tranche',
    amount: 5000,
    currency: 'TRY',
    status: 'bekliyor',
    link: null,
    note: null,
    created_at: '',
    updated_at: '',
    created_by: null,
  },
];

describe('muhasebe aggregation helpers', () => {
  it('separates totals by currency and computes net per currency', () => {
    const summary = aggregateKpiSummary(expenses, incomes);

    expect(summary.total_expense_by_currency.USD).toBe(100);
    expect(summary.total_expense_by_currency.TRY).toBe(2000);
    expect(summary.total_income_by_currency.USD).toBe(150);
    expect(summary.total_income_by_currency.TRY).toBe(5000);
    expect(summary.net_by_currency.USD).toBe(50);
    expect(summary.net_by_currency.TRY).toBe(3000);
    expect(summary.pending_expense_by_currency.TRY).toBe(2000);
    expect(summary.pending_income_by_currency.TRY).toBe(5000);
    expect(summary.total_records).toBe(5);
  });

  it('aggregates expense summaries per person and category for every currency', () => {
    const people = aggregateExpenseByPerson(expenses);
    const categories = aggregateExpenseByCategory(expenses, [
      'hosting_sunucu',
      'pazarlama_reklam',
    ]);

    expect(people.find((row) => row.person === 'burak')?.paid_by_currency.USD).toBe(100);
    expect(people.find((row) => row.person === 'baris')?.pending_by_currency.TRY).toBe(2000);
    expect(categories.find((row) => row.category === 'hosting_sunucu')?.total_by_currency.TRY).toBe(2000);
    expect(categories.find((row) => row.category === 'hosting_sunucu')?.total_by_currency.USD).toBe(100);
    expect(categories.find((row) => row.category === 'pazarlama_reklam')?.total_by_currency.EUR).toBe(50);
  });

  it('builds monthly cashflow for a selected year and keeps currencies isolated', () => {
    const months = aggregateCashflowMonthly(expenses, incomes, 2026);
    const may = months[4];
    const june = months[5];

    expect(getCurrencyTotal(may.income_by_currency, 'USD')).toBe(150);
    expect(getCurrencyTotal(may.expense_by_currency, 'USD')).toBe(100);
    expect(getCurrencyTotal(may.net_by_currency, 'USD')).toBe(50);
    expect(getCurrencyTotal(may.expense_pending_by_currency, 'TRY')).toBe(2000);
    expect(getCurrencyTotal(may.income_pending_by_currency, 'TRY')).toBe(5000);
    expect(getCurrencyTotal(june.expense_by_currency, 'EUR')).toBe(50);
    expect(getCurrencyTotal(june.net_by_currency, 'EUR')).toBe(-50);
  });
});
