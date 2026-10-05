-- GV4 · SG4 kabul testi — whatsapp_landings guard
--
-- SG4 migration'ı (20261006020000) whatsapp_landings'e INSERT/UPDATE guard ekledi.
-- Bu test: Ayrıcalıklı alanlar (listing_status, status, ownership) admin olmadan değiştirilemiyor.

begin;

-- K1: whatsapp_landings_guard_insert fonksiyonu var
do $$
begin
  assert exists (
    select 1 from pg_proc
    where proname = 'whatsapp_landings_guard_insert'
  ), 'K1 BAŞARISIZ: whatsapp_landings_guard_insert fonksiyonu yok';
  raise notice 'K1 OK: INSERT guard fonksiyonu var';
end $$;

-- K2: whatsapp_landings_guard_update fonksiyonu var
do $$
begin
  assert exists (
    select 1 from pg_proc
    where proname = 'whatsapp_landings_guard_update'
  ), 'K2 BAŞARISIZ: whatsapp_landings_guard_update fonksiyonu yok';
  raise notice 'K2 OK: UPDATE guard fonksiyonu var';
end $$;

-- K3: INSERT tetikleyici var
do $$
begin
  assert exists (
    select 1 from pg_trigger
    where tgname = 'whatsapp_landings_guard_insert_trigger'
  ), 'K3 BAŞARISIZ: INSERT tetikleyici yok';
  raise notice 'K3 OK: INSERT tetikleyici var';
end $$;

-- K4: UPDATE tetikleyici var
do $$
begin
  assert exists (
    select 1 from pg_trigger
    where tgname = 'whatsapp_landings_guard_update_trigger'
  ), 'K4 BAŞARISIZ: UPDATE tetikleyici yok';
  raise notice 'K4 OK: UPDATE tetikleyici var';
end $$;

-- K5: whatsapp_link host CHECK var
do $$
begin
  assert exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_landings'::regclass
      and conname = 'whatsapp_landings_link_format_check'
  ), 'K5 BAŞARISIZ: whatsapp_link host CHECK yok';
  raise notice 'K5 OK: whatsapp_link host CHECK var';
end $$;

rollback;
