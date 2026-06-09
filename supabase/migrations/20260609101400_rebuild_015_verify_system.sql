-- Catalog/Flat-Role/AFS Rebuild — Migration 015: verify new system
--
-- Full assertion pass over the rebuilt schema + seed. Raises on any violation so
-- a bad state cannot silently proceed to the legacy drop (016).

begin;

do $$
declare n int;
begin
  -- flat: no family columns on roles
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='roles'
               and column_name in ('family_key','parent_role_id','default_item_type')) then
    raise exception 'roles still has family residue columns';
  end if;

  -- 76 active flat roles
  select count(*) into n from public.roles where is_active=true and deleted_at is null;
  if n <> 76 then raise exception 'active flat roles=% (expected 76)', n; end if;

  -- AFS catalog counts
  select count(*) into n from public.afs_attributes; if n<>53 then raise exception 'afs_attributes=% (expected 53)', n; end if;
  select count(*) into n from public.afs_features;   if n<>42 then raise exception 'afs_features=% (expected 42)', n; end if;
  select count(*) into n from public.afs_sections;   if n<>7  then raise exception 'afs_sections=% (expected 7)', n; end if;

  -- renamed tables present, old names absent
  if not exists (select 1 from information_schema.tables where table_schema='public' and table_name='role_attributes')
     then raise exception 'role_attributes missing'; end if;
  if exists (select 1 from information_schema.tables where table_schema='public'
             and table_name in ('attribute_catalog','feature_catalog','profile_section_catalog',
                                'role_attribute_rules','role_feature_flags','role_profile_section_rules'))
     then raise exception 'legacy catalog/relation table names still exist'; end if;

  -- 76 placeholders, each one primary role
  select count(*) into n from public.catalog_items where is_placeholder=true;
  if n <> 76 then raise exception 'placeholder items=% (expected 76)', n; end if;

  select count(*) into n from public.catalog_items ci
   where ci.is_placeholder=true
     and (select count(*) from public.catalog_item_roles cir where cir.catalog_item_id=ci.id and cir.is_primary) <> 1;
  if n <> 0 then raise exception '% placeholders without exactly one primary role', n; end if;

  -- every active flat role has explicit AFS rows (no inheritance)
  select count(*) into n from public.roles r
   where r.is_active=true and r.deleted_at is null
     and ( not exists (select 1 from public.role_attributes ra where ra.role_id=r.id)
        or not exists (select 1 from public.role_features  rf where rf.role_id=r.id)
        or not exists (select 1 from public.role_sections  rs where rs.role_id=r.id) );
  if n <> 0 then raise exception '% active roles missing explicit AFS rows', n; end if;

  raise notice 'Rebuild verification PASSED: 76 roles, 53/42/7 AFS, 76 placeholders, explicit matrix.';
end $$;

commit;
