-- =====================================================================
-- CorteQS Muhasebe Modülü
-- Şirket kurulana kadar geçici muhasebe için Gider/Gelir takip sistemi
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ENUM TİPLERİ
-- ---------------------------------------------------------------------

-- Gider kategorileri
do $$ begin
  create type public.expense_category as enum (
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
    'diger_gider'
  );
exception when duplicate_object then null; end $$;

-- Gelir kategorileri
do $$ begin
  create type public.income_category as enum (
    'pilot_gelir',
    'danismanlik_geliri',
    'hibe_grant',
    'yatirim_taahhudu',
    'demo_geliri',
    'diger_gelir'
  );
exception when duplicate_object then null; end $$;

-- Para birimleri
do $$ begin
  create type public.currency_code as enum ('TRY', 'USD', 'EUR', 'GBP', 'QAR');
exception when duplicate_object then null; end $$;

-- Gider ödeme durumu
do $$ begin
  create type public.expense_status as enum ('odendi', 'bekliyor', 'iptal');
exception when duplicate_object then null; end $$;

-- Gelir tahsilat durumu
do $$ begin
  create type public.income_status as enum ('tahsil_edildi', 'bekliyor', 'iptal');
exception when duplicate_object then null; end $$;

-- Ödeme yöntemi
do $$ begin
  create type public.payment_method as enum (
    'sanal_kart_burak',
    'sanal_kart_baris',
    'kisisel_kart_burak',
    'kisisel_kart_baris',
    'havale_eft',
    'nakit',
    'diger'
  );
exception when duplicate_object then null; end $$;

-- Kişi (hangi kurucuya ait gider)
do $$ begin
  create type public.person_type as enum ('burak', 'baris', 'ortak');
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 2) TABLOLAR
-- ---------------------------------------------------------------------

-- Giderler tablosu
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  person public.person_type not null,
  category public.expense_category not null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency public.currency_code not null default 'TRY',
  status public.expense_status not null default 'bekliyor',
  payment_method public.payment_method,
  invoice_url text,
  note text,
  is_virtual_card boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.expenses is 'CorteQS gider kayıtları — şirket kurulana kadar geçici muhasebe';

create index if not exists idx_expenses_date on public.expenses (expense_date desc);
create index if not exists idx_expenses_person on public.expenses (person);
create index if not exists idx_expenses_category on public.expenses (category);
create index if not exists idx_expenses_status on public.expenses (status);
create index if not exists idx_expenses_currency on public.expenses (currency);


-- Gelirler tablosu
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  income_date date not null,
  source text not null,
  category public.income_category not null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency public.currency_code not null default 'TRY',
  status public.income_status not null default 'bekliyor',
  link text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.incomes is 'CorteQS gelir kayıtları — şirket kurulana kadar geçici muhasebe';

create index if not exists idx_incomes_date on public.incomes (income_date desc);
create index if not exists idx_incomes_category on public.incomes (category);
create index if not exists idx_incomes_status on public.incomes (status);
create index if not exists idx_incomes_currency on public.incomes (currency);


-- ---------------------------------------------------------------------
-- 3) updated_at TRIGGERLARI
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_incomes_updated_at on public.incomes;
create trigger trg_incomes_updated_at
  before update on public.incomes
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 4) ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.expenses enable row level security;
alter table public.incomes  enable row level security;

-- Admin kontrolü için yardımcı fonksiyon
-- Mevcut public.admin_users tablosunu kullanır (tech stack'e göre zaten var)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = uid
  );
$$;

-- Expenses policies
drop policy if exists "admins_select_expenses" on public.expenses;
create policy "admins_select_expenses"
  on public.expenses for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_insert_expenses" on public.expenses;
create policy "admins_insert_expenses"
  on public.expenses for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "admins_update_expenses" on public.expenses;
create policy "admins_update_expenses"
  on public.expenses for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admins_delete_expenses" on public.expenses;
create policy "admins_delete_expenses"
  on public.expenses for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- Incomes policies
drop policy if exists "admins_select_incomes" on public.incomes;
create policy "admins_select_incomes"
  on public.incomes for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "admins_insert_incomes" on public.incomes;
create policy "admins_insert_incomes"
  on public.incomes for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

drop policy if exists "admins_update_incomes" on public.incomes;
create policy "admins_update_incomes"
  on public.incomes for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admins_delete_incomes" on public.incomes;
create policy "admins_delete_incomes"
  on public.incomes for delete
  to authenticated
  using (public.is_admin(auth.uid()));


-- ---------------------------------------------------------------------
-- 5) DASHBOARD VIEW'LARI (server-side aggregation)
-- ---------------------------------------------------------------------

-- KPI özeti (yalnızca TRY)
create or replace view public.v_muhasebe_kpi
with (security_invoker = true) as
select
  coalesce((select sum(amount) from public.expenses where currency = 'TRY'), 0)                                                as total_expense_try,
  coalesce((select sum(amount) from public.incomes  where currency = 'TRY'), 0)                                                as total_income_try,
  coalesce((select sum(amount) from public.incomes  where currency = 'TRY'), 0)
    - coalesce((select sum(amount) from public.expenses where currency = 'TRY'), 0)                                            as net_position_try,
  coalesce((select sum(amount) from public.expenses where currency = 'TRY' and status = 'bekliyor'), 0)                        as pending_expense_try,
  coalesce((select sum(amount) from public.incomes  where currency = 'TRY' and status = 'bekliyor'), 0)                        as pending_income_try,
  (select count(*) from public.expenses) + (select count(*) from public.incomes)                                               as total_records;

-- Kişi bazlı gider özeti
create or replace view public.v_muhasebe_by_person
with (security_invoker = true) as
select
  person,
  count(*)                                                 as record_count,
  coalesce(sum(amount) filter (where currency = 'TRY'), 0) as total_try,
  coalesce(sum(amount) filter (where currency = 'TRY' and status = 'odendi'), 0) as paid_try,
  coalesce(sum(amount) filter (where currency = 'TRY' and status = 'bekliyor'), 0) as pending_try
from public.expenses
group by person;

-- Kategori bazlı gider özeti
create or replace view public.v_muhasebe_by_category
with (security_invoker = true) as
select
  category,
  count(*)                                                 as record_count,
  coalesce(sum(amount) filter (where currency = 'TRY'), 0) as total_try
from public.expenses
group by category;

-- Aylık nakit akışı (tek sorguda tüm gerekli metrikler)
create or replace view public.v_muhasebe_cashflow_monthly
with (security_invoker = true) as
with months as (
  select generate_series(1, 12) as month_num
),
expense_monthly as (
  select
    extract(month from expense_date)::int as month_num,
    extract(year  from expense_date)::int as year_num,
    sum(amount) filter (where currency = 'TRY')                            as total_try,
    sum(amount) filter (where currency = 'TRY' and person  = 'burak')      as burak_try,
    sum(amount) filter (where currency = 'TRY' and person  = 'baris')      as baris_try,
    sum(amount) filter (where currency = 'TRY' and person  = 'ortak')      as ortak_try,
    sum(amount) filter (where currency = 'TRY' and status  = 'odendi')     as paid_try,
    sum(amount) filter (where currency = 'TRY' and status  = 'bekliyor')   as pending_try
  from public.expenses
  group by 1, 2
),
income_monthly as (
  select
    extract(month from income_date)::int as month_num,
    extract(year  from income_date)::int as year_num,
    sum(amount) filter (where currency = 'TRY')                              as total_try,
    sum(amount) filter (where currency = 'TRY' and status = 'tahsil_edildi') as collected_try,
    sum(amount) filter (where currency = 'TRY' and status = 'bekliyor')      as pending_try
  from public.incomes
  group by 1, 2
)
select
  coalesce(em.year_num, im.year_num, extract(year from current_date)::int) as year_num,
  m.month_num,
  coalesce(im.total_try, 0)        as income_try,
  coalesce(em.total_try, 0)        as expense_try,
  coalesce(im.total_try, 0) - coalesce(em.total_try, 0) as net_try,
  coalesce(em.burak_try, 0)        as burak_try,
  coalesce(em.baris_try, 0)        as baris_try,
  coalesce(em.ortak_try, 0)        as ortak_try,
  coalesce(em.paid_try, 0)         as expense_paid_try,
  coalesce(em.pending_try, 0)      as expense_pending_try,
  coalesce(im.collected_try, 0)    as income_collected_try,
  coalesce(im.pending_try, 0)      as income_pending_try
from months m
left join expense_monthly em on em.month_num = m.month_num
left join income_monthly  im on im.month_num = m.month_num
order by m.month_num;

-- View'lar RLS'i underlying tablolardan miras alır. Bunlara grant verelim.
grant select on public.v_muhasebe_kpi              to authenticated;
grant select on public.v_muhasebe_by_person        to authenticated;
grant select on public.v_muhasebe_by_category      to authenticated;
grant select on public.v_muhasebe_cashflow_monthly to authenticated;
