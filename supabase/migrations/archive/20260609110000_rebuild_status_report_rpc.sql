-- Status-report RPC for the admin "Durum Raporu" page.
-- Returns the live rebuild metrics as a single jsonb object (read-only, admin-gated).

create or replace function public.get_rebuild_status_report()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'roles_total', (select count(*) from public.roles),
    'roles_active', (select count(*) from public.roles where is_active = true and deleted_at is null),
    'legacy_roles', (select count(*) from public.roles
                      where key in ('bireysel','danisman','isletme','kurulus-dernek',
                                    'blogger-vlogger-youtuber','sehir-elcisi')),
    'afs_attributes', (select count(*) from public.afs_attributes),
    'afs_features', (select count(*) from public.afs_features),
    'afs_sections', (select count(*) from public.afs_sections),
    'role_attributes', (select count(*) from public.role_attributes),
    'role_features', (select count(*) from public.role_features),
    'role_sections', (select count(*) from public.role_sections),
    'catalog_items_total', (select count(*) from public.catalog_items),
    'placeholders', (select count(*) from public.catalog_items where is_placeholder = true),
    'item_role_links', (select count(*) from public.catalog_item_roles),
    'items_without_primary_role', (
      select count(*) from public.catalog_items ci
      where ci.is_placeholder = false
        and not exists (select 1 from public.catalog_item_roles cir
                        where cir.catalog_item_id = ci.id and cir.is_primary)
    ),
    'legacy_tables_remaining', (
      select count(*) from information_schema.tables
      where table_schema = 'public'
        and table_name in ('catalog_item_types','item_type_attribute_rules',
                           'item_type_feature_defaults','item_type_features','role_taxonomy_rules')
    ),
    'family_columns_remaining', (
      select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'roles'
        and column_name in ('family_key','parent_role_id','default_item_type')
    ),
    'old_table_names_remaining', (
      select count(*) from information_schema.tables
      where table_schema = 'public'
        and table_name in ('attribute_catalog','feature_catalog','profile_section_catalog',
                           'role_attribute_rules','role_feature_flags','role_profile_section_rules',
                           'catalog_item_attributes','catalog_claim_requests','catalog_item_memberships')
    )
  ) into v;

  return v;
end;
$function$;

grant execute on function public.get_rebuild_status_report() to authenticated;

comment on function public.get_rebuild_status_report() is
  'Rebuild 2026-06-09: live status metrics for the admin Durum Raporu page (admin-gated).';
