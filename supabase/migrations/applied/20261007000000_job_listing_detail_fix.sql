-- A7 düzeltmesi · get_job_listing_detail_v1 canlıda 400 veriyordu
--
-- İki hata (7 Ekim 2026, /ilanlar/<id> "İşlem tamamlanamadı"):
-- 1. `returns table (id, status, ...)` OUT değişkenleri yaratır; gövdede çıplak
--    `where id = ... and status = ...` 42702 "column reference id is ambiguous" veriyordu.
--    → tablo takma adıyla (jl0) nitelendirildi.
-- 2. Fonksiyon STABLE ama job_listing_views'a INSERT yapıyor (kota satırı). STABLE bir
--    fonksiyonda INSERT yasaktır. → VOLATILE.
-- Gövdenin geri kalanı 20261005700000 ile aynı.

begin;

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
volatile
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
  if not exists (select 1 from public.job_listings jl0 where jl0.id = p_listing_id and jl0.status = 'published') then
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

commit;
