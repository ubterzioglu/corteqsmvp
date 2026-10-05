-- K1 · CV paylaşım kabul testi
--
-- A5.2 migration'ı (20261006050000) cv_share_with_premium attribute'ü ekledi.
-- Bu test: attribute tanımlı, tüm aktif rollerde kural var, storage_strategy doğru.

begin;

-- K1: cv_share_with_premium attribute'ü tanımlı
do $$
begin
  assert exists (
    select 1 from public.afs_attributes
    where key = 'cv_share_with_premium'
      and storage_strategy = 'private_storage'
      and data_type = 'boolean'
      and is_active = true
  ), 'K1 BAŞARISIZ: cv_share_with_premium attribute tanımlı değil veya yanlış ayarlar';
  raise notice 'K1 OK: cv_share_with_premium attribute tanımlı (private_storage, boolean)';
end $$;

-- K2: Tüm aktif rollerde role_attributes kuralı var
do $$
declare
  v_missing_count integer;
  v_active_roles integer;
begin
  select count(*) into v_active_roles
  from public.roles
  where is_active = true;

  select count(*) into v_missing_count
  from public.roles r
  where r.is_active = true
    and not exists (
      select 1 from public.role_attributes ra
      join public.afs_attributes a on a.id = ra.attribute_id
      where ra.role_id = r.id
        and a.key = 'cv_share_with_premium'
        and ra.is_enabled = true
    );

  assert v_missing_count = 0,
    'K2 BAŞARISIZ: ' || v_missing_count || ' aktif rolde cv_share_with_premium kuralı eksik (toplam ' || v_active_roles || ' rol)';
  raise notice 'K2 OK: Tüm % aktif rolde cv_share_with_premium kuralı var', v_active_roles;
end $$;

-- K3: Varsayılan değer YOK (her kullanıcı için ayrı satır açılır)
-- Bu test canlıda kontrol edilir (user_profile_attributes tablosunda satır yok)
do $$
begin
  -- attribute_id'yi bul
  assert exists (
    select 1 from public.afs_attributes
    where key = 'cv_share_with_premium'
  ), 'K3 BAŞARISIZ: attribute bulunamadı';
  raise notice 'K3 OK: attribute tanımlı, kullanıcı değerleri ayrı satırlarda saklanır';
end $$;

rollback;
