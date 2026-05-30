// src/pages/admin/muhasebe/MuhasebeDashboard.tsx
// Ana muhasebe dashboard — çoklu para birimi destekli özet panel

import { useMemo, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Clock,
  CircleDollarSign,
  Receipt,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiCard } from '@/components/admin/muhasebe/KpiCard';
import {
  aggregateCashflowMonthly,
  aggregateExpenseByCategory,
  aggregateExpenseByPerson,
  aggregateKpiSummary,
  getCurrencyTotal,
} from '@/lib/muhasebe-aggregations';
import { formatCurrency } from '@/lib/muhasebe-format';
import { useExpenses, useIncomes } from '@/hooks/useMuhasebe';
import {
  CATEGORY_COLORS,
  CURRENCY_CODES,
  EXPENSE_CATEGORY_LABELS,
  MONTH_LABELS_TR,
  PERSON_LABELS,
  type CurrencyCode,
  type ExpenseCategory,
} from '@/types/muhasebe';

export default function MuhasebeDashboard() {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: incomes = [], isLoading: incomesLoading } = useIncomes();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('TRY');
  const currentYear = new Date().getFullYear();
  const isLoading = expensesLoading || incomesLoading;

  const kpi = useMemo(() => aggregateKpiSummary(expenses, incomes), [expenses, incomes]);

  const personRows = useMemo(
    () => aggregateExpenseByPerson(expenses),
    [expenses],
  );

  const categoryRows = useMemo(
    () =>
      aggregateExpenseByCategory(
        expenses,
        Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[],
      ),
    [expenses],
  );

  const cashflow = useMemo(
    () => aggregateCashflowMonthly(expenses, incomes, currentYear),
    [currentYear, expenses, incomes],
  );

  const chartData = useMemo(
    () =>
      cashflow.map((row) => ({
        month: MONTH_LABELS_TR[row.month_num - 1],
        Gelir: getCurrencyTotal(row.income_by_currency, selectedCurrency),
        Gider: getCurrencyTotal(row.expense_by_currency, selectedCurrency),
        Net: getCurrencyTotal(row.net_by_currency, selectedCurrency),
      })),
    [cashflow, selectedCurrency],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            CorteQS — Finansal Takip Paneli
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Şirket kurulana kadar geçici muhasebe · Burak &amp; Barış
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Toplam Gider"
          subtitle={`Tüm Zamanlar / ${selectedCurrency}`}
          icon={TrendingDown}
          amount={getCurrencyTotal(kpi.total_expense_by_currency, selectedCurrency)}
          currency={selectedCurrency}
          tone="negative"
          isLoading={isLoading}
        />
        <KpiCard
          title="Toplam Gelir"
          subtitle={`Tüm Zamanlar / ${selectedCurrency}`}
          icon={TrendingUp}
          amount={getCurrencyTotal(kpi.total_income_by_currency, selectedCurrency)}
          currency={selectedCurrency}
          tone="positive"
          isLoading={isLoading}
        />
        <KpiCard
          title="Net Pozisyon"
          subtitle={`Gelir − Gider / ${selectedCurrency}`}
          icon={Wallet}
          amount={getCurrencyTotal(kpi.net_by_currency, selectedCurrency)}
          currency={selectedCurrency}
          isLoading={isLoading}
        />
        <KpiCard
          title="Bekleyen Gider"
          subtitle={`Henüz ödenmeyen / ${selectedCurrency}`}
          icon={Clock}
          amount={getCurrencyTotal(kpi.pending_expense_by_currency, selectedCurrency)}
          currency={selectedCurrency}
          tone="warning"
          isLoading={isLoading}
        />
        <KpiCard
          title="Bekleyen Tahsilat"
          subtitle={`Henüz tahsil edilmeyen / ${selectedCurrency}`}
          icon={CircleDollarSign}
          amount={getCurrencyTotal(kpi.pending_income_by_currency, selectedCurrency)}
          currency={selectedCurrency}
          tone="warning"
          isLoading={isLoading}
        />
        <KpiCard
          title="Toplam Kayıt"
          subtitle="Gider + Gelir girişi"
          icon={Receipt}
          amount={kpi.total_records}
          displayAsCount
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Nakit Akışı</CardTitle>
          <CardDescription>
            {currentYear} yılı için {selectedCurrency} işlemleri üzerinden hesaplanmaktadır.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>👤 Kişi Bazlı Giderler</CardTitle>
            <CardDescription>{selectedCurrency} cinsinden toplam ve ödendi durumu</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kişi</TableHead>
                    <TableHead className="text-right">{`Toplam Gider (${selectedCurrency})`}</TableHead>
                    <TableHead className="text-right">Ödendi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personRows.map((row) => (
                    <TableRow key={row.person}>
                      <TableCell className="font-medium">
                        {PERSON_LABELS[row.person]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          getCurrencyTotal(row.total_by_currency, selectedCurrency),
                          selectedCurrency,
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          getCurrencyTotal(row.paid_by_currency, selectedCurrency),
                          selectedCurrency,
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📂 Kategori Bazlı Giderler</CardTitle>
            <CardDescription>{selectedCurrency} cinsinden toplam ve kayıt sayısı</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">{`Toplam (${selectedCurrency})`}</TableHead>
                      <TableHead className="text-right">Kayıt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryRows.map((row, idx) => (
                      <TableRow key={row.category}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                              }}
                            />
                            {EXPENSE_CATEGORY_LABELS[row.category]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(
                            getCurrencyTotal(row.total_by_currency, selectedCurrency),
                            selectedCurrency,
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.record_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        Gider ve Gelir sekmelerine veri girerek bu paneli güncel tutun.
      </p>
    </div>
  );
}
