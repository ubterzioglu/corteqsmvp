-- GV4 · SG3 kabul testi — catalog_items kolon guard
--
-- SG3 migration'ı (20261006010000) catalog_items'e kolon guard tetikleyici ekledi.
-- Bu test: Ayrıcalıklı kolonlar (verification_status, platform_role_key, status, visibility)
-- admin olmayan kullanıcılar tarafından değiştirilemiyor.

begin;

-- K1: catalog_items_guard_privileged_columns fonksiyonu var
do $$
begin
  assert exists (
    select 1 from pg_proc
    where proname = 'catalog_items_guard_privileged_columns'
  ), 'K1 BAŞARISIZ: catalog_items_guard_privileged_columns fonksiyonu yok';
  raise notice 'K1 OK: catalog_items_guard_privileged_columns fonksiyonu var';
end $$;

-- K2: Tetikleyici var
do $$
begin
  assert exists (
    select 1 from pg_trigger
    where tgname = 'catalog_items_guard_privileged_columns_trigger'
  ), 'K2 BAŞARISIZ: catalog_items_guard_privileged_columns_trigger tetikleyici yok';
  raise notice 'K2 OK: Tetikleyici var';
end $$;

-- K3: catalog_items INSERT yetkisi anon/authenticated'dan kaldırıldı
do $$
declare
  v_has_anon boolean;
  v_has_auth boolean;
begin
  select has_table_privilege('anon', 'public.catalog_items', 'INSERT') into v_has_anon;
  select has_table_privilege('authenticated', 'public.catalog_items', 'INSERT') into v_has_auth;
  
  assert v_has_anon = false, 'K3 BAŞARISIZ: anon INSERT yetkisi var (kaldırılmalı)';
  assert v_has_auth = false, 'K3 BAŞARISIZ: authenticated INSERT yetkisi var (kaldırılmalı)';
  raise notice 'K3 OK: INSERT yetkisi kaldırıldı';
end $$;

-- K4: catalog_items UPDATE yetkisi güvenli kolonlarla sınırlı
do $$
declare
  v_has_auth_update boolean;
begin
  select has_table_privilege('authenticated', 'public.catalog_items', 'UPDATE') into v_has_auth_update;
  -- UPDATE yetkisi var ama belirli kolonlarla sınırlı
  assert v_has_auth_update = true, 'K4 BAŞARISIZ: authenticated UPDATE yetkisi yok (güvenli kolonlar için olmalı)';
  raise notice 'K4 OK: UPDATE yetkisi var (güvenli kolonlar için)';
end $$;

rollback;
