// src/components/admin/muhasebe/IncomeFormDialog.tsx
// Gelir kaydı ekle / düzenle dialog'u

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { incomeFormSchema, type IncomeFormValues } from '@/lib/muhasebe-schemas';
import { todayIso } from '@/lib/muhasebe-format';
import {
  CURRENCY_CODES,
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
} from '@/types/muhasebe';
import type {
  CurrencyCode,
  IncomeCategory,
  IncomeInput,
  IncomeRow,
  IncomeStatus,
} from '@/types/muhasebe';

interface IncomeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IncomeInput) => Promise<void> | void;
  isSubmitting?: boolean;
  initial?: IncomeRow | null;
}

function toFormValues(row: IncomeRow | null | undefined): IncomeFormValues {
  return {
    income_date: row?.income_date ?? todayIso(),
    source: row?.source ?? '',
    category: row?.category ?? 'pilot_gelir',
    description: row?.description ?? '',
    amount: row?.amount ?? 0,
    currency: row?.currency ?? 'TRY',
    status: row?.status ?? 'bekliyor',
    link: row?.link ?? '',
    note: row?.note ?? '',
  };
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initial,
}: IncomeFormDialogProps) {
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    if (open) form.reset(toFormValues(initial));
  }, [open, initial, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: IncomeInput = {
      income_date: values.income_date,
      source: values.source,
      category: values.category,
      description: values.description,
      amount: values.amount,
      currency: values.currency,
      status: values.status,
      link: values.link?.trim() || null,
      note: values.note?.trim() || null,
    };
    await onSubmit(payload);
  });

  const isEdit = Boolean(initial?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Geliri Düzenle' : 'Yeni Gelir Kaydı'}
          </DialogTitle>
          <DialogDescription>
            Şirket kurulana kadar geçici muhasebe kaydı.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarih + Müşteri/Kaynak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="income_date">Tarih *</Label>
              <Input
                id="income_date"
                type="date"
                {...form.register('income_date')}
              />
              {form.formState.errors.income_date && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.income_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Müşteri / Kaynak *</Label>
              <Input
                id="source"
                placeholder="Örn. ACME Corp."
                {...form.register('source')}
              />
              {form.formState.errors.source && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.source.message}
                </p>
              )}
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label>Kategori *</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(v) =>
                form.setValue('category', v as IncomeCategory, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(INCOME_CATEGORY_LABELS) as IncomeCategory[]).map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {INCOME_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Input
              id="description"
              placeholder="Örn. Pilot proje 1. faz"
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Tutar + Para Birimi */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(v) =>
                  form.setValue('currency', v as CurrencyCode, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tahsilat Durumu */}
          <div className="space-y-2">
            <Label>Tahsilat Durumu</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(v) =>
                form.setValue('status', v as IncomeStatus, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(INCOME_STATUS_LABELS) as IncomeStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {INCOME_STATUS_LABELS[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Link / Kayıt</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://..."
              {...form.register('link')}
            />
            {form.formState.errors.link && (
              <p className="text-xs text-destructive">
                {form.formState.errors.link.message}
              </p>
            )}
          </div>

          {/* Not */}
          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" rows={3} {...form.register('note')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
