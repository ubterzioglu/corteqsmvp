// Bütçe sekmesi — 12 aylık input hücrelerini render eden paylaşılan satır bileşeni.
// DepartmentBudgetPanel (plan/gerçekleşen) ve RevenuePanel (adet) tarafından kullanılır.

import { TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { BUTCE_MONTHS } from '@/lib/muhasebe-butce-schemas';

export interface MonthRowProps {
  values: number[];
  onChange: (month: number, value: number) => void;
  dashed?: boolean;
  ariaLabelPrefix: string;
}

export function MonthRow({ values, onChange, dashed = false, ariaLabelPrefix }: MonthRowProps) {
  return (
    <>
      {values.map((value, month) => (
        <TableCell key={month} className="p-1 text-right">
          <Input
            type="number"
            step="any"
            value={value === 0 ? '' : value}
            placeholder="0"
            aria-label={`${ariaLabelPrefix} ${BUTCE_MONTHS[month]}`}
            className={dashed ? 'h-8 w-20 border-dashed text-right' : 'h-8 w-20 text-right'}
            onChange={(e) => {
              const parsed = Number(e.target.value);
              onChange(month, Number.isFinite(parsed) ? parsed : 0);
            }}
          />
        </TableCell>
      ))}
    </>
  );
}
