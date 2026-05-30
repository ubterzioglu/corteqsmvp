// src/pages/admin/muhasebe/NakitAkisiPage.tsx
// Aylık nakit akışı — seçili para birimi üzerinden pivot görünümü

import { useMemo, useState, Fragment } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useExpenses, useIncomes } from '@/hooks/useMuhasebe';
import { aggregateCashflowMonthly, getCurrencyTotal } from '@/lib/muhasebe-aggregations';
import { formatCurrency } from '@/lib/muhasebe-format';
import { CURRENCY_CODES, MONTH_LABELS_TR, type CurrencyCode } from '@/types/muhasebe';

type RowKey =
  | 'income_by_currency'
  | 'expense_by_currency'
  | 'net_by_currency'
  | 'burak_expense_by_currency'
  | 'baris_expense_by_currency'
  | 'ortak_expense_by_currency'
  | 'expense_paid_by_currency'
  | 'expense_pending_by_currency'
  | 'income_collected_by_currency'
  | 'income_pending_by_currency';

interface RowDef {
  key: RowKey;
  label: string;
  section: 'summary' | 'persons' | 'expense_status' | 'income_status';
  emphasize?: boolean;
}

const ROW_DEFS: RowDef[] = [
  { key: 'income_by_currency', label: 'Toplam Gelir', section: 'summary' },
  { key: 'expense_by_currency', label: 'Toplam Gider', section: 'summary' },
  { key: 'net_by_currency', label: 'Net Nakit Akışı', section: 'summary', emphasize: true },
  { key: 'burak_expense_by_currency', label: 'Burak Giderleri', section: 'persons' },
  { key: 'baris_expense_by_currency', label: 'Barış Giderleri', section: 'persons' },
  { key: 'ortak_expense_by_currency', label: 'Ortak Giderler', section: 'persons' },
  { key: 'expense_paid_by_currency', label: 'Ödendi (Gider)', section: 'expense_status' },
  { key: 'expense_pending_by_currency', label: 'Bekliyor (Gider)', section: 'expense_status' },
  { key: 'income_collected_by_currency', label: 'Tahsil Edildi (Gelir)', section: 'income_status' },
  { key: 'income_pending_by_currency', label: 'Bekliyor (Gelir)', section: 'income_status' },
];

const SECTION_LABELS: Record<RowDef['section'], string | null> = {
  summary: null,
  persons: 'Kişi Bazlı Giderler',
  expense_status: 'Gider Durumu',
  income_status: 'Gelir Durumu',
};

export default function NakitAkisiPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TRY');
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes();
  const isLoading = expensesLoading || incomesLoading;

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);
    return years;
  }, [currentYear]);

  const monthlyData = useMemo(
    () => aggregateCashflowMonthly(expenses, incomes, selectedYear),
    [expenses, incomes, selectedYear],
  );

  const totals = useMemo(() => {
    const t = {} as Record<RowKey, number>;
    ROW_DEFS.forEach((def) => {
      t[def.key] = monthlyData.reduce(
        (sum, month) => sum + getCurrencyTotal(month[def.key], selectedCurrency),
        0,
      );
    });
    return t;
  }, [monthlyData, selectedCurrency]);

  const chartData = useMemo(
    () =>
      monthlyData.map((month) => ({
        month: MONTH_LABELS_TR[month.month_num - 1],
        Gelir: getCurrencyTotal(month.income_by_currency, selectedCurrency),
        Gider: getCurrencyTotal(month.expense_by_currency, selectedCurrency),
        Net: getCurrencyTotal(month.net_by_currency, selectedCurrency),
      })),
    [monthlyData, selectedCurrency],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nakit Akışı</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aylık özet · {selectedCurrency} işlemleri üzerinden hesaplanır
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value as CurrencyCode)}
          >
            <TabsList>
              {CURRENCY_CODES.map((currency) => (
                <TabsTrigger key={currency} value={currency}>
                  {currency}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Trend</CardTitle>
          <CardDescription>
            {selectedYear} yılı için gelir, gider ve net nakit akışı ({selectedCurrency})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[320px] animate-pulse rounded bg-muted" />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('tr-TR', {
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(v as number)
                    }
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(v as number, selectedCurrency)}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="Net"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pivot Tablo</CardTitle>
          <CardDescription>
            {selectedYear} yılı için aylık döküm ({selectedCurrency})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                    Kalem
                  </TableHead>
                  {MONTH_LABELS_TR.map((month) => (
                    <TableHead key={month} className="text-right whitespace-nowrap">
                      {month}
                    </TableHead>
                  ))}
                  <TableHead className="text-right whitespace-nowrap font-bold bg-muted/50">
                    TOPLAM
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROW_DEFS.map((def, idx) => {
                  const sectionLabel = SECTION_LABELS[def.section];
                  const prevSection = idx > 0 ? ROW_DEFS[idx - 1].section : null;
                  const showSectionHeader = sectionLabel && def.section !== prevSection;

                  return (
                    <Fragment key={def.key}>
                      {showSectionHeader && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={14}
                            className="bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2"
                          >
                            {sectionLabel}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className={def.emphasize ? 'font-semibold' : ''}>
                        <TableCell className="sticky left-0 bg-background z-10 whitespace-nowrap">
                          {def.label}
                        </TableCell>
                        {monthlyData.map((month) => {
                          const value = getCurrencyTotal(month[def.key], selectedCurrency);
                          return (
                            <TableCell
                              key={`${def.key}-${month.month_num}`}
                              className="text-right tabular-nums whitespace-nowrap"
                            >
                              {value === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                formatCurrency(value, selectedCurrency, {
                                  minimumFractionDigits: 0,
                                })
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right tabular-nums whitespace-nowrap font-semibold bg-muted/50">
                          {totals[def.key] === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            formatCurrency(totals[def.key], selectedCurrency, {
                              minimumFractionDigits: 0,
                            })
                          )}
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        * Her para birimi yalnızca kendi içinde toplanır; kur dönüşümü uygulanmaz.
      </p>
    </div>
  );
}
