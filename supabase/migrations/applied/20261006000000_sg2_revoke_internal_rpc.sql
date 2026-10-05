-- SG2 · İç SECURITY DEFINER RPC'lerden anon/authenticated EXECUTE kaldır
--
-- Kaynak: docs/security/SECURITY_AUDIT.md S2, S3, S9, O2, O3
-- SG0 envanteri: İstemci çağrısı YOK → revoke güvenli.
--
-- Bu fonksiyonlar YALNIZCA service_role (edge functions, admin panel) tarafından
-- çağrılmalı. Anon/authenticated yetkisi kaldırılır.
--
-- ⚠️ Uygulama öncesi: İstemci kodunda bu fonksiyonları çağıran .rpc() var mı kontrol et.
-- SG0 envanteri "Güvenli" listesine bakıldı — istemci çağrısı YOK.

begin;

-- Ortak SQL: revoke execute from public, anon, authenticated; grant to service_role
do $$ declare r record; begin
  for r in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prokind='f' and p.proname = any(array[
    -- S2: catalog_upsert_* anon yazma/silme
    'catalog_upsert_source_item','catalog_delete_item_for_source',
    'catalog_reset_item_projection','catalog_create_duplicate_candidates_for_item',
    'catalog_sync_event','catalog_sync_job_listing','catalog_sync_independent_profile',
    'catalog_sync_turkish_mission','catalog_sync_whatsapp_landing',
    'catalog_rebuild_search_document','catalog_rebuild_search_documents_for_category',
    'catalog_refresh_all_search_documents',
    -- S3: catalog_upsert_owner_membership
    'catalog_upsert_owner_membership',
    -- S9: Relocation worker hattı
    'worker_claim_relocation_jobs','worker_complete_relocation_job','worker_fail_relocation_job',
    'worker_heartbeat_relocation_job','worker_upsert_relocation_candidate','worker_record_relocation_cost',
    -- O2: sync_member_catalog_role_for_user
    'sync_member_catalog_role_for_user',
    -- O3: notify_followers, list_member_catalog_names
    'notify_followers','list_member_catalog_names'
  ])
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop; end $$;

-- Default privileges: yeni fonksiyonlar için anon/public'dan otomatik revoke
alter default privileges in schema public
  revoke execute on functions from public, anon;

comment on table public.afs_features is
  'SG2: İç SECURITY DEFINER RPC''lerden anon/authenticated EXECUTE kaldırıldı. '
  'Etkilenen fonksiyonlar: catalog_upsert_*, catalog_sync_*, worker_*, sync_member_*, notify_followers, list_member_catalog_names.';

commit;
