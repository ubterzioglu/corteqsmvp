// src/components/admin/muhasebe/ExpenseFormDialog.tsx
// Gider kaydı ekle / düzenle dialog'u

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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  expenseFormSchema,
  type ExpenseFormValues,
} from '@/lib/muhasebe-schemas';
import { todayIso } from '@/lib/muhasebe-format';
import {
  CURRENCY_CODES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PERSON_LABELS,
} from '@/types/muhasebe';
import type {
  ExpenseCategory,
  ExpenseInput,
  ExpenseRow,
  ExpenseStatus,
  PaymentMethod,
  PersonType,
  CurrencyCode,
} from '@/types/muhasebe';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ExpenseInput) => Promise<void> | void;
  isSubmitting?: boolean;
  /** Düzenleme modunda mevcut kayıt */
  initial?: ExpenseRow | null;
}

function toFormValues(row: ExpenseRow | null | undefined): ExpenseFormValues {
  return {
    expense_date: row?.expense_date ?? todayIso(),
    person: row?.person ?? 'burak',
    category: row?.category ?? 'yazilim_araclar',
    description: row?.description ?? '',
    amount: row?.amount ?? 0,
    currency: row?.currency ?? 'TRY',
    status: row?.status ?? 'bekliyor',
    payment_method: row?.payment_method ?? null,
    invoice_url: row?.invoice_url ?? '',
    note: row?.note ?? '',
    is_virtual_card: row?.is_virtual_card ?? false,
  };
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initial,
}: ExpenseFormDialogProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: toFormValues(initial),
  });

  // initial değişirse formu resetle (yeni kayıt ↔ düzenleme geçişi)
  useEffect(() => {
    if (open) form.reset(toFormValues(initial));
  }, [open, initial, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: ExpenseInput = {
      expense_date: values.expense_date,
      person: values.person,
      category: values.category,
      description: values.description,
      amount: values.amount,
      currency: values.currency,
      status: values.status,
      payment_method: values.payment_method,
      invoice_url: values.invoice_url?.trim() || null,
      note: values.note?.trim() || null,
      is_virtual_card: values.is_virtual_card,
    };
    await onSubmit(payload);
  });

  const isEdit = Boolean(initial?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Gideri Düzenle' : 'Yeni Gider Kaydı'}
          </DialogTitle>
          <DialogDescription>
            Şirket kurulana kadar geçici muhasebe kaydı.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarih + Kişi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Tarih *</Label>
              <Input
                id="expense_date"
                type="date"
                {...form.register('expense_date')}
              />
              {form.formState.errors.expense_date && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.expense_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Kim *</Label>
              <Select
                value={form.watch('person')}
                onValueChange={(v) =>
                  form.setValue('person', v as PersonType, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERSON_LABELS) as PersonType[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERSON_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <Label>Kategori *</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(v) =>
                form.setValue('category', v as ExpenseCategory, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
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
              placeholder="Örn. GitHub Pro yıllık abonelik"
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

          {/* Ödeme Durumu + Yöntemi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ödeme Durumu</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) =>
                  form.setValue('status', v as ExpenseStatus, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(EXPENSE_STATUS_LABELS) as ExpenseStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {EXPENSE_STATUS_LABELS[s]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ödeme Yöntemi</Label>
              <Select
                value={form.watch('payment_method') ?? '__none__'}
                onValueChange={(v) =>
                  form.setValue(
                    'payment_method',
                    v === '__none__' ? null : (v as PaymentMethod),
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçilmedi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Seçilmedi —</SelectItem>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
                    (m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fatura / Link */}
          <div className="space-y-2">
            <Label htmlFor="invoice_url">Fatura / Link</Label>
            <Input
              id="invoice_url"
              type="url"
              placeholder="https://..."
              {...form.register('invoice_url')}
            />
            {form.formState.errors.invoice_url && (
              <p className="text-xs text-destructive">
                {form.formState.errors.invoice_url.message}
              </p>
            )}
          </div>

          {/* Not */}
          <div className="space-y-2">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" rows={3} {...form.register('note')} />
          </div>

          {/* Sanal Kart checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_virtual_card"
              checked={form.watch('is_virtual_card')}
              onCheckedChange={(v) =>
                form.setValue('is_virtual_card', Boolean(v), {
                  shouldValidate: true,
                })
              }
            />
            <Label htmlFor="is_virtual_card" className="text-sm font-normal cursor-pointer">
              Sanal Kart ile ödendi
            </Label>
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
