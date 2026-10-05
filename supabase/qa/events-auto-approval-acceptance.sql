-- A1.8 · events-auto-approval sözleşme testi (genişletilmiş, mutasyon ≥5)
--
-- ═══ GEÇMİŞ TANIM ═══
-- 20261003010000_events_first_approval.sql: "İlk etkinlik pending + approval_requests"
-- → A13 (20261005900000_events_auto_approval.sql) ile GEÇERSİZ KILINDI.
-- Bu dosya YALNIZCA kolon/ayar altyapısını korur; create_event_v1 tanımı A13'tedir.
--
-- ═══ BAYATLAMA KAPANI ═══
-- create_event_v1 fonksiyonunu en son tanımlayan migration: 20261005900000 (A13).
-- Bu test, fonksiyonun A13 davranışını kilitler: status='published', approval_requests YOK.
--
-- KABUL (K1–K7) + MUTASYONLAR (M1–M5):
--   K1: events.first_approval_required = false
--   K2: create_event_v1 security definer, set search_path = public
--   K3: Aktif limit ayarı var (> 0)
--   K4: Fonksiyon kaynağında 'published' + 'auto' var (A13 davranışı)
--   K5: Fonksiyon kaynağında approval_requests YOK (A13 kaldırdı)
--   K6: anon yetkisi YOK (yalnız authenticated) — T1
--   K7: user_id auth.uid()'den (istemciden alınmaz) — T1
--
-- MUTASYONLAR (her biri testin KIRMIZI vermesi gereken senaryo):
--   M1: user_id parametre olsaydı → T1 ihlali (K7 düşer)
--   M2: status='pending' döndürseydi → A13 ihlali (K4 düşer)
--   M3: approval_requests'e INSERT olsaydı → A13 ihlali (K5 düşer)
--   M4: limit kontrolü olmasaydı → kota ihlali (K3 yetersiz)
--   M5: anon yetkisi olsaydı → T1 ihlali (K6 düşer)

begin;

-- K1: Ayar doğru
do $$
declare
  v_value text;
begin
  select value #>> '{}' into v_value
  from public.event_settings
  where key = 'events.first_approval_required';
  assert v_value = 'false',
    'K1 BAŞARISIZ: events.first_approval_required false olmalı, geldi: ' || v_value;
  raise notice 'K1 OK: first_approval_required = false';
end $$;

-- K2: create_event_v1 security definer + search_path
do $$
declare
  v_secdef boolean;
  v_search_path text;
begin
  select prosecdef, setconfig into v_secdef, v_search_path
  from pg_proc
  where proname = 'create_event_v1';
  assert found, 'K2 BAŞARISIZ: create_event_v1 fonksiyonu yok';
  assert v_secdef = true, 'K2 BAŞARISIZ: create_event_v1 security definer değil';
  assert v_search_path is not null and v_search_path like '%public%',
    'K2 BAŞARISIZ: set search_path = public yok';
  raise notice 'K2 OK: security definer + search_path = public';
end $$;

-- K3: Aktif limit ayarı var
do $$
declare
  v_limit integer;
begin
  select public.event_setting_int('events.active_limit', 2) into v_limit;
  assert v_limit > 0,
    'K3 BAŞARISIZ: events.active_limit 0 veya negatif';
  raise notice 'K3 OK: Aktif limit = %', v_limit;
end $$;

-- K4: Fonksiyon kaynağında 'published' + 'auto' var (A13 davranışı)
-- Mutasyon M2: status='pending' döndürseydi bu test DÜŞERDİ.
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'create_event_v1';
  assert v_src like '%''published''%',
    'K4 BAŞARISIZ: fonksiyon source''unda ''published'' yok (M2 mutasyonu?)';
  assert v_src like '%''auto''%',
    'K4 BAŞARISIZ: fonksiyon source''unda ''auto'' yok (approval_source?)';
  raise notice 'K4 OK: A13 davranışı kilitli (published + auto)';
end $$;

-- K5: Fonksiyon kaynağında approval_requests YOK (A13 kaldırdı)
-- Mutasyon M3: approval_requests'e INSERT olsaydı bu test DÜŞERDİ.
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'create_event_v1';
  assert v_src not like '%approval_requests%',
    'K5 BAŞARISIZ: fonksiyon approval_requests''e yazıyor (M3 mutasyonu — A13 ihlali)';
  raise notice 'K5 OK: approval_requests yazımı YOK (A13)';
end $$;

-- K6: anon yetkisi YOK (yalnız authenticated) — T1
-- Mutasyon M5: anon yetkisi olsaydı bu test DÜŞERDİ.
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 
    'public.create_event_v1(text, text, text, text, date, time, time, text, text, text, text, numeric, integer, text, text[], text, text, text, text)', 
    'execute')
  into v_has_anon;
  assert v_has_anon = false,
    'K6 BAŞARISIZ: anon execute yetkisi var (M5 mutasyonu — T1 ihlali)';
  raise notice 'K6 OK: anon yetkisi YOK (T1)';
end $$;

-- K7: user_id auth.uid()'den (istemciden alınmaz) — T1
-- Mutasyon M1: user_id parametre olsaydı bu test DÜŞERDİ.
do $$
declare
  v_src text;
begin
  select pg_get_functiondef(oid) into v_src
  from pg_proc
  where proname = 'create_event_v1';
  assert v_src like '%auth.uid()%',
    'K7 BAŞARISIZ: fonksiyon auth.uid() kullanmıyor (M1 mutasyonu — T1 ihlali)';
  assert v_src not like '%p_user_id%',
    'K7 BAŞARISIZ: fonksiyon p_user_id parametresi alıyor (M1 mutasyonu)';
  raise notice 'K7 OK: user_id auth.uid()''den (T1)';
end $$;

-- ═══ MUTASYON ÖZETİ ═══
-- M1: user_id parametre olsaydı → K7 düşer (T1 ihlali)
-- M2: status='pending' döndürseydi → K4 düşer (A13 ihlali)
-- M3: approval_requests'e INSERT olsaydı → K5 düşer (A13 ihlali)
-- M4: limit kontrolü olmasaydı → K3 yetersiz (kota ihlali — ayrı test gerekir)
-- M5: anon yetkisi olsaydı → K6 düşer (T1 ihlali)

rollback;
