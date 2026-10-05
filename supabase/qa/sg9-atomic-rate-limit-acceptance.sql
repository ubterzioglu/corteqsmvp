-- GV4 · SG9 kabul testi — Atomik rate-limit
--
-- SG9 migration'ı (20261006040000) edge_rate_limit_atomic fonksiyonu ekledi.
-- Bu test: Fonksiyon var, security definer, service_role yetkisi var.

begin;

-- K1: edge_rate_limit_atomic fonksiyonu var
do $$
begin
  assert exists (
    select 1 from pg_proc
    where proname = 'edge_rate_limit_atomic'
  ), 'K1 BAŞARISIZ: edge_rate_limit_atomic fonksiyonu yok';
  raise notice 'K1 OK: edge_rate_limit_atomic fonksiyonu var';
end $$;

-- K2: security definer
do $$
declare
  v_secdef boolean;
begin
  select prosecdef into v_secdef
  from pg_proc
  where proname = 'edge_rate_limit_atomic';
  assert v_secdef = true,
    'K2 BAŞARISIZ: edge_rate_limit_atomic security definer değil';
  raise notice 'K2 OK: security definer';
end $$;

-- K3: service_role yetkisi var
do $$
declare
  v_has_service_role boolean;
begin
  select has_function_privilege('service_role', 'public.edge_rate_limit_atomic(text, text, timestamptz, integer)', 'execute')
  into v_has_service_role;
  assert v_has_service_role = true,
    'K3 BAŞARISIZ: edge_rate_limit_atomic service_role yetkisi yok';
  raise notice 'K3 OK: service_role yetkisi var';
end $$;

-- K4: anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 'public.edge_rate_limit_atomic(text, text, timestamptz, integer)', 'execute')
  into v_has_anon;
  assert v_has_anon = false,
    'K4 BAŞARISIZ: edge_rate_limit_atomic anon yetkisi var (kaldırılmalı)';
  raise notice 'K4 OK: anon yetkisi YOK';
end $$;

-- K5: authenticated yetkisi YOK
do $$
declare
  v_has_auth boolean;
begin
  select has_function_privilege('authenticated', 'public.edge_rate_limit_atomic(text, text, timestamptz, integer)', 'execute')
  into v_has_auth;
  assert v_has_auth = false,
    'K5 BAŞARISIZ: edge_rate_limit_atomic authenticated yetkisi var (kaldırılmalı)';
  raise notice 'K5 OK: authenticated yetkisi YOK';
end $$;

rollback;
