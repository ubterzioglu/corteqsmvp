// src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.tsx
// Bütçe sekmesi — konsolide nakit akışı, parametreler ve runway özeti.

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/admin/muhasebe/KpiCard';
import { formatCurrency } from '@/lib/muhasebe-format';
import {
  averageMonthlyBurn,
  consolidatedMonthlyNet,
  cumulativeCash,
  deptActualUSD,
  deptPlanUSD,
  revNet,
  runwayMonthsIndex,
} from '@/lib/muhasebe-butce-aggregations';
import { BUTCE_MONTHS, DEPTS, type ButceYearState } from '@/lib/muhasebe-butce-schemas';
import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';

export interface ConsolidatedCashflowPanelProps {
  state: ButceYearState;
  onChange: (next: ButceYearState) => void;
}

export function ConsolidatedCashflowPanel({ state, onChange }: ConsolidatedCashflowPanelProps) {
  // Bu üç parametre inputu yerel metin tamponu tutar: parent onChange her
  // tuş vuruşunda çağrılır ama state.opening/fx geri prop olarak akmadığı
  // sürece (bu bileşen kontrollü ama parent'ı re-render tetiklemeyebilir),
  // React kontrollü input'u sıfırlar ve art arda basılan rakamlar birikmez.
  // Yerel metin state'i bu birikimi doğru tutar; kaynak doğruluk hâlâ
  // parent'a iletilen `state` nesnesidir.
  const [openingText, setOpeningText] = useState<string>(String(state.opening || ''));
  const [fxEurText, setFxEurText] = useState<string>(String(state.fx.EUR || ''));
  const [fxTryText, setFxTryText] = useState<string>(String(state.fx.TRY || ''));

  const basis = state.basis;
  const dep = (id: (typeof DEPTS)[number]['id'], m: number) =>
    basis === 'actual' ? deptActualUSD(state, id, m) : deptPlanUSD(state, id, m);

  const net = consolidatedMonthlyNet(state);
  const cum = cumulativeCash(state);
  const firstNeg = runwayMonthsIndex(cum);
  const runwayText =
    firstNeg < 0
      ? '12+ ay (yıl içinde eksiye düşmüyor)'
      : firstNeg === 0
        ? 'Oca itibarıyla negatif'
        : `${firstNeg} ay (${BUTCE_MONTHS[firstNeg]} ayında eksiye düşer)`;
  const avgBurn = averageMonthlyBurn(net);

  const totalNetRev = Array.from({ length: 12 }, (_, m) => revNet(state, m)).reduce((s, v) => s + v, 0);
  const totalExp = Array.from({ length: 12 }, (_, m) =>
    DEPTS.reduce((s, d) => s + dep(d.id, m), 0),
  ).reduce((s, v) => s + v, 0);
  const yearNet = totalNetRev - totalExp;
  const endCash = cum[11];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Konsolide Nakit Akışı</h2>
        <p className="text-sm text-muted-foreground">
          Tüm tutarlar USD. Gelirler KDV hariç nettir; komisyonlar gelir kaleminin parametresinden düşülür.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="butce-opening" className="text-xs font-mono uppercase text-muted-foreground">
            Açılış nakit bakiyesi $
          </Label>
          <Input
            id="butce-opening"
            type="number"
            step="any"
            className="h-8 w-32"
            value={openingText}
            onChange={(e) => {
              setOpeningText(e.target.value);
              onChange({ ...state, opening: Number(e.target.value) || 0 });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="butce-fx-eur" className="text-xs font-mono uppercase text-muted-foreground">
            Kur · 1 EUR = ? USD
          </Label>
          <Input
            id="butce-fx-eur"
            type="number"
            step="any"
            className="h-8 w-28"
            value={fxEurText}
            onChange={(e) => {
              setFxEurText(e.target.value);
              onChange({ ...state, fx: { ...state.fx, EUR: Number(e.target.value) || 0 } });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="butce-fx-try" className="text-xs font-mono uppercase text-muted-foreground">
            Kur · 1 TRY = ? USD
          </Label>
          <Input
            id="butce-fx-try"
            type="number"
            step="any"
            className="h-8 w-28"
            value={fxTryText}
            onChange={(e) => {
              setFxTryText(e.target.value);
              onChange({ ...state, fx: { ...state.fx, TRY: Number(e.target.value) || 0 } });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono uppercase text-muted-foreground">Gider bazı</span>
          <Select value={basis} onValueChange={(v) => onChange({ ...state, basis: v as 'plan' | 'actual' })}>
            <SelectTrigger className="h-8 w-40" aria-label="Gider bazı">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plan">Bütçe (plan)</SelectItem>
              <SelectItem value="actual">Gerçekleşen</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Yıllık net gelir"
          amount={totalNetRev}
          subtitle="Komisyon kesintisi sonrası tüm gelir kalemleri toplamı"
          icon={TrendingUp}
          currency="USD"
        />
        <KpiCard
          title="Yıllık toplam gider"
          amount={totalExp}
          subtitle="Seçili gider bazına göre tüm departman toplamı"
          icon={TrendingDown}
          currency="USD"
        />
        <KpiCard
          title="Yıllık net akış"
          amount={yearNet}
          subtitle="Net gelir eksi toplam gider"
          icon={Wallet}
          currency="USD"
        />
        <KpiCard
          title="Yıl sonu nakit"
          amount={endCash}
          subtitle="Açılış bakiyesi + 12 aylık kümülatif net akış"
          icon={Wallet}
          currency="USD"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase text-muted-foreground">
            Nakit pozisyonu · kümülatif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {cum.map((v, m) => {
              const maxAbs = Math.max(1, ...cum.map((x) => Math.abs(x)));
              const height = Math.max(3, (Math.abs(v) / maxAbs) * 84);
              return (
                <div key={m} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[10px] text-muted-foreground">{Math.round(Math.abs(v) / 1000)}k</span>
                  <div
                    className={v < 0 ? 'w-full rounded-b bg-rose-500' : 'w-full rounded-t bg-emerald-500'}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{BUTCE_MONTHS[m]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-6 mt-4 text-sm font-mono">
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Runway</span>
              <span className={firstNeg >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {runwayText}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Ortalama aylık burn</span>
              <span>{avgBurn ? formatCurrency(avgBurn, 'USD', { showCode: true }) : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-muted-foreground">Açılış bakiyesi</span>
              <span>{formatCurrency(state.opening, 'USD', { showCode: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[1300px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kalem</TableHead>
              {BUTCE_MONTHS.map((m) => (
                <TableHead key={m} className="text-right">{m}</TableHead>
              ))}
              <TableHead className="text-right">Yıl toplamı</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono text-xs uppercase text-muted-foreground" colSpan={14}>
                GELİRLER
              </TableCell>
            </TableRow>
            {state.revenue.map((r) => {
              const vals = r.qty.map((q) => q * r.price);
              const total = vals.reduce((s, v) => s + v, 0);
              return (
                <TableRow key={r.id}>
                  <TableCell>{r.name} (brüt)</TableCell>
                  {vals.map((v, m) => (
                    <TableCell key={m} className="text-right font-mono">{Math.round(v).toLocaleString('en-US')}</TableCell>
                  ))}
                  <TableCell className="text-right font-mono">{Math.round(total).toLocaleString('en-US')}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted font-semibold">
              <TableCell>Net gelir</TableCell>
              {Array.from({ length: 12 }, (_, m) => (
                <TableCell key={m} className="text-right font-mono">
                  {Math.round(revNet(state, m)).toLocaleString('en-US')}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono">{Math.round(totalNetRev).toLocaleString('en-US')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono text-xs uppercase text-muted-foreground" colSpan={14}>
                GİDERLER · {basis === 'actual' ? 'gerçekleşen' : 'bütçe'}
              </TableCell>
            </TableRow>
            {DEPTS.map((d) => {
              const vals = Array.from({ length: 12 }, (_, m) => -dep(d.id, m));
              const total = vals.reduce((s, v) => s + v, 0);
              return (
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  {vals.map((v, m) => (
                    <TableCell key={m} className="text-right font-mono text-rose-600 dark:text-rose-400">
                      {Math.round(v).toLocaleString('en-US')}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-mono text-rose-600 dark:text-rose-400">
                    {Math.round(total).toLocaleString('en-US')}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-primary/10 font-bold">
              <TableCell>Aylık net nakit akışı</TableCell>
              {net.map((v, m) => (
                <TableCell
                  key={m}
                  className={`text-right font-mono ${v < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                >
                  {Math.round(v).toLocaleString('en-US')}
                </TableCell>
              ))}
              <TableCell className="text-right font-mono">{Math.round(yearNet).toLocaleString('en-US')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Runway: kümülatif nakdin eksiye döndüğü ilk aya kadar kalan süre. Gider bazı &quot;Bütçe&quot; iken plan senaryosunu, &quot;Gerçekleşen&quot; iken fiili durumu okursunuz.
      </p>
    </div>
  );
}
