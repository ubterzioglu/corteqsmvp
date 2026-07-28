# Muhasebe → Bütçe Sekmesi (design)

**Tarih:** 2026-07-28
**Durum:** Onaylandı

## Bağlam

Kök dizine `muhasebenew.html` adında bağımsız, tek-dosyalık statik bir "Bütçe Konsolu" prototipi eklendi (vanilla JS, `window.storage` ile kalıcılık). Bu araç mevcut muhasebe modülünden (gelirler/giderler/nakit akışı — `expenses`/`incomes` tabloları) tamamen ayrı bir veri modeline sahip: departman bazlı yıllık bütçe planı, çoklu para birimi, gelir alokasyonu, runway hesaplama.

Hedef: bu prototipi statik HTML olarak **tutmadan**, muhasebe modülünün mevcut mimari desenine (`src/lib/muhasebe-*.ts`, `src/pages/admin/muhasebe/*`, React Query + Supabase) uygun bir React route/sekme olarak entegre etmek. `muhasebenew.html` dosyası silinecek.

## Kapsam

- `/admin/muhasebe/butce` route'u, `MuhasebeLayout` sekme çubuğuna "Bütçe" girişi.
- Orijinal HTML'deki tüm işlevsellik: 4 departman (Teknoloji, Pazarlama, Personel, İdari) bütçe/gerçekleşen tablosu, alokasyon (sabit/yüzde), gelir tablosu (adet × birim fiyat × komisyon), konsolide nakit akışı + runway grafiği, CSV export.
- Departman ve gelir kalemi **seed listeleri sabit kodlanmış kalır** (orijinal HTML ile aynı); kullanıcı satır ekleyip silebilir ama departman/gelir-kategorisi seti değişmez.
- Veri kalıcılığı: yeni Supabase tablosu, JSON state blob (yıla göre).

Kapsam dışı: departmanların dinamik olarak eklenip çıkarılması, normalize edilmiş ilişkisel şema.

## Veri modeli

Yeni migration — `muhasebe_butce_state`:

```sql
create table public.muhasebe_butce_state (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.muhasebe_butce_state enable row level security;

create policy "admin_all_muhasebe_butce_state"
  on public.muhasebe_butce_state
  for all
  using (is_admin())
  with check (is_admin());
```

`state` sütunu, orijinal HTML'deki `state.years[year]` objesinin JSON karşılığı:

```ts
interface ButceYearState {
  fx: { EUR: number; TRY: number };
  opening: number;
  basis: 'plan' | 'actual';
  expenses: Record<DeptId, ButceExpenseItem[]>;
  revenue: ButceRevenueItem[];
  alloc: Record<DeptId, ButceAllocation>;
}

interface ButceExpenseItem {
  id: string;
  name: string;
  cur: 'USD' | 'EUR' | 'TRY';
  plan: number[];   // 12 ay
  actual: number[]; // 12 ay
}

interface ButceRevenueItem {
  id: string;
  name: string;
  price: number;
  comm: number;     // % komisyon
  qty: number[];    // 12 ay
}

interface ButceAllocation {
  mode: 'fixed' | 'pct';
  fixed: number[]; // 12 ay, USD
  pct: number;     // net gelirin %'si
}

type DeptId = 'tech' | 'mkt' | 'hr' | 'admin';
```

Departman/gelir seed'leri (`DEPTS`, `REV_SEEDS`) orijinal HTML'den birebir TS sabiti olarak taşınır.

## Dosya yapısı

```
supabase/migrations/<timestamp>_muhasebe_butce_state.sql

src/lib/muhasebe-butce-schemas.ts       # Zod şemaları + tip export'ları, DEPTS/REV_SEEDS sabitleri
src/lib/muhasebe-butce-api.ts           # fetchButceYear / upsertButceYear
src/lib/muhasebe-butce-aggregations.ts  # pure hesaplama fonksiyonları (deptPlanUSD, revNet, allocUSD, runway...)
src/lib/muhasebe-butce-aggregations.test.ts

src/hooks/useMuhasebeButce.ts           # React Query: useButceYear(year), debounce'lu autosave mutation

src/pages/admin/muhasebe/butce/
  ButcePage.tsx                # container: yıl seçici, CSV butonu, iç-sekme yönlendirme, state
  DepartmentBudgetPanel.tsx    # bir departmanın tablo + alokasyon + kartları
  RevenuePanel.tsx             # gelir tablosu + kartları
  ConsolidatedCashflowPanel.tsx# parametreler + runway bar grafiği + tablo
  BudgetMonthTable.tsx         # departman/gelir tablolarının paylaştığı ay-bazlı satır bileşeni
  BudgetKpiCards.tsx           # KpiCard'ları saran küçük yardımcı
```

`routes.tsx`'e eklenecek lazy route:

```tsx
const ButcePage = lazy(() => import('./butce/ButcePage'));
...
<Route path="butce" element={<Suspense fallback={<PageFallback />}><ButcePage /></Suspense>} />
```

`MuhasebeLayout.tsx` `TABS` dizisine:

```tsx
{ to: 'butce', label: 'Bütçe', icon: Wallet, end: false },
```

## Davranış detayları

1. **Yıl seçimi:** sabit `["2026","2027","2028"]` listesi (dropdown). Seçilen yıl DB'de yoksa `seedYear()` ile default state üretilir, ilk değişiklikte insert edilir; varsa `fetchButceYear` ile çekilir.
2. **Autosave:** input `onChange`/`onBlur` sonrası state güncellenir, 700ms debounce ile `upsertButceYear` çağrılır (orijinal `scheduleSave` mantığı). UI'da küçük "kaydediliyor… / kaydedildi" göstergesi (orijinal `#saveState` karşılığı).
3. **İç sekmeler:** `ButcePage` içinde `Tabs` (shadcn) ile Teknoloji/Pazarlama/Personel/İdari/Gelirler/Konsolide arası geçiş — ayrı route değil, tek route içinde state (orijinal `activeTab` ile aynı UX, URL'i kirletmez).
4. **Hesaplamalar:** `muhasebe-butce-aggregations.ts` içindeki pure fonksiyonlar orijinal HTML'deki `deptPlanUSD`, `deptActualUSD`, `revGross/revComm/revNet`, `allocUSD` fonksiyonlarının birebir TS karşılığı; state mutasyonu yok, her render'da `useMemo` ile türetilir.
5. **CSV export:** orijinal `exportCSV` algoritması aynen taşınır; UTF-8 BOM'lu Blob (proje kuralı ile zaten uyumlu).
6. **Stil:** custom CSS atılır, mevcut shadcn/Tailwind bileşenleri (Card, Table, Input, Select, Tabs, Button) kullanılır — diğer muhasebe sayfalarıyla görsel tutarlılık.
7. **Silinecek:** kök dizindeki `muhasebenew.html`.

## Test

- `muhasebe-butce-aggregations.test.ts`: departman toplamları, alokasyon (fixed/pct), gelir net/komisyon, runway/burn hesaplaması için unit testler (mevcut `muhasebe-aggregations.test.ts` deseniyle aynı stil).
- Var olan `MuhasebeDashboard.test.tsx` vb. testler etkilenmez; yeni route için en az bir smoke test (`ButcePage.test.tsx`) eklenir.

## Riskler / notlar

- `is_admin()` RPC zaten mevcut (`src/lib/admin.ts`) — RLS policy'de doğrudan kullanılabilir.
- Migration sırası: mevcut 221 migration'a ekleme, sıra bozulmaz.
- JSON blob şeması ileride normalize edilmek istenirse, bu spec bilinçli olarak o adımı kapsam dışı bırakıyor (YAGNI).
