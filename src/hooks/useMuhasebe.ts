// src/hooks/useMuhasebe.ts
// React Query hook'ları — muhasebe modülü

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  fetchKpiSummary,
  fetchPersonSummary,
  fetchCategorySummary,
  fetchCashflowMonthly,
} from '@/lib/muhasebe-api';
import type {
  ExpenseInput,
  IncomeInput,
} from '@/types/muhasebe';

// Query keyleri tek yerde toplanır — ileride invalidate etmek kolay olur
export const muhasebeKeys = {
  all: ['muhasebe'] as const,
  expenses: () => [...muhasebeKeys.all, 'expenses'] as const,
  incomes: () => [...muhasebeKeys.all, 'incomes'] as const,
  kpi: () => [...muhasebeKeys.all, 'kpi'] as const,
  byPerson: () => [...muhasebeKeys.all, 'by-person'] as const,
  byCategory: () => [...muhasebeKeys.all, 'by-category'] as const,
  cashflow: (year?: number) =>
    [...muhasebeKeys.all, 'cashflow', year ?? 'all'] as const,
};

/** Tüm muhasebe query'lerini geçersiz kılar (mutation sonrası kullanılır) */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: muhasebeKeys.all });
}

// ---------------------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------------------

export function useExpenses() {
  return useQuery({
    queryKey: muhasebeKeys.expenses(),
    queryFn: fetchExpenses,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gider kaydı eklendi');
    },
    onError: (err: Error) => {
      toast.error('Gider eklenemedi', { description: err.message });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Partial<ExpenseInput> }) =>
      updateExpense(args.id, args.input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gider kaydı güncellendi');
    },
    onError: (err: Error) => {
      toast.error('Gider güncellenemedi', { description: err.message });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gider kaydı silindi');
    },
    onError: (err: Error) => {
      toast.error('Gider silinemedi', { description: err.message });
    },
  });
}

// ---------------------------------------------------------------------
// INCOMES
// ---------------------------------------------------------------------

export function useIncomes() {
  return useQuery({
    queryKey: muhasebeKeys.incomes(),
    queryFn: fetchIncomes,
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IncomeInput) => createIncome(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gelir kaydı eklendi');
    },
    onError: (err: Error) => {
      toast.error('Gelir eklenemedi', { description: err.message });
    },
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: Partial<IncomeInput> }) =>
      updateIncome(args.id, args.input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gelir kaydı güncellendi');
    },
    onError: (err: Error) => {
      toast.error('Gelir güncellenemedi', { description: err.message });
    },
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success('Gelir kaydı silindi');
    },
    onError: (err: Error) => {
      toast.error('Gelir silinemedi', { description: err.message });
    },
  });
}

// ---------------------------------------------------------------------
// DASHBOARD / AGGREGATIONS
// ---------------------------------------------------------------------

export function useKpiSummary() {
  return useQuery({
    queryKey: muhasebeKeys.kpi(),
    queryFn: fetchKpiSummary,
  });
}

export function usePersonSummary() {
  return useQuery({
    queryKey: muhasebeKeys.byPerson(),
    queryFn: fetchPersonSummary,
  });
}

export function useCategorySummary() {
  return useQuery({
    queryKey: muhasebeKeys.byCategory(),
    queryFn: fetchCategorySummary,
  });
}

export function useCashflowMonthly(yearNum?: number) {
  return useQuery({
    queryKey: muhasebeKeys.cashflow(yearNum),
    queryFn: () => fetchCashflowMonthly(yearNum),
  });
}
