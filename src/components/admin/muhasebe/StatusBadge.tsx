// src/components/admin/muhasebe/StatusBadge.tsx
// Durum badge'i — Ödeme ve Tahsilat durumlarını görsel olarak gösterir

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  EXPENSE_STATUS_LABELS,
  INCOME_STATUS_LABELS,
  type ExpenseStatus,
  type IncomeStatus,
} from '@/types/muhasebe';

type AnyStatus = ExpenseStatus | IncomeStatus;

const STATUS_STYLES: Record<AnyStatus, string> = {
  odendi:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  tahsil_edildi:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  bekliyor:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  iptal:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
};

export function StatusBadge({
  status,
  kind,
}: {
  status: AnyStatus;
  kind: 'expense' | 'income';
}) {
  const label =
    kind === 'expense'
      ? EXPENSE_STATUS_LABELS[status as ExpenseStatus]
      : INCOME_STATUS_LABELS[status as IncomeStatus];

  return (
    <Badge variant="outline" className={cn('font-normal', STATUS_STYLES[status])}>
      {label}
    </Badge>
  );
}
