-- Trigger'lar user_role_assignments INSERT'te sonsuz döngüye giriyor:
-- trg_catalog_sync_directory_opt_in_from_roles → user_feature_overrides INSERT →
-- trg_catalog_sync_directory_opt_in_from_overrides → user_role_assignments query → tekrar...
-- Bu trigger'lar user_profiles sistemine aitti, artık gereksiz. Tamamen kaldır.

begin;

drop trigger if exists trg_catalog_sync_directory_opt_in_from_roles on public.user_role_assignments;
drop trigger if exists trg_catalog_sync_directory_opt_in_from_overrides on public.user_feature_overrides;

drop function if exists public.catalog_sync_directory_opt_in_trigger() cascade;
drop function if exists public.catalog_sync_profile_directory_opt_in(uuid) cascade;
drop function if exists public.catalog_resolve_directory_opt_in(uuid) cascade;

commit;
