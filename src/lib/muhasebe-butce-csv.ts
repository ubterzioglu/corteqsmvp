// Bütçe sekmesi — CSV export. buildButceCsv test edilebilir, saf string üretir;
// downloadButceCsv onu Blob'a sarıp tarayıcı indirmesini tetikler.

import { consolidatedMonthlyNet, cumulativeCash, deptActualUSD, deptPlanUSD, revComm, revNet } from '@/lib/muhasebe-butce-aggregations';
import { BUTCE_MONTHS, DEPTS, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function csvRow(label: string, values: number[]): string {
  const total = values.reduce((s, v) => s + v, 0);
  return [escapeCsvCell(label), ...values.map((v) => Math.round(v)), Math.round(total)].join(',');
}

export function buildButceCsv(year: string, state: ButceYearState): string {
  const basisLabel = state.basis === 'actual' ? 'Gerçekleşen' : 'Bütçe';
  const dep = (id: (typeof DEPTS)[number]['id'], m: number) =>
    state.basis === 'actual' ? deptActualUSD(state, id, m) : deptPlanUSD(state, id, m);

  const lines: string[] = [];
  lines.push(
    [escapeCsvCell('CorteQS Konsolide Nakit Akışı'), escapeCsvCell(year), escapeCsvCell(`Baz: ${basisLabel}`), escapeCsvCell('USD')].join(','),
  );
  lines.push([escapeCsvCell('Kalem'), ...BUTCE_MONTHS.map(escapeCsvCell), escapeCsvCell('Yıl toplamı')].join(','));

  state.revenue.forEach((r) => {
    lines.push(csvRow(`${r.name} (brüt)`, r.qty.map((q) => q * r.price)));
  });
  lines.push(csvRow('Komisyon kesintisi', Array.from({ length: 12 }, (_, m) => -revComm(state, m))));
  lines.push(csvRow('Net gelir', Array.from({ length: 12 }, (_, m) => revNet(state, m))));

  DEPTS.forEach((d) => {
    lines.push(csvRow(d.name, Array.from({ length: 12 }, (_, m) => -dep(d.id, m))));
  });
  lines.push(
    csvRow(
      'Toplam gider',
      Array.from({ length: 12 }, (_, m) => -DEPTS.reduce((s, d) => s + dep(d.id, m), 0)),
    ),
  );

  const net = consolidatedMonthlyNet(state);
  lines.push(csvRow('Aylık net nakit akışı', net));

  const cum = cumulativeCash(state);
  lines.push([escapeCsvCell('Kümülatif nakit'), ...cum.map((v) => Math.round(v)), ''].join(','));

  return lines.join('\r\n');
}

export function downloadButceCsv(year: string, state: ButceYearState): void {
  const csv = buildButceCsv(year, state);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `corteqs-butce-${year}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
