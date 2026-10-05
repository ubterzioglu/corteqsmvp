-- GV4 · SG6 kabul testi — Açık RLS politikaları kapatıldı
--
-- SG6 migration'ı (20261006030000) açık RLS politikalarını kapattı.
-- Bu test: advisor_social_media_links, command_center_hot_fixes, todos, job_listings
-- tablolarında anon yetkisi kaldırıldı.

begin;

-- K1: advisor_social_media_links — anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_table_privilege('anon', 'public.advisor_social_media_links', 'SELECT') into v_has_anon;
  assert v_has_anon = false,
    'K1 BAŞARISIZ: advisor_social_media_links anon SELECT yetkisi var (kaldırılmalı)';
  raise notice 'K1 OK: advisor_social_media_links anon yetkisi YOK';
end $$;

-- K2: command_center_hot_fixes — is_admin politikası var
do $$
begin
  assert exists (
    select 1 from pg_policies
    where tablename = 'command_center_hot_fixes'
      and policyname = 'command_center_hot_fixes_admin_only'
  ), 'K2 BAŞARISIZ: command_center_hot_fixes_admin_only politikası yok';
  raise notice 'K2 OK: command_center_hot_fixes is_admin politikası var';
end $$;

-- K3: todos — anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_table_privilege('anon', 'public.todos', 'SELECT') into v_has_anon;
  assert v_has_anon = false,
    'K3 BAŞARISIZ: todos anon SELECT yetkisi var (kaldırılmalı)';
  raise notice 'K3 OK: todos anon yetkisi YOK';
end $$;

-- K4: job_listings — anon SELECT yetkisi YOK (kota RPC kullan)
do $$
declare
  v_has_anon boolean;
begin
  select has_table_privilege('anon', 'public.job_listings', 'SELECT') into v_has_anon;
  assert v_has_anon = false,
    'K4 BAŞARISIZ: job_listings anon SELECT yetkisi var (kota RPC kullan)';
  raise notice 'K4 OK: job_listings anon SELECT yetkisi YOK';
end $$;

rollback;
