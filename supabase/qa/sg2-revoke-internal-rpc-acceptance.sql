-- GV4 · SG2 kabul testi — İç SECURITY DEFINER RPC yetkileri
--
-- SG2 migration'ı (20261006000000) 20+ fonksiyondan anon/authenticated yetkisini kaldırdı.
-- Bu test: anon artık çağıramıyor, service_role çağırabilir.

begin;

-- K1: catalog_upsert_source_item — anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 'public.catalog_upsert_source_item(text, text, text, text, text, text, text, text, text, text, text)', 'execute')
  into v_has_anon;
  assert v_has_anon = false,
    'K1 BAŞARISIZ: catalog_upsert_source_item anon yetkisi var (kaldırılmalı)';
  raise notice 'K1 OK: catalog_upsert_source_item anon yetkisi YOK';
end $$;

-- K2: catalog_upsert_owner_membership — anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 'public.catalog_upsert_owner_membership(uuid, uuid)', 'execute')
  into v_has_anon;
  assert v_has_anon = false,
    'K2 BAŞARISIZ: catalog_upsert_owner_membership anon yetkisi var (kaldırılmalı)';
  raise notice 'K2 OK: catalog_upsert_owner_membership anon yetkisi YOK';
end $$;

-- K3: worker_claim_relocation_jobs — anon yetkisi YOK
do $$
declare
  v_has_anon boolean;
begin
  select has_function_privilege('anon', 'public.worker_claim_relocation_jobs(uuid)', 'execute')
  into v_has_anon;
  assert v_has_anon = false,
    'K3 BAŞARISIZ: worker_claim_relocation_jobs anon yetkisi var (kaldırılmalı)';
  raise notice 'K3 OK: worker_claim_relocation_jobs anon yetkisi YOK';
end $$;

-- K4: notify_followers — authenticated yetkisi YOK
do $$
declare
  v_has_auth boolean;
begin
  select has_function_privilege('authenticated', 'public.notify_followers(uuid, text, text)', 'execute')
  into v_has_auth;
  assert v_has_auth = false,
    'K4 BAŞARISIZ: notify_followers authenticated yetkisi var (kaldırılmalı)';
  raise notice 'K4 OK: notify_followers authenticated yetkisi YOK';
end $$;

rollback;
