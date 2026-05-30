// src/lib/muhasebe-api.ts
// Supabase CRUD + aggregation çağrıları

import { supabase } from '@/integrations/supabase/client';
import type {
  ExpenseRow,
  ExpenseInput,
  IncomeRow,
  IncomeInput,
  KpiSummary,
  PersonSummary,
  CategorySummary,
  CashflowMonth,
} from '@/types/muhasebe';

// ---------------------------------------------------------------------
// EXPENSES
// ---------------------------------------------------------------------

export async function fetchExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExpenseRow[];
}

export async function createExpense(input: ExpenseInput): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as ExpenseRow;
}

export async function updateExpense(
  id: string,
  input: Partial<ExpenseInput>,
): Promise<ExpenseRow> {
  const { data, error } = await supabase
    .from('expenses')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ExpenseRow;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// INCOMES
// ---------------------------------------------------------------------

export async function fetchIncomes(): Promise<IncomeRow[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .order('income_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as IncomeRow[];
}

export async function createIncome(input: IncomeInput): Promise<IncomeRow> {
  const { data, error } = await supabase
    .from('incomes')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as IncomeRow;
}

export async function updateIncome(
  id: string,
  input: Partial<IncomeInput>,
): Promise<IncomeRow> {
  const { data, error } = await supabase
    .from('incomes')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as IncomeRow;
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// DASHBOARD / VIEWS
// ---------------------------------------------------------------------

export async function fetchKpiSummary(): Promise<KpiSummary> {
  const { data, error } = await supabase
    .from('v_muhasebe_kpi')
    .select('*')
    .single();
  if (error) throw error;
  return data as KpiSummary;
}

export async function fetchPersonSummary(): Promise<PersonSummary[]> {
  const { data, error } = await supabase.from('v_muhasebe_by_person').select('*');
  if (error) throw error;
  return (data ?? []) as PersonSummary[];
}

export async function fetchCategorySummary(): Promise<CategorySummary[]> {
  const { data, error } = await supabase
    .from('v_muhasebe_by_category')
    .select('*');
  if (error) throw error;
  return (data ?? []) as CategorySummary[];
}

export async function fetchCashflowMonthly(
  yearNum?: number,
): Promise<CashflowMonth[]> {
  let q = supabase.from('v_muhasebe_cashflow_monthly').select('*');
  if (yearNum !== undefined) {
    q = q.eq('year_num', yearNum);
  }
  const { data, error } = await q.order('month_num');
  if (error) throw error;
  return (data ?? []) as CashflowMonth[];
}
