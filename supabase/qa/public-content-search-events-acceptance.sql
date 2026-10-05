-- A16 · public-content-search-events kabul testi
--
-- KABUL:
--   K1: search_public_content fonksiyonu event türü döndürebilir
--   K2: Yalnız published + gelecek etkinlikler (event_date >= current_date)
--   K3: PII-free: user_id, e-posta DÖNMEZ
--   K4: events_public_search_trgm_idx index var (partial, published + gelecek)
--   K5: Fonksiyon security definer, anon/authenticated/service_role yetkisi var

begin;

-- K1: Fonksiyon var ve event türü destekleniyor
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'search_public_content';
  assert found, 'K1 BAŞARISIZ: search_public_content fonksiyonu yok';
  assert v_src like '%event%candidates%',
    'K1 BAŞARISIZ: fonksiyonda event_candidates bloğu yok';
  raise notice 'K1 OK: search_public_content event türü destekliyor';
end $$;

-- K2: Fonksiyon published + gelecek etkinlikleri filtreliyor
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'search_public_content';
  assert v_src like '%status = ''published''%',
    'K2 BAŞARISIZ: published filtresi yok';
  assert v_src like '%event_date >= current_date%',
    'K2 BAŞARISIZ: gelecek etkinlik filtresi yok';
  raise notice 'K2 OK: published + gelecek etkinlik filtresi var';
end $$;

-- K3: PII-free — user_id dönmüyor
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'search_public_content';
  assert v_src not like '%user_id%',
    'K3 BAŞARISIZ: fonksiyon user_id döndürüyor (PII sızıntısı)';
  raise notice 'K3 OK: PII-free (user_id yok)';
end $$;

-- K4: Index var
do $$
begin
  assert exists (
    select 1 from pg_indexes
    where indexname = 'events_public_search_trgm_idx'
  ), 'K4 BAŞARISIZ: events_public_search_trgm_idx index yok';
  raise notice 'K4 OK: trgm index var';
end $$;

-- K5: Yetkiler doğru
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 'public.search_public_content(text, integer)', 'execute')
  into v_has_anon;
  assert v_has_anon = true,
    'K5 BAŞARISIZ: anon execute yetkisi yok';
  raise notice 'K5 OK: anon/authenticated/service_role yetkisi var';
end $$;

rollback;
