# Muhasebe Bütçe Sekmesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kök dizindeki statik `muhasebenew.html` "Bütçe Konsolu" prototipini, muhasebe modülünün mevcut React + Supabase mimarisine uygun bir `/admin/muhasebe/butce` sekmesine dönüştürmek ve HTML dosyasını silmek.

**Architecture:** Yıl bazlı bütçe state'i (`fx`, `opening`, `basis`, `expenses`, `revenue`, `alloc`) tek bir JSONB sütununda (`muhasebe_butce_state.state`) saklanır. Pure hesaplama fonksiyonları (`muhasebe-butce-aggregations.ts`) orijinal HTML'deki `deptPlanUSD`/`revNet`/`allocUSD`/runway mantığını birebir TS'e taşır. React Query hook'u (`useMuhasebeButce.ts`) yıl verisini çekip debounce'lu upsert ile otomatik kaydeder. UI, `MuhasebeLayout`'un mevcut sekme desenine yeni bir "Bütçe" girişi ekler; sekme içi 6 panel (4 departman + Gelirler + Konsolide) arasında shadcn `Tabs` ile geçiş yapılır — URL değişmez.

**Tech Stack:** React, TypeScript, TanStack Query, Supabase (Postgres + RLS), Zod, shadcn/ui (Card/Table/Tabs/Input/Select/Button), Vitest + Testing Library.

## Global Constraints

- TypeScript: yeni public fonksiyon/export'lara açık tip yaz (proje `strict: false` ama yeni kod `strict: true` gibi yazılmalı — CLAUDE.md).
- Immutability: state güncellemeleri her zaman yeni obje/array döndürür, mevcut objeyi mutate etmez (kullanıcı kuralı).
- Türkçe metin: kullanıcı girdisi serbest metin, `toUpperCase`/`toLowerCase` çağrısı yapılmaz; yalnız teknik değerler (para birimi kodu `USD`/`EUR`/`TRY`) bare string karşılaştırması kullanır.
- CSV export Blob'u UTF-8 BOM (`"﻿"`) ile başlamalı (CLAUDE.md Türkçe Metin Kuralları §2).
- Migration dosyaları asla silinmez/yeniden sıralanmaz — yalnız yeni dosya eklenir, tarih damgası mevcut en yeni migration'dan (`20260721140000`) sonra olmalı.
- RLS policy admin kontrolü `public.is_admin(auth.uid())` çağrısıyla yazılır (parametresiz `is_admin()` DEĞİL — mevcut migration deseni, bkz. `supabase/migrations/applied/20260625100000_agent_ops_analytics.sql:69`).
- `@/*` path alias kullanılır (`@/lib/...`, `@/hooks/...`, `@/pages/...`).
- Yeni dosyalar 800 satırı geçmez; departman ve gelir tablosu için ortak bileşen kullanılarak kod tekrarı önlenir (DRY).

---

### Task 1: Supabase migration — `muhasebe_butce_state` tablosu

**Files:**
- Create: `supabase/migrations/20260728090000_create_muhasebe_butce_state.sql`

**Interfaces:**
- Consumes: `public.is_admin(uuid)` RPC (mevcut).
- Produces: `public.muhasebe_butce_state` tablosu — `id uuid`, `year int unique not null`, `state jsonb not null`, `updated_at timestamptz not null default now()`. Task 2'nin API katmanı bu tabloyu `year` ve `state` sütunlarıyla kullanır.

- [ ] **Step 1: Migration dosyasını yaz**

```sql
-- supabase/migrations/20260728090000_create_muhasebe_butce_state.sql
-- Muhasebe > Bütçe sekmesi: yıl bazlı bütçe planı state'i (departman gideri,
-- alokasyon, gelir kalemleri). Tek JSONB sütununda saklanır — kapsam küçük
-- tutulduğu için normalize edilmiş şema yerine blob state tercih edildi.

create table public.muhasebe_butce_state (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.muhasebe_butce_state enable row level security;

create policy muhasebe_butce_state_admin_all
  on public.muhasebe_butce_state
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.set_muhasebe_butce_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_muhasebe_butce_state_updated_at
  before update on public.muhasebe_butce_state
  for each row
  execute function public.set_muhasebe_butce_state_updated_at();
```

- [ ] **Step 2: Migration'ı yerel/staging Supabase'e uygula**

Run: `supabase db push`
Expected: `muhasebe_butce_state` tablosu, policy ve trigger hatasız oluşturulur. Hata alırsan `public.is_admin` fonksiyonunun imzasını doğrula: `select public.is_admin('00000000-0000-0000-0000-000000000000'::uuid);` çalışmalı.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260728090000_create_muhasebe_butce_state.sql
git commit -m "feat(muhasebe): add muhasebe_butce_state table for bütçe sekmesi"
```

---

### Task 2: Zod şemaları + departman/gelir seed sabitleri

**Files:**
- Create: `src/lib/muhasebe-butce-schemas.ts`
- Test: `src/lib/muhasebe-butce-schemas.test.ts`

**Interfaces:**
- Consumes: yok (temel tip tanımları).
- Produces:
  - `type DeptId = 'tech' | 'mkt' | 'hr' | 'admin'`
  - `type ButceCurrency = 'USD' | 'EUR' | 'TRY'`
  - `interface ButceExpenseItem { id: string; name: string; cur: ButceCurrency; plan: number[]; actual: number[] }`
  - `interface ButceRevenueItem { id: string; name: string; price: number; comm: number; qty: number[] }`
  - `interface ButceAllocation { mode: 'fixed' | 'pct'; fixed: number[]; pct: number }`
  - `interface ButceYearState { fx: { EUR: number; TRY: number }; opening: number; basis: 'plan' | 'actual'; expenses: Record<DeptId, ButceExpenseItem[]>; revenue: ButceRevenueItem[]; alloc: Record<DeptId, ButceAllocation> }`
  - `butceYearStateSchema: z.ZodType<ButceYearState>`
  - `const DEPTS: { id: DeptId; name: string; sub: string; seeds: [string, ButceCurrency][] }[]`
  - `const REV_SEEDS: [string, number, number][]`
  - `function seedYear(): ButceYearState`
  - `function makeId(): string` (uid üretici — `Math.random().toString(36).slice(2,9)` yerine test edilebilir sarmalayıcı)
  - `function zeroMonths(): number[]` (12 elemanlı sıfır dizisi)

- [ ] **Step 1: Şema ve seed sabitlerinin failing testini yaz**

```typescript
// src/lib/muhasebe-butce-schemas.test.ts
import { describe, expect, it } from 'vitest';
import {
  DEPTS,
  REV_SEEDS,
  butceYearStateSchema,
  seedYear,
  zeroMonths,
} from '@/lib/muhasebe-butce-schemas';

describe('muhasebe-butce-schemas', () => {
  it('zeroMonths returns 12 zeros', () => {
    expect(zeroMonths()).toEqual(Array(12).fill(0));
  });

  it('DEPTS has 4 fixed departments in the original order', () => {
    expect(DEPTS.map((d) => d.id)).toEqual(['tech', 'mkt', 'hr', 'admin']);
  });

  it('REV_SEEDS has 7 revenue seed rows', () => {
    expect(REV_SEEDS).toHaveLength(7);
  });

  it('seedYear produces a schema-valid state with one item list per department', () => {
    const year = seedYear();
    expect(() => butceYearStateSchema.parse(year)).not.toThrow();
    DEPTS.forEach((d) => {
      expect(year.expenses[d.id]).toHaveLength(d.seeds.length);
    });
    expect(year.revenue).toHaveLength(REV_SEEDS.length);
  });

  it('seedYear sets default fx and opening balance', () => {
    const year = seedYear();
    expect(year.fx).toEqual({ EUR: 1.08, TRY: 0.024 });
    expect(year.opening).toBe(0);
    expect(year.basis).toBe('plan');
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-schemas.test.ts`
Expected: FAIL — `Cannot find module '@/lib/muhasebe-butce-schemas'`

- [ ] **Step 3: Şema dosyasını yaz**

```typescript
// src/lib/muhasebe-butce-schemas.ts
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
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-schemas.test.ts`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add src/lib/muhasebe-butce-schemas.ts src/lib/muhasebe-butce-schemas.test.ts
git commit -m "feat(muhasebe): add bütçe schemas and fixed department/revenue seeds"
```

---

### Task 3: Pure hesaplama fonksiyonları — `muhasebe-butce-aggregations.ts`

**Files:**
- Create: `src/lib/muhasebe-butce-aggregations.ts`
- Test: `src/lib/muhasebe-butce-aggregations.test.ts`

**Interfaces:**
- Consumes: `ButceYearState`, `DeptId`, `ButceCurrency`, `DEPTS` (Task 2, `@/lib/muhasebe-butce-schemas`).
- Produces:
  - `function fxRate(state: ButceYearState, cur: ButceCurrency): number`
  - `function deptPlanUSD(state: ButceYearState, id: DeptId, month: number): number`
  - `function deptActualUSD(state: ButceYearState, id: DeptId, month: number): number`
  - `function revGross(state: ButceYearState, month: number): number`
  - `function revComm(state: ButceYearState, month: number): number`
  - `function revNet(state: ButceYearState, month: number): number`
  - `function allocUSD(state: ButceYearState, id: DeptId, month: number): number`
  - `function departmentTotals(state: ButceYearState, id: DeptId): { alloc: number; plan: number; actual: number; remaining: number }` (yıl toplamları)
  - `function consolidatedMonthlyNet(state: ButceYearState): number[]` (12 aylık net nakit akışı — gelir net − tüm departman gideri)
  - `function cumulativeCash(state: ButceYearState): number[]` (açılış bakiyesi + kümülatif net)
  - `function runwayMonthsIndex(cumulative: number[]): number` (kümülatif ilk negatife düştüğü ay indexi, hiç düşmezse `-1`)
  - `function averageMonthlyBurn(monthlyNet: number[]): number` (negatif ayların ortalama mutlak değeri, negatif ay yoksa `0`)

- [ ] **Step 1: Failing testleri yaz**

```typescript
// src/lib/muhasebe-butce-aggregations.test.ts
import { describe, expect, it } from 'vitest';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';
import {
  allocUSD,
  averageMonthlyBurn,
  consolidatedMonthlyNet,
  cumulativeCash,
  deptActualUSD,
  deptPlanUSD,
  departmentTotals,
  fxRate,
  revComm,
  revGross,
  revNet,
  runwayMonthsIndex,
} from '@/lib/muhasebe-butce-aggregations';

function withTechPlan(base: ButceYearState, month: number, usdAmount: number): ButceYearState {
  return {
    ...base,
    expenses: {
      ...base.expenses,
      tech: base.expenses.tech.map((item, idx) =>
        idx === 0
          ? { ...item, plan: item.plan.map((v, m) => (m === month ? usdAmount : v)) }
          : item,
      ),
    },
  };
}

describe('muhasebe-butce-aggregations', () => {
  it('fxRate returns 1 for USD and the configured rate for EUR/TRY', () => {
    const state = seedYear();
    expect(fxRate(state, 'USD')).toBe(1);
    expect(fxRate(state, 'EUR')).toBe(1.08);
    expect(fxRate(state, 'TRY')).toBe(0.024);
  });

  it('deptPlanUSD sums plan amounts converted to USD for a given month', () => {
    const state = withTechPlan(seedYear(), 0, 100);
    expect(deptPlanUSD(state, 'tech', 0)).toBe(100);
    expect(deptPlanUSD(state, 'tech', 1)).toBe(0);
  });

  it('deptActualUSD mirrors deptPlanUSD for the actual column', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      expenses: {
        ...base.expenses,
        tech: base.expenses.tech.map((item, idx) =>
          idx === 0 ? { ...item, actual: item.actual.map((v, m) => (m === 2 ? 50 : v)) } : item,
        ),
      },
    };
    expect(deptActualUSD(state, 'tech', 2)).toBe(50);
  });

  it('revGross/revComm/revNet compute gross, commission, and net revenue for a month', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) =>
        idx === 0 ? { ...r, price: 5, comm: 10, qty: r.qty.map((v, m) => (m === 0 ? 20 : v)) } : r,
      ),
    };
    expect(revGross(state, 0)).toBe(100);
    expect(revComm(state, 0)).toBe(10);
    expect(revNet(state, 0)).toBe(90);
  });

  it('allocUSD returns fixed amount in fixed mode', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      alloc: {
        ...base.alloc,
        tech: { mode: 'fixed', fixed: base.alloc.tech.fixed.map((v, m) => (m === 0 ? 500 : v)), pct: 0 },
      },
    };
    expect(allocUSD(state, 'tech', 0)).toBe(500);
  });

  it('allocUSD returns a percentage of net revenue in pct mode', () => {
    const base = seedYear();
    const withRevenue: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) =>
        idx === 0 ? { ...r, price: 10, comm: 0, qty: r.qty.map((v, m) => (m === 0 ? 100 : v)) } : r,
      ),
    };
    const state: ButceYearState = {
      ...withRevenue,
      alloc: { ...withRevenue.alloc, tech: { mode: 'pct', fixed: withRevenue.alloc.tech.fixed, pct: 20 } },
    };
    expect(allocUSD(state, 'tech', 0)).toBe(200);
  });

  it('departmentTotals sums alloc/plan/actual/remaining across all 12 months', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      alloc: { ...base.alloc, tech: { mode: 'fixed', fixed: Array(12).fill(100), pct: 0 } },
      expenses: {
        ...base.expenses,
        tech: base.expenses.tech.map((item, idx) =>
          idx === 0 ? { ...item, actual: Array(12).fill(30) } : item,
        ),
      },
    };
    const totals = departmentTotals(state, 'tech');
    expect(totals.alloc).toBe(1200);
    expect(totals.actual).toBe(360);
    expect(totals.remaining).toBe(840);
  });

  it('consolidatedMonthlyNet is net revenue minus total department spend per month', () => {
    const state = seedYear();
    const net = consolidatedMonthlyNet(state);
    expect(net).toHaveLength(12);
    expect(net.every((v) => v === 0)).toBe(true);
  });

  it('cumulativeCash accumulates opening balance plus monthly net', () => {
    const base = seedYear();
    const state: ButceYearState = { ...base, opening: 1000 };
    const cum = cumulativeCash(state);
    expect(cum).toHaveLength(12);
    expect(cum[0]).toBe(1000);
    expect(cum[11]).toBe(1000);
  });

  it('runwayMonthsIndex returns -1 when cumulative cash never goes negative', () => {
    expect(runwayMonthsIndex(Array(12).fill(100))).toBe(-1);
  });

  it('runwayMonthsIndex returns the first negative month index', () => {
    expect(runwayMonthsIndex([100, 50, -10, -20])).toBe(2);
  });

  it('averageMonthlyBurn averages the absolute value of negative months only', () => {
    expect(averageMonthlyBurn([100, -50, -150, 30])).toBe(100);
    expect(averageMonthlyBurn([10, 20, 30])).toBe(0);
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-aggregations.test.ts`
Expected: FAIL — `Cannot find module '@/lib/muhasebe-butce-aggregations'`

- [ ] **Step 3: Implementasyonu yaz**

```typescript
// src/lib/muhasebe-butce-aggregations.ts
// Muhasebe > Bütçe sekmesi — pure hesaplama fonksiyonları.
// Orijinal prototipteki deptPlanUSD/revNet/allocUSD/runway mantığının
// state mutasyonu içermeyen TS karşılığı.

import { DEPTS } from '@/lib/muhasebe-butce-schemas';
import type { ButceCurrency, ButceYearState, DeptId } from '@/lib/muhasebe-butce-schemas';

function num(v: number): number {
  return Number.isFinite(v) ? v : 0;
}

export function fxRate(state: ButceYearState, cur: ButceCurrency): number {
  if (cur === 'USD') return 1;
  return num(state.fx[cur]);
}

export function deptPlanUSD(state: ButceYearState, id: DeptId, month: number): number {
  return state.expenses[id].reduce(
    (sum, item) => sum + num(item.plan[month]) * fxRate(state, item.cur),
    0,
  );
}

export function deptActualUSD(state: ButceYearState, id: DeptId, month: number): number {
  return state.expenses[id].reduce(
    (sum, item) => sum + num(item.actual[month]) * fxRate(state, item.cur),
    0,
  );
}

export function revGross(state: ButceYearState, month: number): number {
  return state.revenue.reduce((sum, r) => sum + num(r.qty[month]) * num(r.price), 0);
}

export function revComm(state: ButceYearState, month: number): number {
  return state.revenue.reduce(
    (sum, r) => sum + (num(r.qty[month]) * num(r.price) * num(r.comm)) / 100,
    0,
  );
}

export function revNet(state: ButceYearState, month: number): number {
  return revGross(state, month) - revComm(state, month);
}

export function allocUSD(state: ButceYearState, id: DeptId, month: number): number {
  const alloc = state.alloc[id];
  return alloc.mode === 'pct'
    ? (revNet(state, month) * num(alloc.pct)) / 100
    : num(alloc.fixed[month]);
}

export function departmentTotals(
  state: ButceYearState,
  id: DeptId,
): { alloc: number; plan: number; actual: number; remaining: number } {
  let alloc = 0;
  let plan = 0;
  let actual = 0;
  for (let m = 0; m < 12; m += 1) {
    alloc += allocUSD(state, id, m);
    plan += deptPlanUSD(state, id, m);
    actual += deptActualUSD(state, id, m);
  }
  return { alloc, plan, actual, remaining: alloc - actual };
}

export function consolidatedMonthlyNet(state: ButceYearState): number[] {
  return Array.from({ length: 12 }, (_, m) => {
    const totalDeptSpend = DEPTS.reduce(
      (sum, d) => sum + deptActualExpenseByBasis(state, d.id, m),
      0,
    );
    return revNet(state, m) - totalDeptSpend;
  });
}

function deptActualExpenseByBasis(state: ButceYearState, id: DeptId, month: number): number {
  return state.basis === 'actual' ? deptActualUSD(state, id, month) : deptPlanUSD(state, id, month);
}

export function cumulativeCash(state: ButceYearState): number[] {
  const net = consolidatedMonthlyNet(state);
  let acc = num(state.opening);
  return net.map((v) => {
    acc += v;
    return acc;
  });
}

export function runwayMonthsIndex(cumulative: number[]): number {
  return cumulative.findIndex((v) => v < 0);
}

export function averageMonthlyBurn(monthlyNet: number[]): number {
  const burnMonths = monthlyNet.filter((v) => v < 0);
  if (burnMonths.length === 0) return 0;
  return Math.abs(burnMonths.reduce((sum, v) => sum + v, 0) / burnMonths.length);
}
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-aggregations.test.ts`
Expected: PASS (13 test)

- [ ] **Step 5: Commit**

```bash
git add src/lib/muhasebe-butce-aggregations.ts src/lib/muhasebe-butce-aggregations.test.ts
git commit -m "feat(muhasebe): add pure aggregation functions for bütçe sekmesi"
```

---

### Task 4: Supabase API katmanı — `muhasebe-butce-api.ts`

**Files:**
- Create: `src/lib/muhasebe-butce-api.ts`

**Interfaces:**
- Consumes: `supabase` client (`@/integrations/supabase/client`), `ButceYearState` (Task 2).
- Produces:
  - `async function fetchButceYear(year: number): Promise<ButceYearState | null>`
  - `async function upsertButceYear(year: number, state: ButceYearState): Promise<void>`

- [ ] **Step 1: API dosyasını yaz**

```typescript
// src/lib/muhasebe-butce-api.ts
// Supabase CRUD — muhasebe_butce_state (bütçe sekmesi yıl state'i)

import { supabase } from '@/integrations/supabase/client';
import type { ButceYearState } from '@/lib/muhasebe-butce-schemas';

interface MuhasebeButceStateRow {
  id: string;
  year: number;
  state: ButceYearState;
  updated_at: string;
}

export async function fetchButceYear(year: number): Promise<ButceYearState | null> {
  const { data, error } = await supabase
    .from('muhasebe_butce_state')
    .select('*')
    .eq('year', year)
    .maybeSingle();
  if (error) throw error;
  return (data as MuhasebeButceStateRow | null)?.state ?? null;
}

export async function upsertButceYear(year: number, state: ButceYearState): Promise<void> {
  const { error } = await supabase
    .from('muhasebe_butce_state')
    .upsert({ year, state }, { onConflict: 'year' });
  if (error) throw error;
}
```

- [ ] **Step 2: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: `muhasebe-butce-api.ts` için hata yok. (Not: `supabase/types.ts` içinde `muhasebe_butce_state` henüz tanımlı olmadığından `.from('muhasebe_butce_state')` üzerinde tip uyarısı çıkabilir — proje genelinde `strict: false` olduğu için build'i kırmaz; CLAUDE.md B1 backlog'unda bilinen bir durumdur. Kırıcı bir hata çıkarsa `as any` KULLANMA, bunun yerine `supabase.from('muhasebe_butce_state' as never)` ile daralt.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/muhasebe-butce-api.ts
git commit -m "feat(muhasebe): add Supabase API layer for bütçe state"
```

---

### Task 5: React Query hook — `useMuhasebeButce.ts`

**Files:**
- Create: `src/hooks/useMuhasebeButce.ts`
- Test: `src/hooks/useMuhasebeButce.test.ts`

**Interfaces:**
- Consumes: `fetchButceYear`, `upsertButceYear` (Task 4), `seedYear` (Task 2, `@/lib/muhasebe-butce-schemas`).
- Produces:
  - `const muhasebeButceKeys = { all: ['muhasebe-butce'] as const, year: (y: number) => [...muhasebeButceKeys.all, y] as const }`
  - `function useButceYear(year: number): UseQueryResult<ButceYearState>` — veri yoksa `seedYear()` döner (DB'ye yazmaz, ilk kayıt autosave ile olur).
  - `function useSaveButceYear(year: number): UseMutationResult<void, Error, ButceYearState>`

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/hooks/useMuhasebeButce.test.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/muhasebe-butce-api', () => ({
  fetchButceYear: vi.fn(),
  upsertButceYear: vi.fn(),
}));

import { fetchButceYear, upsertButceYear } from '@/lib/muhasebe-butce-api';
import { useButceYear, useSaveButceYear } from '@/hooks/useMuhasebeButce';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useButceYear', () => {
  it('returns a seeded year when the DB has no row yet', async () => {
    vi.mocked(fetchButceYear).mockResolvedValue(null);
    const { result } = renderHook(() => useButceYear(2026), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.basis).toBe('plan');
    expect(result.current.data?.expenses.tech).toHaveLength(6);
  });

  it('returns the stored year state when present', async () => {
    const stored = seedYear();
    vi.mocked(fetchButceYear).mockResolvedValue(stored);
    const { result } = renderHook(() => useButceYear(2027), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stored);
  });
});

describe('useSaveButceYear', () => {
  it('calls upsertButceYear with the given year and state', async () => {
    vi.mocked(upsertButceYear).mockResolvedValue(undefined);
    const { result } = renderHook(() => useSaveButceYear(2026), { wrapper });
    const state = seedYear();
    await result.current.mutateAsync(state);
    expect(upsertButceYear).toHaveBeenCalledWith(2026, state);
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/hooks/useMuhasebeButce.test.ts`
Expected: FAIL — `Cannot find module '@/hooks/useMuhasebeButce'`

- [ ] **Step 3: Hook dosyasını yaz**

```typescript
// src/hooks/useMuhasebeButce.ts
// React Query hook'ları — muhasebe bütçe sekmesi

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchButceYear, upsertButceYear } from '@/lib/muhasebe-butce-api';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

export const muhasebeButceKeys = {
  all: ['muhasebe-butce'] as const,
  year: (year: number) => [...muhasebeButceKeys.all, year] as const,
};

export function useButceYear(year: number) {
  return useQuery({
    queryKey: muhasebeButceKeys.year(year),
    queryFn: async (): Promise<ButceYearState> => {
      const stored = await fetchButceYear(year);
      return stored ?? seedYear();
    },
  });
}

export function useSaveButceYear(year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (state: ButceYearState) => upsertButceYear(year, state),
    onError: (err: Error) => {
      toast.error('Bütçe kaydedilemedi', { description: err.message });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: muhasebeButceKeys.year(year) });
    },
  });
}
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/hooks/useMuhasebeButce.test.ts`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMuhasebeButce.ts src/hooks/useMuhasebeButce.test.ts
git commit -m "feat(muhasebe): add React Query hooks for bütçe year state"
```

---

### Task 6: Debounce autosave hook'u — `useDebouncedButceSave`

**Files:**
- Modify: `src/hooks/useMuhasebeButce.ts`
- Modify: `src/hooks/useMuhasebeButce.test.ts`

**Interfaces:**
- Consumes: `useSaveButceYear` (bu dosyanın kendisi, Task 5).
- Produces: `function useDebouncedButceSave(year: number, delayMs?: number): { save: (state: ButceYearState) => void; status: 'idle' | 'saving' | 'saved' | 'error' }` — 700ms varsayılan debounce, orijinal `scheduleSave` davranışının karşılığı.

- [ ] **Step 1: Failing testi ekle**

```typescript
// src/hooks/useMuhasebeButce.test.ts içine eklenecek (mevcut describe bloklarının sonuna)
import { act } from '@testing-library/react';

describe('useDebouncedButceSave', () => {
  it('debounces rapid save() calls into a single upsert', async () => {
    vi.useFakeTimers();
    vi.mocked(upsertButceYear).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedButceSave(2026, 700), { wrapper });
    const state = seedYear();

    act(() => {
      result.current.save(state);
      result.current.save(state);
      result.current.save(state);
    });
    expect(upsertButceYear).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(upsertButceYear).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
```

Bu bloğun üstündeki import satırına `useDebouncedButceSave` eklenmeli:
```typescript
import { useButceYear, useDebouncedButceSave, useSaveButceYear } from '@/hooks/useMuhasebeButce';
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/hooks/useMuhasebeButce.test.ts`
Expected: FAIL — `useDebouncedButceSave is not exported`

- [ ] **Step 3: Hook'u ekle**

`src/hooks/useMuhasebeButce.ts` dosyasının sonuna ekle:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedButceSave(year: number, delayMs = 700) {
  const { mutate, isPending, isError } = useSaveButceYear(year);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const save = useCallback(
    (state: ButceYearState) => {
      setStatus('saving');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        mutate(state, {
          onSuccess: () => setStatus('saved'),
          onError: () => setStatus('error'),
        });
      }, delayMs);
    },
    [delayMs, mutate],
  );

  return { save, status: isPending ? 'saving' : isError ? 'error' : status };
}
```

Ve dosyanın en üstündeki import satırını güncelle (React import'unu `useCallback`/`useEffect`/`useRef`/`useState` ile birlikte ekle — dosyanın tepesine tek satır):

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/hooks/useMuhasebeButce.test.ts`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMuhasebeButce.ts src/hooks/useMuhasebeButce.test.ts
git commit -m "feat(muhasebe): add debounced autosave hook for bütçe sekmesi"
```

---

### Task 7: Paylaşılan ay-bazlı tablo bileşeni — `BudgetMonthTable.tsx`

**Files:**
- Create: `src/components/admin/muhasebe/BudgetMonthTable.tsx`
- Test: `src/components/admin/muhasebe/BudgetMonthTable.test.tsx`

**Interfaces:**
- Consumes: `BUTCE_MONTHS` (Task 2, `@/lib/muhasebe-butce-schemas`), shadcn `Table`/`Input` (`@/components/ui/table`, `@/components/ui/input`).
- Produces: `interface MonthRowProps { values: number[]; onChange: (month: number, value: number) => void; dashed?: boolean; ariaLabelPrefix: string }` ve `function MonthRow(props: MonthRowProps): JSX.Element` — 12 ay input hücresini render eden satır; `DepartmentBudgetPanel` ve `RevenuePanel` bu bileşeni satır içinde kullanır.

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/components/admin/muhasebe/BudgetMonthTable.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MonthRow } from '@/components/admin/muhasebe/BudgetMonthTable';

describe('MonthRow', () => {
  it('renders 12 month inputs with the given values', () => {
    render(
      <table>
        <tbody>
          <tr>
            <MonthRow
              values={[100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
              onChange={vi.fn()}
              ariaLabelPrefix="Test"
            />
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getAllByRole('spinbutton')).toHaveLength(12);
    expect(screen.getByLabelText('Test Oca')).toHaveValue(100);
  });

  it('calls onChange with the month index and numeric value on input', async () => {
    const onChange = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <MonthRow values={Array(12).fill(0)} onChange={onChange} ariaLabelPrefix="Test" />
          </tr>
        </tbody>
      </table>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Test Şub'), '250');
    expect(onChange).toHaveBeenLastCalledWith(1, 250);
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/components/admin/muhasebe/BudgetMonthTable.test.tsx`
Expected: FAIL — `Cannot find module '@/components/admin/muhasebe/BudgetMonthTable'`

- [ ] **Step 3: Bileşeni yaz**

```typescript
// src/components/admin/muhasebe/BudgetMonthTable.tsx
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
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/components/admin/muhasebe/BudgetMonthTable.test.tsx`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/muhasebe/BudgetMonthTable.tsx src/components/admin/muhasebe/BudgetMonthTable.test.tsx
git commit -m "feat(muhasebe): add shared MonthRow input component for bütçe tables"
```

---

### Task 8: Departman paneli — `DepartmentBudgetPanel.tsx`

**Files:**
- Create: `src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.tsx`
- Test: `src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.test.tsx`

**Interfaces:**
- Consumes: `MonthRow` (Task 7), `deptPlanUSD`/`deptActualUSD`/`allocUSD`/`departmentTotals` (Task 3), `DEPTS`, `ButceYearState`, `DeptId`, `ButceCurrency`, `BUTCE_CURRENCIES` (Task 2), `KpiCard` (mevcut, `@/components/admin/muhasebe/KpiCard`), `formatCurrency` (mevcut, `@/lib/muhasebe-format`).
- Produces: `interface DepartmentBudgetPanelProps { deptId: DeptId; state: ButceYearState; onChange: (next: ButceYearState) => void }` ve `function DepartmentBudgetPanel(props: DepartmentBudgetPanelProps): JSX.Element`. `ButcePage` (Task 10) bu bileşeni her departman sekmesinde render eder.

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DepartmentBudgetPanel } from '@/pages/admin/muhasebe/butce/DepartmentBudgetPanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

describe('DepartmentBudgetPanel', () => {
  it('renders the department name, its seed expense items, and add-item button', () => {
    const state = seedYear();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Teknoloji & Altyapı' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lovable aboneliği')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kalem ekle/i })).toBeInTheDocument();
  });

  it('calls onChange with an added expense item when "Kalem ekle" is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Kalem ekle/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.expenses.tech).toHaveLength(state.expenses.tech.length + 1);
  });

  it('calls onChange with the item removed when its delete button is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Kalemi sil/i });
    await userEvent.click(deleteButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next.expenses.tech).toHaveLength(state.expenses.tech.length - 1);
  });

  it('switches allocation mode to percentage and updates state', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox', { name: /Alokasyon modu/i }));
    await userEvent.click(await screen.findByRole('option', { name: /Net gelirin/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.alloc.tech.mode).toBe('pct');
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/admin/muhasebe/butce/DepartmentBudgetPanel'`

- [ ] **Step 3: Bileşeni yaz**

```typescript
// src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.tsx
// Bütçe sekmesi — bir departmanın gider tablosu, alokasyon ayarı ve özet kartları.

import { TrendingDown, TrendingUp, Wallet, Scale } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KpiCard } from '@/components/admin/muhasebe/KpiCard';
import { MonthRow } from '@/components/admin/muhasebe/BudgetMonthTable';
import { formatCurrency } from '@/lib/muhasebe-format';
import { departmentTotals } from '@/lib/muhasebe-butce-aggregations';
import {
  BUTCE_CURRENCIES,
  BUTCE_MONTHS,
  DEPTS,
  makeId,
  zeroMonths,
  type ButceCurrency,
  type ButceYearState,
  type DeptId,
} from '@/lib/muhasebe-butce-schemas';

export interface DepartmentBudgetPanelProps {
  deptId: DeptId;
  state: ButceYearState;
  onChange: (next: ButceYearState) => void;
}

export function DepartmentBudgetPanel({ deptId, state, onChange }: DepartmentBudgetPanelProps) {
  const dept = DEPTS.find((d) => d.id === deptId)!;
  const items = state.expenses[deptId];
  const alloc = state.alloc[deptId];
  const totals = departmentTotals(state, deptId);

  function updateItem(itemId: string, patch: Partial<(typeof items)[number]>) {
    onChange({
      ...state,
      expenses: {
        ...state.expenses,
        [deptId]: items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      },
    });
  }

  function addItem() {
    onChange({
      ...state,
      expenses: {
        ...state.expenses,
        [deptId]: [
          ...items,
          { id: makeId(), name: 'Yeni kalem', cur: 'USD' as ButceCurrency, plan: zeroMonths(), actual: zeroMonths() },
        ],
      },
    });
  }

  function removeItem(itemId: string) {
    onChange({
      ...state,
      expenses: { ...state.expenses, [deptId]: items.filter((it) => it.id !== itemId) },
    });
  }

  function setAllocMode(mode: 'fixed' | 'pct') {
    onChange({ ...state, alloc: { ...state.alloc, [deptId]: { ...alloc, mode } } });
  }

  function setAllocPct(pct: number) {
    onChange({ ...state, alloc: { ...state.alloc, [deptId]: { ...alloc, pct } } });
  }

  function setAllocFixedMonth(month: number, value: number) {
    onChange({
      ...state,
      alloc: {
        ...state.alloc,
        [deptId]: { ...alloc, fixed: alloc.fixed.map((v, m) => (m === month ? value : v)) },
      },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{dept.name}</h2>
        <p className="text-sm text-muted-foreground">{dept.sub}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <span className="text-xs font-mono uppercase text-muted-foreground">
          Bütçe alokasyonu (USD)
        </span>
        <Select value={alloc.mode} onValueChange={(v) => setAllocMode(v as 'fixed' | 'pct')}>
          <SelectTrigger className="w-48" aria-label="Alokasyon modu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Sabit tutar</SelectItem>
            <SelectItem value="pct">Net gelirin %'si</SelectItem>
          </SelectContent>
        </Select>
        {alloc.mode === 'pct' ? (
          <Input
            type="number"
            step="any"
            className="h-8 w-24"
            value={alloc.pct || ''}
            placeholder="%"
            aria-label="Alokasyon yüzdesi"
            onChange={(e) => setAllocPct(Number(e.target.value) || 0)}
          />
        ) : (
          <span className="text-xs text-muted-foreground">aylık tutarlar tabloda ↓</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Yıllık alokasyon" amount={totals.alloc} icon={Wallet} currency="USD" tone="default" />
        <KpiCard title="Bütçelenen harcama" amount={totals.plan} icon={TrendingUp} currency="USD" tone="default" />
        <KpiCard title="Gerçekleşen" amount={totals.actual} icon={TrendingDown} currency="USD" tone="default" />
        <KpiCard title="Kalan fark" amount={totals.remaining} icon={Scale} currency="USD" />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kalem</TableHead>
              <TableHead>Birim</TableHead>
              {BUTCE_MONTHS.map((m) => (
                <TableHead key={m} className="text-right">{m}</TableHead>
              ))}
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const planTotal = item.plan.reduce((s, v) => s + v, 0);
              const actualTotal = item.actual.reduce((s, v) => s + v, 0);
              return (
                <>
                  <TableRow key={`${item.id}-plan`}>
                    <TableCell>
                      <Input
                        value={item.name}
                        className="h-8 font-medium"
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={item.cur} onValueChange={(v) => updateItem(item.id, { cur: v as ButceCurrency })}>
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTCE_CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <MonthRow
                      values={item.plan}
                      ariaLabelPrefix={`${item.name} bütçe`}
                      onChange={(month, value) =>
                        updateItem(item.id, { plan: item.plan.map((v, m) => (m === month ? value : v)) })
                      }
                    />
                    <TableCell className="text-right font-mono">{formatCurrency(planTotal, item.cur, { showCode: true })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" aria-label="Kalemi sil" onClick={() => removeItem(item.id)}>
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${item.id}-actual`} className="text-muted-foreground">
                    <TableCell className="text-xs">gerçekleşen</TableCell>
                    <TableCell />
                    <MonthRow
                      values={item.actual}
                      dashed
                      ariaLabelPrefix={`${item.name} gerçekleşen`}
                      onChange={(month, value) =>
                        updateItem(item.id, { actual: item.actual.map((v, m) => (m === month ? value : v)) })
                      }
                    />
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(actualTotal, item.cur, { showCode: true })}</TableCell>
                    <TableCell />
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={addItem}>+ Kalem ekle</Button>

      <p className="text-xs text-muted-foreground">
        Kur varsayımları Konsolide ekranından yönetilir. Gerçekleşen satırı boşsa fark hesabı yalnız alokasyona göre okunur.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.test.tsx`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.tsx src/pages/admin/muhasebe/butce/DepartmentBudgetPanel.test.tsx
git commit -m "feat(muhasebe): add DepartmentBudgetPanel for bütçe sekmesi"
```

---

### Task 9: Gelir paneli — `RevenuePanel.tsx`

**Files:**
- Create: `src/pages/admin/muhasebe/butce/RevenuePanel.tsx`
- Test: `src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx`

**Interfaces:**
- Consumes: `MonthRow` (Task 7), `revGross`/`revComm`/`revNet` (Task 3), `KpiCard`, `formatCurrency`, `BUTCE_MONTHS`, `makeId`, `zeroMonths`, `ButceYearState`.
- Produces: `interface RevenuePanelProps { state: ButceYearState; onChange: (next: ButceYearState) => void }` ve `function RevenuePanel(props: RevenuePanelProps): JSX.Element`.

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RevenuePanel } from '@/pages/admin/muhasebe/butce/RevenuePanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

describe('RevenuePanel', () => {
  it('renders the seeded revenue rows and add-item button', () => {
    const state = seedYear();
    render(<RevenuePanel state={state} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Subscription')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ana sponsor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gelir kalemi ekle/i })).toBeInTheDocument();
  });

  it('calls onChange with an added revenue item', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<RevenuePanel state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Gelir kalemi ekle/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.revenue).toHaveLength(state.revenue.length + 1);
  });

  it('calls onChange with the item removed when its delete button is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<RevenuePanel state={state} onChange={onChange} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Kalemi sil/i });
    await userEvent.click(deleteButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next.revenue).toHaveLength(state.revenue.length - 1);
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/admin/muhasebe/butce/RevenuePanel'`

- [ ] **Step 3: Bileşeni yaz**

```typescript
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

export function RevenuePanel({ state, onChange }: RevenuePanelProps) {
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
        <KpiCard title="Yıllık brüt gelir" amount={totalGross} icon={TrendingUp} currency="USD" />
        <KpiCard title="Komisyon kesintisi" amount={-totalComm} icon={CircleDollarSign} currency="USD" tone="negative" />
        <KpiCard title="Yıllık net gelir" amount={totalNet} icon={TrendingUp} currency="USD" />
        <KpiCard title="Efektif komisyon" amount={effectiveComm} icon={Percent} displayAsCount />
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
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/muhasebe/butce/RevenuePanel.tsx src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx
git commit -m "feat(muhasebe): add RevenuePanel for bütçe sekmesi"
```

---

### Task 10: Konsolide panel — `ConsolidatedCashflowPanel.tsx`

**Files:**
- Create: `src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.tsx`
- Test: `src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.test.tsx`

**Interfaces:**
- Consumes: `consolidatedMonthlyNet`, `cumulativeCash`, `runwayMonthsIndex`, `averageMonthlyBurn`, `revNet`, `deptPlanUSD`, `deptActualUSD` (Task 3), `DEPTS`, `BUTCE_MONTHS`, `ButceYearState`.
- Produces: `interface ConsolidatedCashflowPanelProps { state: ButceYearState; onChange: (next: ButceYearState) => void }` ve `function ConsolidatedCashflowPanel(props: ConsolidatedCashflowPanelProps): JSX.Element`.

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConsolidatedCashflowPanel } from '@/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

describe('ConsolidatedCashflowPanel', () => {
  it('renders opening balance, fx params, and basis selector', () => {
    const state = seedYear();
    render(<ConsolidatedCashflowPanel state={state} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/Açılış nakit bakiyesi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/1 EUR/i)).toHaveValue(1.08);
    expect(screen.getByRole('combobox', { name: /Gider bazı/i })).toBeInTheDocument();
  });

  it('shows a 12-ay+ runway message when cumulative cash never goes negative', () => {
    const state = seedYear();
    render(<ConsolidatedCashflowPanel state={state} onChange={vi.fn()} />);
    expect(screen.getByText(/12\+ ay/i)).toBeInTheDocument();
  });

  it('calls onChange with the updated opening balance', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<ConsolidatedCashflowPanel state={state} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/Açılış nakit bakiyesi/i), '5000');
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.opening).toBe(5000);
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel'`

- [ ] **Step 3: Bileşeni yaz**

```typescript
// src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.tsx
// Bütçe sekmesi — konsolide nakit akışı, parametreler ve runway özeti.

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
            value={state.opening || ''}
            onChange={(e) => onChange({ ...state, opening: Number(e.target.value) || 0 })}
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
            value={state.fx.EUR || ''}
            onChange={(e) => onChange({ ...state, fx: { ...state.fx, EUR: Number(e.target.value) || 0 } })}
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
            value={state.fx.TRY || ''}
            onChange={(e) => onChange({ ...state, fx: { ...state.fx, TRY: Number(e.target.value) || 0 } })}
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
        <KpiCard title="Yıllık net gelir" amount={totalNetRev} icon={TrendingUp} currency="USD" />
        <KpiCard title="Yıllık toplam gider" amount={totalExp} icon={TrendingDown} currency="USD" />
        <KpiCard title="Yıllık net akış" amount={yearNet} icon={Wallet} currency="USD" />
        <KpiCard title="Yıl sonu nakit" amount={endCash} icon={Wallet} currency="USD" />
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
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.tsx src/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel.test.tsx
git commit -m "feat(muhasebe): add ConsolidatedCashflowPanel with runway summary"
```

---

### Task 11: CSV export yardımcı fonksiyonu

**Files:**
- Create: `src/lib/muhasebe-butce-csv.ts`
- Test: `src/lib/muhasebe-butce-csv.test.ts`

**Interfaces:**
- Consumes: `revNet`, `revComm`, `deptPlanUSD`, `deptActualUSD` (Task 3), `DEPTS`, `BUTCE_MONTHS`, `ButceYearState`.
- Produces: `function buildButceCsv(year: string, state: ButceYearState): string` (satırları `\r\n` ile birleştirilmiş, BOM'suz CSV içeriği — BOM eklemek çağıran tarafın işi, test edilebilirlik için ayrılır) ve `function downloadButceCsv(year: string, state: ButceYearState): void` (Blob oluşturup indirmeyi tetikler, `document`/`URL` kullanır — DOM'a bağımlı olduğu için test edilmez, `buildButceCsv` çıktısını sarar).

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/lib/muhasebe-butce-csv.test.ts
import { describe, expect, it } from 'vitest';
import { buildButceCsv } from '@/lib/muhasebe-butce-csv';
import { seedYear, type ButceYearState } from '@/lib/muhasebe-butce-schemas';

describe('buildButceCsv', () => {
  it('includes a header row with the year and basis', () => {
    const csv = buildButceCsv('2026', seedYear());
    const firstLine = csv.split('\r\n')[0];
    expect(firstLine).toContain('2026');
    expect(firstLine).toContain('Bütçe');
  });

  it('includes one row per revenue item plus commission, net revenue, department, total expense, and net cashflow rows', () => {
    const state = seedYear();
    const csv = buildButceCsv('2026', state);
    const lines = csv.split('\r\n');
    expect(lines.some((l) => l.startsWith('"Subscription (brüt)"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Komisyon kesintisi"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Net gelir"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Teknoloji & Altyapı"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Toplam gider"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Aylık net nakit akışı"'))).toBe(true);
    expect(lines.some((l) => l.startsWith('"Kümülatif nakit"'))).toBe(true);
  });

  it('escapes double quotes inside item names', () => {
    const base = seedYear();
    const state: ButceYearState = {
      ...base,
      revenue: base.revenue.map((r, idx) => (idx === 0 ? { ...r, name: 'Ürün "Pro"' } : r)),
    };
    const csv = buildButceCsv('2026', state);
    expect(csv).toContain('"Ürün ""Pro"" (brüt)"');
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-csv.test.ts`
Expected: FAIL — `Cannot find module '@/lib/muhasebe-butce-csv'`

- [ ] **Step 3: Implementasyonu yaz**

```typescript
// src/lib/muhasebe-butce-csv.ts
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
```

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/lib/muhasebe-butce-csv.test.ts`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/lib/muhasebe-butce-csv.ts src/lib/muhasebe-butce-csv.test.ts
git commit -m "feat(muhasebe): add CSV export for bütçe sekmesi"
```

---

### Task 12: Container sayfası — `ButcePage.tsx`

**Files:**
- Create: `src/pages/admin/muhasebe/butce/ButcePage.tsx`
- Test: `src/pages/admin/muhasebe/butce/ButcePage.test.tsx`

**Interfaces:**
- Consumes: `useButceYear`, `useDebouncedButceSave` (Task 5/6, `@/hooks/useMuhasebeButce`), `DepartmentBudgetPanel` (Task 8), `RevenuePanel` (Task 9), `ConsolidatedCashflowPanel` (Task 10), `downloadButceCsv` (Task 11), `DEPTS`, `BUTCE_YEARS` (Task 2).
- Produces: `export default function ButcePage(): JSX.Element` — `routes.tsx` (Task 13) bu bileşeni lazy-import eder.

- [ ] **Step 1: Failing testi yaz**

```typescript
// src/pages/admin/muhasebe/butce/ButcePage.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ButcePage from '@/pages/admin/muhasebe/butce/ButcePage';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

vi.mock('@/hooks/useMuhasebeButce', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useMuhasebeButce')>(
    '@/hooks/useMuhasebeButce',
  );
  return {
    ...actual,
    useButceYear: () => ({ data: seedYear(), isLoading: false }),
    useDebouncedButceSave: () => ({ save: vi.fn(), status: 'idle' }),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ButcePage', () => {
  it('renders the year selector and defaults to the Teknoloji tab', () => {
    renderWithClient(<ButcePage />);
    expect(screen.getByRole('combobox', { name: /Yıl/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Teknoloji & Altyapı' })).toBeInTheDocument();
  });

  it('switches to the Platform Gelirleri panel when its tab is clicked', async () => {
    renderWithClient(<ButcePage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gelirler' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Platform Gelirleri' })).toBeInTheDocument());
  });

  it('renders a CSV download button', () => {
    renderWithClient(<ButcePage />);
    expect(screen.getByRole('button', { name: /CSV indir/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi çalıştırıp fail ettiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/ButcePage.test.tsx`
Expected: FAIL — `Cannot find module '@/pages/admin/muhasebe/butce/ButcePage'`

- [ ] **Step 3: Sayfayı yaz**

```typescript
// src/pages/admin/muhasebe/butce/ButcePage.tsx
// Bütçe sekmesi — container: yıl seçici, CSV indirme, iç-sekme yönetimi, autosave.

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useButceYear, useDebouncedButceSave } from '@/hooks/useMuhasebeButce';
import { downloadButceCsv } from '@/lib/muhasebe-butce-csv';
import { BUTCE_YEARS, DEPTS, type ButceYearState } from '@/lib/muhasebe-butce-schemas';
import { DepartmentBudgetPanel } from '@/pages/admin/muhasebe/butce/DepartmentBudgetPanel';
import { RevenuePanel } from '@/pages/admin/muhasebe/butce/RevenuePanel';
import { ConsolidatedCashflowPanel } from '@/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel';

export default function ButcePage() {
  const [year, setYear] = useState<string>(BUTCE_YEARS[0]);
  const [activeTab, setActiveTab] = useState<string>(DEPTS[0].id);
  const [localState, setLocalState] = useState<ButceYearState | null>(null);

  const yearNum = Number(year);
  const { data: fetchedState, isLoading } = useButceYear(yearNum);
  const { save, status } = useDebouncedButceSave(yearNum);

  useEffect(() => {
    if (fetchedState) setLocalState(fetchedState);
  }, [fetchedState]);

  function handleChange(next: ButceYearState) {
    setLocalState(next);
    save(next);
  }

  if (isLoading || !localState) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>;
  }

  const saveLabel = status === 'saving' ? 'kaydediliyor…' : status === 'saved' ? 'kaydedildi' : status === 'error' ? 'kayıt hatası' : '·';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bütçe Konsolu</h1>
          <p className="text-sm text-muted-foreground">Departman bazlı yıllık bütçe, alokasyon ve nakit akışı planlaması</p>
        </div>
        <div className="flex-1" />
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28" aria-label="Yıl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BUTCE_YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => downloadButceCsv(year, localState)}>
          <Download className="h-4 w-4 mr-2" aria-hidden="true" />
          CSV indir
        </Button>
        <span className="text-xs font-mono text-muted-foreground">{saveLabel}</span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {DEPTS.map((d) => (
            <TabsTrigger key={d.id} value={d.id}>{d.name}</TabsTrigger>
          ))}
          <TabsTrigger value="rev">Gelirler</TabsTrigger>
          <TabsTrigger value="cons">Konsolide</TabsTrigger>
        </TabsList>

        {DEPTS.map((d) => (
          <TabsContent key={d.id} value={d.id}>
            <DepartmentBudgetPanel deptId={d.id} state={localState} onChange={handleChange} />
          </TabsContent>
        ))}
        <TabsContent value="rev">
          <RevenuePanel state={localState} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="cons">
          <ConsolidatedCashflowPanel state={localState} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

Not: test dosyasındaki "Gelirler" sekme adı `TabsTrigger` metniyle eşleşiyor (`value="rev"`, label `"Gelirler"`) — spec'teki panel başlığı "Platform Gelirleri" ile karışmaz, ikisi ayrı metin.

- [ ] **Step 4: Testleri çalıştırıp geçtiğini doğrula**

Run: `npm run test -- src/pages/admin/muhasebe/butce/ButcePage.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/muhasebe/butce/ButcePage.tsx src/pages/admin/muhasebe/butce/ButcePage.test.tsx
git commit -m "feat(muhasebe): add ButcePage container with year selector and CSV export"
```

---

### Task 13: Route ve sekme kaydı — `routes.tsx` + `MuhasebeLayout.tsx`

**Files:**
- Modify: `src/pages/admin/muhasebe/routes.tsx`
- Modify: `src/pages/admin/muhasebe/MuhasebeLayout.tsx`
- Delete: `muhasebenew.html`

**Interfaces:**
- Consumes: `ButcePage` (Task 12, default export, lazy-import edilir).
- Produces: `/admin/muhasebe/butce` route'u aktif; `MuhasebeLayout` sekme çubuğunda "Bütçe" görünür.

- [ ] **Step 1: `routes.tsx`'e lazy import ve route ekle**

`src/pages/admin/muhasebe/routes.tsx` dosyasında:

```typescript
// Mevcut lazy import bloğunun yanına ekle
const ButcePage = lazy(() => import('./butce/ButcePage'));
```

```tsx
{/* NakitAkisiPage Route bloğunun hemen sonrasına, </Route> kapanışından önce ekle */}
<Route
  path="butce"
  element={
    <Suspense fallback={<PageFallback />}>
      <ButcePage />
    </Suspense>
  }
/>
```

- [ ] **Step 2: `MuhasebeLayout.tsx`'teki `TABS` dizisine "Bütçe" ekle**

```typescript
// src/pages/admin/muhasebe/MuhasebeLayout.tsx
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, TrendingDown, TrendingUp, LineChart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'giderler', label: 'Giderler', icon: TrendingDown, end: false },
  { to: 'gelirler', label: 'Gelirler', icon: TrendingUp, end: false },
  { to: 'nakit-akisi', label: 'Nakit Akışı', icon: LineChart, end: false },
  { to: 'butce', label: 'Bütçe', icon: Wallet, end: false },
] as const;
```

(Sadece `import` satırına `Wallet` eklenir ve `TABS` dizisine son satır eklenir; dosyanın kalanı değişmez.)

- [ ] **Step 3: `muhasebenew.html`'i sil**

```bash
git rm muhasebenew.html
```

- [ ] **Step 4: Tip kontrolü ve build doğrulaması**

Run: `npx tsc --noEmit`
Expected: yeni dosyalarla ilgili hata yok.

Run: `npm run build`
Expected: başarılı build (code-split chunk `ButcePage` dahil).

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/muhasebe/routes.tsx src/pages/admin/muhasebe/MuhasebeLayout.tsx
git commit -m "feat(muhasebe): wire up /admin/muhasebe/butce route and remove static prototype

Removed muhasebenew.html — its budget-console prototype now lives at
/admin/muhasebe/butce as a proper React route backed by Supabase."
```

---

### Task 14: Manuel doğrulama (dev sunucusu üzerinde)

**Files:** yok (yalnız doğrulama adımı)

- [ ] **Step 1: Dev sunucusunu başlat**

Run: `npm run dev`
Expected: `http://localhost:8080` ayakta.

- [ ] **Step 2: Tarayıcıda admin girişiyle `/admin/muhasebe/butce`'a git**

- Sekme çubuğunda "Bütçe" sekmesinin göründüğünü doğrula.
- Teknoloji panelinde bir gider tutarı gir, ~1 saniye sonra "kaydedildi" mesajını gör.
- Sayfayı yenile — girilen tutarın kalıcı olduğunu doğrula (Supabase'e yazıldığını kanıtlar).
- Gelirler sekmesine geç, bir adet gir, komisyon hesabının değiştiğini gör.
- Konsolide sekmesine geç, runway metninin ve grafiğin güncellendiğini gör.
- "CSV indir" butonuna bas, dosyanın Türkçe karakterleri (İ, ş, ç) doğru gösterdiğini Excel/Notepad'de doğrula (BOM kontrolü).

- [ ] **Step 3: Bulunan sorunları not al ve gerekirse ilgili task'a geri dön**

Bu adımda kod değişikliği yapılmaz — yalnızca doğrulama. Sorun bulunursa ilgili Task'ın dosyasına dönüp düzeltme yapılır ve o Task'ın commit'i güncellenir (yeni bir fix commit'i olarak, mevcut commit amend edilmez).
