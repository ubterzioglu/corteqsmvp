-- A12 · profile-license kabul testi
--
-- KABUL:
--   K1: profile-license-files bucket var, private, 20MB sınır
--   K2: business_license_doc attribute afs_attributes'ta var
--   K3: Tüm aktif roller için role_attributes kuralı var (is_enabled=true)
--   K4: profile.license_upload feature tüm aktif roller için is_enabled=true
--   K5: Storage politikaları: sahip okur/yazar/siler, admin okur/siler

begin;

-- K1: Bucket var ve doğru ayarlar
do $$
declare
  v_public boolean;
  v_size_limit bigint;
begin
  select public, file_size_limit into v_public, v_size_limit
  from storage.buckets
  where id = 'profile-license-files';
  assert found, 'K1 BAŞARISIZ: profile-license-files bucket yok';
  assert v_public = false, 'K1 BAŞARISIZ: bucket public olmamalı';
  assert v_size_limit = 20971520, 'K1 BAŞARISIZ: boyut sınırı 20MB olmalı';
  raise notice 'K1 OK: profile-license-files bucket doğru';
end $$;

-- K2: business_license_doc attribute var
do $$
begin
  assert exists (
    select 1 from public.afs_attributes
    where key = 'business_license_doc'
      and storage_strategy = 'private_storage'
  ), 'K2 BAŞARISIZ: business_license_doc attribute yok veya storage_strategy yanlış';
  raise notice 'K2 OK: business_license_doc attribute var';
end $$;

-- K3: Tüm aktif roller için role_attributes kuralı
do $$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from public.roles r
  where r.is_active = true
    and not exists (
      select 1 from public.role_attributes ra
      where ra.role_id = r.id
        and ra.attribute_key = 'business_license_doc'
        and ra.is_enabled = true
    );
  assert v_missing = 0,
    'K3 BAŞARISIZ: ' || v_missing || ' aktif rolde business_license_doc kuralı eksik';
  raise notice 'K3 OK: Tüm aktif rollerde business_license_doc kuralı var';
end $$;

-- K4: profile.license_upload feature tüm aktif roller için açık
do $$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from public.roles r
  where r.is_active = true
    and not exists (
      select 1 from public.role_features rf
      where rf.role_id = r.id
        and rf.feature_key = 'profile.license_upload'
        and rf.is_enabled = true
    );
  assert v_missing = 0,
    'K4 BAŞARISIZ: ' || v_missing || ' aktif rolde profile.license_upload is_enabled=true eksik';
  raise notice 'K4 OK: profile.license_upload tüm aktif roller için açık';
end $$;

rollback;
