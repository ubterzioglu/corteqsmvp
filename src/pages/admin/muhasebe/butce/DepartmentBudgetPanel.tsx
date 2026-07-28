// src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.tsx
// Bütçe sekmesi — bir departmanın gider tablosu, alokasyon ayarı ve özet kartları.

import { Fragment } from 'react';
import { TrendingDown, TrendingUp, Wallet, Scale } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KpiCard } from '@/components/admin/muhasebe/KpiCard';
import { MonthRow } from '@/components/admin/muhasebe/BudgetMonthTable';
import { formatCurrency } from '@/lib/muhasebe-format';
import { departmentTotals } from '@/lib/muhasebe-butce-aggregations';
import {
  BUTCE_CURRENCIES,
  BUTCE_MONTHS,
  DEPTS,
  makeId,
  zeroMonths,
  type ButceCurrency,
  type ButceYearState,
  type DeptId,
} from '@/lib/muhasebe-butce-schemas';

export interface DepartmentBudgetPanelProps {
  deptId: DeptId;
  state: ButceYearState;
  onChange: (next: ButceYearState) => void;
}

export function DepartmentBudgetPanel({ deptId, state, onChange }: DepartmentBudgetPanelProps): JSX.Element {
  const dept = DEPTS.find((d) => d.id === deptId)!;
  const items = state.expenses[deptId];
  const alloc = state.alloc[deptId];
  const totals = departmentTotals(state, deptId);

  function updateItem(itemId: string, patch: Partial<(typeof items)[number]>) {
    onChange({
      ...state,
      expenses: {
        ...state.expenses,
        [deptId]: items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      },
    });
  }

  function addItem() {
    onChange({
      ...state,
      expenses: {
        ...state.expenses,
        [deptId]: [
          ...items,
          { id: makeId(), name: 'Yeni kalem', cur: 'USD' as ButceCurrency, plan: zeroMonths(), actual: zeroMonths() },
        ],
      },
    });
  }

  function removeItem(itemId: string) {
    onChange({
      ...state,
      expenses: { ...state.expenses, [deptId]: items.filter((it) => it.id !== itemId) },
    });
  }

  function setAllocMode(mode: 'fixed' | 'pct') {
    onChange({ ...state, alloc: { ...state.alloc, [deptId]: { ...alloc, mode } } });
  }

  function setAllocPct(pct: number) {
    onChange({ ...state, alloc: { ...state.alloc, [deptId]: { ...alloc, pct } } });
  }

  function setAllocFixedMonth(month: number, value: number) {
    onChange({
      ...state,
      alloc: {
        ...state.alloc,
        [deptId]: { ...alloc, fixed: alloc.fixed.map((v, m) => (m === month ? value : v)) },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{dept.name}</h2>
        <p className="text-sm text-muted-foreground">{dept.sub}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          Bütçe alokasyonu (USD)
        </span>
        <Select value={alloc.mode} onValueChange={(v) => setAllocMode(v as 'fixed' | 'pct')}>
          <SelectTrigger className="w-48" aria-label="Alokasyon modu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Sabit tutar</SelectItem>
            <SelectItem value="pct">Net gelirin %'si</SelectItem>
          </SelectContent>
        </Select>
        {alloc.mode === 'pct' ? (
          <Input
            type="number"
            step="any"
            className="h-8 w-24"
            value={alloc.pct || ''}
            placeholder="%"
            aria-label="Alokasyon yüzdesi"
            onChange={(e) => setAllocPct(Number(e.target.value) || 0)}
          />
        ) : (
          <span className="text-xs text-muted-foreground">aylık tutarlar tabloda ↓</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Yıllık alokasyon"
          amount={totals.alloc}
          subtitle="Departmana ayrılan yıllık bütçe"
          icon={Wallet}
          currency="USD"
          tone="default"
        />
        <KpiCard
          title="Bütçelenen harcama"
          amount={totals.plan}
          subtitle="Planlanan aylık harcamaların toplamı"
          icon={TrendingUp}
          currency="USD"
          tone="default"
        />
        <KpiCard
          title="Gerçekleşen"
          amount={totals.actual}
          subtitle="Fiilen gerçekleşen harcamaların toplamı"
          icon={TrendingDown}
          currency="USD"
          tone="default"
        />
        <KpiCard
          title="Kalan fark"
          amount={totals.remaining}
          subtitle="Alokasyon ile gerçekleşen arasındaki fark"
          icon={Scale}
          currency="USD"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kalem</TableHead>
              <TableHead>Birim</TableHead>
              {BUTCE_MONTHS.map((m) => (
                <TableHead key={m} className="text-right">{m}</TableHead>
              ))}
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const planTotal = item.plan.reduce((s, v) => s + v, 0);
              const actualTotal = item.actual.reduce((s, v) => s + v, 0);
              return (
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell>
                      <Input
                        value={item.name}
                        className="h-8 font-medium"
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={item.cur} onValueChange={(v) => updateItem(item.id, { cur: v as ButceCurrency })}>
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTCE_CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <MonthRow
                      values={item.plan}
                      ariaLabelPrefix={`${item.name} bütçe`}
                      onChange={(month, value) =>
                        updateItem(item.id, { plan: item.plan.map((v, m) => (m === month ? value : v)) })
                      }
                    />
                    <TableCell className="text-right font-mono">{formatCurrency(planTotal, item.cur, { showCode: true })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" aria-label="Kalemi sil" onClick={() => removeItem(item.id)}>
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="text-muted-foreground">
                    <TableCell className="text-xs">gerçekleşen</TableCell>
                    <TableCell />
                    <MonthRow
                      values={item.actual}
                      dashed
                      ariaLabelPrefix={`${item.name} gerçekleşen`}
                      onChange={(month, value) =>
                        updateItem(item.id, { actual: item.actual.map((v, m) => (m === month ? value : v)) })
                      }
                    />
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(actualTotal, item.cur, { showCode: true })}</TableCell>
                    <TableCell />
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={addItem}>+ Kalem ekle</Button>

      <p className="text-xs text-muted-foreground">
        Kur varsayımları Konsolide ekranından yönetilir. Gerçekleşen satırı boşsa fark hesabı yalnız alokasyona göre okunur.
      </p>
    </div>
  );
}
