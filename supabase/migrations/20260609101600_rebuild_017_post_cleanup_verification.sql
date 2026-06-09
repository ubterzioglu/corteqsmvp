-- Catalog/Flat-Role/AFS Rebuild — Migration 017: post-cleanup verification
--
-- Asserts the legacy schema is fully gone and the flat system is intact.
-- Raises on any violation so a bad cleanup cannot pass silently.

begin;

do $$
declare n int;
begin
  -- legacy indirection tables gone
  if exists (select 1 from information_schema.tables where table_schema='public'
             and table_name in ('catalog_item_types','item_type_attribute_rules',
                                 'item_type_feature_defaults','item_type_features',
                                 'role_taxonomy_rules')) then
    raise exception 'legacy indirection tables still present';
  end if;

  -- 6 legacy roles gone -> roles now exactly 76
  select count(*) into n from public.roles;
  if n <> 76 then raise exception 'roles total=% (expected 76 after legacy delete)', n; end if;

  select count(*) into n from public.roles
   where key in ('bireysel','danisman','isletme','kurulus-dernek','blogger-vlogger-youtuber','sehir-elcisi');
  if n <> 0 then raise exception '% legacy roles still present', n; end if;

  -- no family residue columns on roles
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='roles'
             and column_name in ('family_key','parent_role_id','default_item_type')) then
    raise exception 'roles still has family residue columns';
  end if;

  -- item_type FK to dropped table is gone
  if exists (select 1 from information_schema.table_constraints
             where constraint_schema='public' and constraint_name='catalog_items_item_type_fkey') then
    raise exception 'catalog_items_item_type_fkey still present';
  end if;

  -- flat system still intact
  select count(*) into n from public.afs_attributes; if n<>53 then raise exception 'afs_attributes=%',n; end if;
  select count(*) into n from public.afs_features;   if n<>42 then raise exception 'afs_features=%',n; end if;
  select count(*) into n from public.afs_sections;   if n<>7  then raise exception 'afs_sections=%',n; end if;
  select count(*) into n from public.catalog_items where is_placeholder=true;
  if n<>76 then raise exception 'placeholders=% (expected 76)',n; end if;

  raise notice 'Post-cleanup verification PASSED: 76 roles (0 legacy), no family residue, 53/42/7 AFS, 76 placeholders, item_type FK dropped.';
end $$;

commit;
