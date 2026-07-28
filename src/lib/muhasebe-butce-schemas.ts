// Muhasebe > Bütçe sekmesi — Zod şemaları + sabit departman/gelir seed listeleri.
// Departman ve gelir kategori seti orijinal prototiple aynı, sabit kodludur;
// kullanıcı kalem ekleyip silebilir ama departman/kategori kümesi değişmez.

import { z } from 'zod';

export type DeptId = 'tech' | 'mkt' | 'hr' | 'admin';
export type ButceCurrency = 'USD' | 'EUR' | 'TRY';

export interface ButceExpenseItem {
  id: string;
  name: string;
  cur: ButceCurrency;
  plan: number[];
  actual: number[];
}

export interface ButceRevenueItem {
  id: string;
  name: string;
  price: number;
  comm: number;
  qty: number[];
}

export interface ButceAllocation {
  mode: 'fixed' | 'pct';
  fixed: number[];
  pct: number;
}

export interface ButceYearState {
  fx: { EUR: number; TRY: number };
  opening: number;
  basis: 'plan' | 'actual';
  expenses: Record<DeptId, ButceExpenseItem[]>;
  revenue: ButceRevenueItem[];
  alloc: Record<DeptId, ButceAllocation>;
}

export const BUTCE_CURRENCIES: ButceCurrency[] = ['USD', 'EUR', 'TRY'];
export const BUTCE_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const BUTCE_YEARS = ['2026', '2027', '2028'];

export const DEPTS: {
  id: DeptId;
  name: string;
  sub: string;
  seeds: [string, ButceCurrency][];
}[] = [
  {
    id: 'tech',
    name: 'Teknoloji & Altyapı',
    sub: "Tool'lar, server, domain, AI kredileri",
    seeds: [
      ['Lovable aboneliği', 'USD'],
      ['Supabase', 'USD'],
      ['Domain & DNS', 'USD'],
      ['AI kredileri (video/görsel)', 'USD'],
      ['E-posta servisi', 'USD'],
      ['API & diğer altyapı', 'USD'],
    ],
  },
  {
    id: 'mkt',
    name: 'Pazarlama & Sosyal Medya',
    sub: 'Reklam, içerik, influencer, etkinlik pazarlama',
    seeds: [
      ['Meta reklam', 'USD'],
      ['Google reklam', 'USD'],
      ['TikTok reklam', 'USD'],
      ['İçerik üretimi', 'USD'],
      ['Influencer / Elçi', 'EUR'],
      ['Etkinlik pazarlama', 'EUR'],
    ],
  },
  {
    id: 'hr',
    name: 'Personel & Ortaklık',
    sub: 'Maaş, freelancer, equity nakit bileşeni, SGK & stopaj',
    seeds: [
      ['Maaşlar (brüt)', 'TRY'],
      ['Freelancer ödemeleri', 'USD'],
      ['Equity anlaşmaları — nakit bileşeni', 'USD'],
      ['SGK & stopaj', 'TRY'],
    ],
  },
  {
    id: 'admin',
    name: 'İdari & Compliance',
    sub: 'Delaware, muhasebe, hukuk, banka, tescil',
    seeds: [
      ['Delaware franchise tax', 'USD'],
      ['Registered agent', 'USD'],
      ['ABD muhasebe & beyanname', 'USD'],
      ['Hukuk & KVKK/GDPR', 'USD'],
      ['Marka tescili (TR + EU)', 'USD'],
      ['Banka masrafları', 'USD'],
      ['Sigorta', 'USD'],
    ],
  },
];

export const REV_SEEDS: [string, number, number][] = [
  ['Subscription', 5, 7.5],
  ['Cadde reklam', 250, 3.5],
  ['Çarşı komisyonu', 1, 5],
  ['Etkinlik', 25, 3.5],
  ['Ana sponsor', 1000, 3.5],
  ['Diğer 1', 0, 0],
  ['Diğer 2', 0, 0],
];

export function zeroMonths(): number[] {
  return Array(12).fill(0);
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const monthArraySchema = z.array(z.number()).length(12);

const butceExpenseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  cur: z.enum(['USD', 'EUR', 'TRY']),
  plan: monthArraySchema,
  actual: monthArraySchema,
});

const butceRevenueItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  comm: z.number(),
  qty: monthArraySchema,
});

const butceAllocationSchema = z.object({
  mode: z.enum(['fixed', 'pct']),
  fixed: monthArraySchema,
  pct: z.number(),
});

const deptIdSchema = z.enum(['tech', 'mkt', 'hr', 'admin']);

export const butceYearStateSchema = z.object({
  fx: z.object({ EUR: z.number(), TRY: z.number() }),
  opening: z.number(),
  basis: z.enum(['plan', 'actual']),
  expenses: z.record(deptIdSchema, z.array(butceExpenseItemSchema)),
  revenue: z.array(butceRevenueItemSchema),
  alloc: z.record(deptIdSchema, butceAllocationSchema),
});

export function seedYear(): ButceYearState {
  const expenses = DEPTS.reduce(
    (acc, d) => {
      acc[d.id] = d.seeds.map(([name, cur]) => ({
        id: makeId(),
        name,
        cur,
        plan: zeroMonths(),
        actual: zeroMonths(),
      }));
      return acc;
    },
    {} as Record<DeptId, ButceExpenseItem[]>,
  );

  const alloc = DEPTS.reduce(
    (acc, d) => {
      acc[d.id] = { mode: 'fixed', fixed: zeroMonths(), pct: 0 };
      return acc;
    },
    {} as Record<DeptId, ButceAllocation>,
  );

  const revenue = REV_SEEDS.map(([name, price, comm]) => ({
    id: makeId(),
    name,
    price,
    comm,
    qty: zeroMonths(),
  }));

  return {
    fx: { EUR: 1.08, TRY: 0.024 },
    opening: 0,
    basis: 'plan',
    expenses,
    revenue,
    alloc,
  };
}
