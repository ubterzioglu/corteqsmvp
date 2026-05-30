// src/lib/muhasebe-schemas.ts
// Zod şemaları — form validation (react-hook-form + zod resolver)

import { z } from 'zod';

const optionalHttpUrl = z
  .string()
  .trim()
  .url('Geçerli bir URL giriniz')
  .refine((value) => /^https?:\/\//i.test(value), 'Link http veya https ile başlamalıdır')
  .or(z.literal(''))
  .nullable();

export const expenseFormSchema = z.object({
  expense_date: z
    .string()
    .min(1, 'Tarih gereklidir')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih giriniz'),

  person: z.enum(['burak', 'baris', 'ortak'], {
    errorMap: () => ({ message: 'Kişi seçiniz' }),
  }),

  category: z.enum([
    'yazilim_araclar',
    'hosting_sunucu',
    'alan_adi_ssl',
    'pazarlama_reklam',
    'hukuki_danismanlik',
    'muhasebe_finans',
    'seyahat_ulasim',
    'ofis_kirtasiye',
    'maas_ucret',
    'esop_hisse',
    'banka_komisyon',
    'diger_gider',
  ]),

  description: z
    .string()
    .trim()
    .min(2, 'Açıklama en az 2 karakter olmalı')
    .max(500, 'Açıklama en fazla 500 karakter olabilir'),

  amount: z
    .number({ invalid_type_error: 'Tutar sayısal olmalı' })
    .nonnegative('Tutar negatif olamaz')
    .max(999_999_999.99, 'Tutar çok büyük'),

  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP', 'QAR']),

  status: z.enum(['odendi', 'bekliyor', 'iptal']),

  payment_method: z
    .enum([
      'sanal_kart_burak',
      'sanal_kart_baris',
      'kisisel_kart_burak',
      'kisisel_kart_baris',
      'havale_eft',
      'nakit',
      'diger',
    ])
    .nullable(),

  invoice_url: optionalHttpUrl,

  note: z.string().trim().max(1000, 'Not en fazla 1000 karakter').nullable(),

  is_virtual_card: z.boolean(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const incomeFormSchema = z.object({
  income_date: z
    .string()
    .min(1, 'Tarih gereklidir')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih giriniz'),

  source: z
    .string()
    .trim()
    .min(2, 'Müşteri/Kaynak en az 2 karakter olmalı')
    .max(200, 'Müşteri/Kaynak en fazla 200 karakter olabilir'),

  category: z.enum([
    'pilot_gelir',
    'danismanlik_geliri',
    'hibe_grant',
    'yatirim_taahhudu',
    'demo_geliri',
    'diger_gelir',
  ]),

  description: z
    .string()
    .trim()
    .min(2, 'Açıklama en az 2 karakter olmalı')
    .max(500, 'Açıklama en fazla 500 karakter olabilir'),

  amount: z
    .number({ invalid_type_error: 'Tutar sayısal olmalı' })
    .nonnegative('Tutar negatif olamaz')
    .max(999_999_999.99, 'Tutar çok büyük'),

  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP', 'QAR']),

  status: z.enum(['tahsil_edildi', 'bekliyor', 'iptal']),

  link: optionalHttpUrl,

  note: z.string().trim().max(1000, 'Not en fazla 1000 karakter').nullable(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
