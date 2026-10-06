-- A7 · İlan kotası + okuma RPC'leri (Premium kilidi hazırlığı)
--
-- Yeni tablo: job_listing_views (kullanıcı bazlı görüntüleme kaydı)
-- Ayar: cadde_settings 'jobs.free_view_limit' = 5
-- RPC'ler: list_job_listings_public, get_job_listing_detail_v1, get_my_listing_quota_v1
--
-- Kaynak: docs/plans/2026-10-05-birlesik-plan-cv-ilan-rol-talepleri.md A7

begin;

-- ── 1. job_listing_views tablosu ─────────────────────────────────────────────
create table if not exists public.job_listing_views (
  user_id uuid not null,
  listing_id uuid not null,
  first_viewed_at timestamptz not null default now(),
  constraint job_listing_views_pkey primary key (user_id, listing_id),
  constraint job_listing_views_listing_id_fkey foreign key (listing_id)
    references public.job_listings(id) on delete cascade
);

alter table public.job_listing_views enable row level security;

-- RLS: kullanıcı yalnız kendi satırını okuyabilir, yazma yok
drop policy if exists "job_listing_views user read own" on public.job_listing_views;
create policy "job_listing_views user read own"
  on public.job_listing_views for select
  using (auth.uid() = user_id);

-- Yazma yetkisi: yalnız RPC (security definer)
revoke all on public.job_listing_views from public, anon;
grant select on public.job_listing_views to authenticated;

-- ── 2. Ayar: jobs.free_view_limit = 5 ────────────────────────────────────────
insert into public.cadde_settings (key, value)
values ('jobs.free_view_limit', '5'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── 3. list_job_listings_public (liste, herkese açık) ────────────────────────
-- Yalnız liste kolonları: id, business_name, title, department, employment_type,
-- location_type, country, city, location, package, status, created_at, hide_business_name.
-- Detay kolonları (description, requirements, salary_*) bu RPC'de DÖNMEZ.
create or replace function public.list_job_listings_public(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  business_name text,
  title text,
  department text,
  employment_type text,
  location_type text,
  country text,
  city text,
  location text,
  package text,
  status text,
  created_at timestamptz,
  hide_business_name boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    jl.id,
    case when jl.hide_business_name then null else jl.business_name end as business_name,
    jl.title,
    jl.department,
    jl.employment_type,
    jl.location_type,
    jl.country,
    jl.city,
    jl.location,
    jl.package,
    jl.status,
    jl.created_at,
    jl.hide_business_name
  from public.job_listings jl
  where jl.status = 'published'
    and (jl.expires_at is null or jl.expires_at > now())
  order by jl.created_at desc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.list_job_listings_public(integer, integer) from public, anon;
grant execute on function public.list_job_listings_public(integer, integer) to authenticated, anon;

-- ── 4. get_job_listing_detail_v1 (detay, kota kontrollü) ─────────────────────
-- Giriş yok → career_login_required
-- İlan yok → career_listing_not_found
-- career.listing.view_unlimited açık → detay (hak harcanmaz)
-- Daha önce açılmış → detay (hak harcanmaz)
-- Farklı ilan sayısı ≥ limit → career_listing_limit_reached, detay DÖNMEZ
-- Aksi halde satır ekle + detay
create or replace function public.get_job_listing_detail_v1(
  p_listing_id uuid
)
returns table (
  id uuid,
  business_name text,
  title text,
  department text,
  employment_type text,
  location_type text,
  country text,
  city text,
  location text,
  description text,
  requirements text,
  salary_min numeric,
  salary_max numeric,
  currency text,
  package text,
  status text,
  created_at timestamptz,
  hide_business_name boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit integer;
  v_viewed_count integer;
  v_already_viewed boolean;
  v_has_unlimited boolean;
begin
  -- Giriş kontrolü
  if v_uid is null then
    raise exception 'career_login_required' using errcode = '28000';
  end if;

  -- İlan var mı?
  if not exists (select 1 from public.job_listings where id = p_listing_id and status = 'published') then
    raise exception 'career_listing_not_found' using errcode = 'P0002';
  end if;

  -- Limit ayarı
  select coalesce((value #>> '{}')::integer, 5) into v_limit
  from public.cadde_settings
  where key = 'jobs.free_view_limit';

  -- Kullanıcının daha önce bu ilanı açıp açmadığı
  select exists (
    select 1 from public.job_listing_views
    where user_id = v_uid and listing_id = p_listing_id
  ) into v_already_viewed;

  -- Premium kontrolü: career.listing.view_unlimited açık mı?
  select exists (
    select 1 from public.get_current_user_features()
    where feature_key = 'career.listing.view_unlimited' and is_enabled = true
  ) into v_has_unlimited;

  -- Premium veya daha önce açılmışsa → detay döner, hak harcanmaz
  if v_has_unlimited or v_already_viewed then
    return query
    select
      jl.id, jl.business_name, jl.title, jl.department, jl.employment_type,
      jl.location_type, jl.country, jl.city, jl.location, jl.description,
      jl.requirements, jl.salary_min, jl.salary_max, jl.currency,
      jl.package, jl.status, jl.created_at, jl.hide_business_name
    from public.job_listings jl
    where jl.id = p_listing_id;
    return;
  end if;

  -- Farklı ilan sayısı ≥ limit → kota doldu
  select count(distinct listing_id) into v_viewed_count
  from public.job_listing_views
  where user_id = v_uid;

  if v_viewed_count >= v_limit then
    raise exception 'career_listing_limit_reached' using errcode = 'P0001';
  end if;

  -- Satır ekle (advisory lock/unique ile yarış kontrolü)
  insert into public.job_listing_views (user_id, listing_id)
  values (v_uid, p_listing_id)
  on conflict (user_id, listing_id) do nothing;

  -- Detay döner
  return query
  select
    jl.id, jl.business_name, jl.title, jl.department, jl.employment_type,
    jl.location_type, jl.country, jl.city, jl.location, jl.description,
    jl.requirements, jl.salary_min, jl.salary_max, jl.currency,
    jl.package, jl.status, jl.created_at, jl.hide_business_name
  from public.job_listings jl
  where jl.id = p_listing_id;
end;
$$;

revoke all on function public.get_job_listing_detail_v1(uuid) from public, anon;
grant execute on function public.get_job_listing_detail_v1(uuid) to authenticated;

-- ── 5. get_my_listing_quota_v1 (kalan hak) ───────────────────────────────────
create or replace function public.get_my_listing_quota_v1()
returns table (
  limit_total integer,
  viewed_count integer,
  remaining integer,
  has_unlimited boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((select (value #>> '{}')::integer from public.cadde_settings where key = 'jobs.free_view_limit'), 5) as limit_total,
    (select count(distinct listing_id) from public.job_listing_views where user_id = auth.uid()) as viewed_count,
    coalesce(
      (select (value #>> '{}')::integer from public.cadde_settings where key = 'jobs.free_view_limit'), 5
    ) - (select count(distinct listing_id) from public.job_listing_views where user_id = auth.uid()) as remaining,
    exists (
      select 1 from public.get_current_user_features()
      where feature_key = 'career.listing.view_unlimited' and is_enabled = true
    ) as has_unlimited;
$$;

revoke all on function public.get_my_listing_quota_v1() from public, anon;
grant execute on function public.get_my_listing_quota_v1() to authenticated;

-- ── 6. Yorumlar ──────────────────────────────────────────────────────────────
comment on table public.job_listing_views is
  'A7: Kullanıcı bazlı iş ilanı görüntüleme kaydı. Premium kilidi için kota takibi.';

comment on function public.get_job_listing_detail_v1 is
  'A7: İş ilanı detayını döner. Kota kontrollü: Free kullanıcı 5 farklı ilan açabilir. '
  'Hata kodları: career_login_required, career_listing_not_found, career_listing_limit_reached.';

commit;
