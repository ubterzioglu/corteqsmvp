// src/components/admin/muhasebe/KpiCard.tsx
// Dashboard KPI kartı — shadcn/ui Card primitives kullanarak

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/muhasebe-format';
import type { CurrencyCode } from '@/types/muhasebe';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  amount: number;
  subtitle: string;
  icon: LucideIcon;
  currency?: CurrencyCode;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
  isLoading?: boolean;
  /** Tutar yerine adet göstermek için (ör. "Toplam Kayıt") */
  displayAsCount?: boolean;
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'text-foreground',
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-rose-600 dark:text-rose-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

export function KpiCard({
  title,
  amount,
  subtitle,
  icon: Icon,
  currency = 'TRY',
  tone = 'default',
  isLoading = false,
  displayAsCount = false,
}: KpiCardProps) {
  // net pozisyon için otomatik ton: negatifse kırmızı, pozitifse yeşil
  const autoTone: KpiCardProps['tone'] =
    tone === 'default' && !displayAsCount
      ? amount < 0
        ? 'negative'
        : amount > 0
          ? 'positive'
          : 'default'
      : tone;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div
              className={cn(
                'text-2xl font-bold tabular-nums',
                TONE_CLASSES[autoTone ?? 'default'],
              )}
            >
              {displayAsCount
                ? new Intl.NumberFormat('tr-TR').format(amount)
                : formatCurrency(amount, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
