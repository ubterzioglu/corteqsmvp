-- G17 genişletmesi kabul testi: group_health_score_compute artık group_reports'u okur.
--
-- KABUL:
--   K1: Son 90 günde upheld şikayet YOK → v_reports = true → 20 puan
--   K2: Son 90 günde upheld şikayet VAR → v_reports = false → 0 puan
--   K3: 90 günden ESKİ upheld şikayet → v_reports = true → 20 puan (süre dışı)
--   K4: rejected şikayet → v_reports = true → 20 puan (onaylanmamış)
--   K5: Birden fazla upheld şikayet → v_reports = false → 0 puan (tek varlık yeterli)

begin;

-- Fixture: Test grubu (published, 30 gün önce)
insert into public.whatsapp_landings (
  id, slug, group_name, listing_status, ownership, published_at,
  short_description, category, city_id, rules, link_fail_count
) values (
  'a0000000-0000-0000-0000-000000000001',
  'g17-test-group',
  'G17 Test Grubu',
  'published',
  'verified',
  now() - interval '30 days',
  'Test açıklaması',
  'sehir_yasam',
  null,
  'Test kuralları',
  0
) on conflict (id) do nothing;

-- Fixture: Test kullanıcısı (şikayetçi)
insert into auth.users (id, email, phone, phone_confirmed_at, created_at)
values (
  'b0000000-0000-0000-0000-000000000001',
  'g17-tester@example.com',
  '+491701234567',
  now(),
  now() - interval '100 days'
) on conflict (id) do nothing;

-- K1: Son 90 günde upheld şikayet YOK → 20 puan
do $$
declare
  v_result jsonb;
  v_score integer;
begin
  select public.group_health_score_compute('a0000000-0000-0000-0000-000000000001') into v_result;
  v_score := (v_result->>'score')::integer;
  assert (v_result->'components'->>'reports')::integer = 20,
    'K1 BAŞARISIZ: upheld şikayet yok, reports 20 olmalı, geldi: ' || (v_result->'components'->>'reports');
  raise notice 'K1 OK: upheld şikayet yok → reports = 20';
end $$;

-- K2: Son 90 günde upheld şikayet VAR → 0 puan
insert into public.group_reports (id, landing_id, reporter_id, reason, status, reviewed_at)
values (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'link_broken',
  'upheld',
  now() - interval '30 days'
) on conflict (id) do nothing;

do $$
declare
  v_result jsonb;
begin
  select public.group_health_score_compute('a0000000-0000-0000-0000-000000000001') into v_result;
  assert (v_result->'components'->>'reports')::integer = 0,
    'K2 BAŞARISIZ: upheld şikayet var, reports 0 olmalı, geldi: ' || (v_result->'components'->>'reports');
  raise notice 'K2 OK: upheld şikayet var → reports = 0';
end $$;

-- K3: 90 günden ESKİ upheld şikayet → 20 puan (süre dışı)
delete from public.group_reports where id = 'c0000000-0000-0000-0000-000000000001';
insert into public.group_reports (id, landing_id, reporter_id, reason, status, reviewed_at)
values (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'link_broken',
  'upheld',
  now() - interval '100 days'
) on conflict (id) do nothing;

do $$
declare
  v_result jsonb;
begin
  select public.group_health_score_compute('a0000000-0000-0000-0000-000000000001') into v_result;
  assert (v_result->'components'->>'reports')::integer = 20,
    'K3 BAŞARISIZ: eski upheld şikayet, reports 20 olmalı, geldi: ' || (v_result->'components'->>'reports');
  raise notice 'K3 OK: 90 günden eski upheld → reports = 20 (süre dışı)';
end $$;

-- K4: rejected şikayet → 20 puan (onaylanmamış)
delete from public.group_reports where id = 'c0000000-0000-0000-0000-000000000002';
insert into public.group_reports (id, landing_id, reporter_id, reason, status, reviewed_at)
values (
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'link_broken',
  'rejected',
  now() - interval '30 days'
) on conflict (id) do nothing;

do $$
declare
  v_result jsonb;
begin
  select public.group_health_score_compute('a0000000-0000-0000-0000-000000000001') into v_result;
  assert (v_result->'components'->>'reports')::integer = 20,
    'K4 BAŞARISIZ: rejected şikayet, reports 20 olmalı, geldi: ' || (v_result->'components'->>'reports');
  raise notice 'K4 OK: rejected şikayet → reports = 20 (onaylanmamış)';
end $$;

-- K5: Birden fazla upheld şikayet → 0 puan (tek varlık yeterli)
delete from public.group_reports where id = 'c0000000-0000-0000-0000-000000000003';
insert into public.group_reports (id, landing_id, reporter_id, reason, status, reviewed_at)
values
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'link_broken', 'upheld', now() - interval '30 days'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'visa_slot_sale', 'upheld', now() - interval '20 days')
on conflict (id) do nothing;

do $$
declare
  v_result jsonb;
begin
  select public.group_health_score_compute('a0000000-0000-0000-0000-000000000001') into v_result;
  assert (v_result->'components'->>'reports')::integer = 0,
    'K5 BAŞARISIZ: birden fazla upheld, reports 0 olmalı, geldi: ' || (v_result->'components'->>'reports');
  raise notice 'K5 OK: birden fazla upheld → reports = 0';
end $$;

-- Temizlik
delete from public.group_reports where landing_id = 'a0000000-0000-0000-0000-000000000001';
delete from public.whatsapp_landings where id = 'a0000000-0000-0000-0000-000000000001';
delete from auth.users where id = 'b0000000-0000-0000-0000-000000000001';

raise notice 'KABUL 5/5 OK — G17 group_reports bağlantısı doğrulandı';

rollback;
