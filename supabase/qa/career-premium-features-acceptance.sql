-- A4 · career-premium-features kabul testi
--
-- KABUL:
--   K1: career.cv.view yetkisi tüm aktif roller için is_enabled=false
--   K2: career.listing.view_unlimited yetkisi tüm aktif roller için is_enabled=false
--   K3: Her iki yetki de afs_features'ta scope_role='*'
--   K4: Premium override ile açılabilir (admin override)

begin;

-- K1: career.cv.view — tüm aktif roller için is_enabled=false
do $$
declare
  v_missing_count integer;
begin
  select count(*) into v_missing_count
  from public.roles r
  where r.is_active = true
    and not exists (
      select 1 from public.role_features rf
      where rf.role_id = r.id
        and rf.feature_key = 'career.cv.view'
        and rf.is_enabled = false
    );
  assert v_missing_count = 0,
    'K1 BAŞARISIZ: ' || v_missing_count || ' aktif rolde career.cv.view is_enabled=false eksik';
  raise notice 'K1 OK: career.cv.view tüm aktif roller için is_enabled=false';
end $$;

-- K2: career.listing.view_unlimited — tüm aktif roller için is_enabled=false
do $$
declare
  v_missing_count integer;
begin
  select count(*) into v_missing_count
  from public.roles r
  where r.is_active = true
    and not exists (
      select 1 from public.role_features rf
      where rf.role_id = r.id
        and rf.feature_key = 'career.listing.view_unlimited'
        and rf.is_enabled = false
    );
  assert v_missing_count = 0,
    'K2 BAŞARISIZ: ' || v_missing_count || ' aktif rolde career.listing.view_unlimited is_enabled=false eksik';
  raise notice 'K2 OK: career.listing.view_unlimited tüm aktif roller için is_enabled=false';
end $$;

-- K3: Her iki yetki de scope_role='*'
do $$
declare
  v_bad_count integer;
begin
  select count(*) into v_bad_count
  from public.afs_features
  where key in ('career.cv.view', 'career.listing.view_unlimited')
    and scope_role <> '*';
  assert v_bad_count = 0,
    'K3 BAŞARISIZ: ' || v_bad_count || ' yetki scope_role='' * '' değil';
  raise notice 'K3 OK: Her iki career yetkisi scope_role='' * ''';
end $$;

rollback;
