// src/pages/admin/muhasebe/butce/RevenuePanel.tsx
// Bütçe sekmesi — platform gelir kalemleri tablosu (adet × birim fiyat × komisyon).

import { CircleDollarSign, Percent, TrendingUp } from 'lucide-react';
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
import { KpiCard } from '@/components/admin/muhasebe/KpiCard';
import { MonthRow } from '@/components/admin/muhasebe/BudgetMonthTable';
import { formatCurrency } from '@/lib/muhasebe-format';
import { revComm, revGross, revNet } from '@/lib/muhasebe-butce-aggregations';
import { BUTCE_MONTHS, makeId, zeroMonths, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

export interface RevenuePanelProps {
  state: ButceYearState;
  onChange: (next: ButceYearState) => void;
}

export function RevenuePanel({ state, onChange }: RevenuePanelProps): JSX.Element {
  const items = state.revenue;

  function updateItem(itemId: string, patch: Partial<(typeof items)[number]>) {
    onChange({ ...state, revenue: items.map((r) => (r.id === itemId ? { ...r, ...patch } : r)) });
  }

  function addItem() {
    onChange({
      ...state,
      revenue: [...items, { id: makeId(), name: 'Yeni gelir kalemi', price: 0, comm: 0, qty: zeroMonths() }],
    });
  }

  function removeItem(itemId: string) {
    onChange({ ...state, revenue: items.filter((r) => r.id !== itemId) });
  }

  let totalGross = 0;
  let totalComm = 0;
  let totalNet = 0;
  for (let m = 0; m < 12; m += 1) {
    totalGross += revGross(state, m);
    totalComm += revComm(state, m);
    totalNet += revNet(state, m);
  }
  const effectiveComm = totalGross > 0 ? (totalComm / totalGross) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Platform Gelirleri</h2>
        <p className="text-sm text-muted-foreground">
          Adet × birim fiyat (USD, KDV hariç net). Komisyon oranı kalem bazında parametriktir.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Yıllık brüt gelir"
          amount={totalGross}
          subtitle="Komisyon kesintisinden önceki toplam gelir"
          icon={TrendingUp}
          currency="USD"
        />
        <KpiCard
          title="Komisyon kesintisi"
          amount={-totalComm}
          subtitle="Ödeme sağlayıcı/pazar yeri komisyonları"
          icon={CircleDollarSign}
          currency="USD"
          tone="negative"
        />
        <KpiCard
          title="Yıllık net gelir"
          amount={totalNet}
          subtitle="Komisyon kesintisi sonrası kalan gelir"
          icon={TrendingUp}
          currency="USD"
        />
        <KpiCard
          title="Efektif komisyon"
          amount={effectiveComm}
          subtitle="Brüt gelire göre ağırlıklı ortalama komisyon"
          icon={Percent}
          displayAsCount
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kalem</TableHead>
              <TableHead className="text-right">Birim fiyat $</TableHead>
              <TableHead className="text-right">Komisyon %</TableHead>
              {BUTCE_MONTHS.map((m) => (
                <TableHead key={m} className="text-right">{m}</TableHead>
              ))}
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => {
              const rowTotal = r.qty.reduce((s, v) => s + v, 0) * r.price;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Input value={r.name} className="h-8 font-medium" onChange={(e) => updateItem(r.id, { name: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      className="h-8 w-20 text-right"
                      value={r.price || ''}
                      onChange={(e) => updateItem(r.id, { price: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      className="h-8 w-20 text-right"
                      value={r.comm || ''}
                      onChange={(e) => updateItem(r.id, { comm: Number(e.target.value) || 0 })}
                    />
                  </TableCell>
                  <MonthRow
                    values={r.qty}
                    ariaLabelPrefix={`${r.name} adet`}
                    onChange={(month, value) => updateItem(r.id, { qty: r.qty.map((v, m) => (m === month ? value : v)) })}
                  />
                  <TableCell className="text-right font-mono">{formatCurrency(rowTotal, 'USD', { showCode: true })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label="Kalemi sil" onClick={() => removeItem(r.id)}>✕</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={addItem}>+ Gelir kalemi ekle</Button>

      <p className="text-xs text-muted-foreground">
        Sponsor gibi tek tutarlı gelirlerde birim fiyatı sözleşme tutarı, adedi 1 olarak girin. Komisyon referansları: Subscription (MoR) ~%7,5 · B2B reklam/sponsor (Stripe) ~%3,5 · Çarşı (Stripe Connect) ~%5.
      </p>
    </div>
  );
}
