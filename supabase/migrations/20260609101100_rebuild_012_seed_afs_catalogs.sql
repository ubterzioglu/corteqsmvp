-- Catalog/Flat-Role/AFS Rebuild — Migration 012: seed AFS catalogs
--
-- The AFS catalogs already hold their rows (afs_attributes=53, afs_features=42,
-- afs_sections=7, seeded by history). This migration assigns the storage_strategy
-- + default_visibility values the rebuild design requires (report 03), and asserts
-- the catalog counts. Idempotent.

begin;

-- storage_strategy per report 03 (only set where still at the default).
-- core_column attributes (promoted onto catalog_items)
update public.afs_attributes set storage_strategy='core_column'
  where key in ('full_name','country','city','bio_short','avatar_url','profile_photo_url','is_verified')
    and storage_strategy = 'dynamic_value';

-- private_storage (never public)
update public.afs_attributes set storage_strategy='private_storage', default_visibility='owner'
  where key in ('cv_doc','cv_path','cv_name','presentation_doc','presentation_path',
                'presentation_name','phone','phone_verified','referral_code','referral_source')
    and storage_strategy = 'dynamic_value';

-- Assertions: catalog counts unchanged.
do $$
declare a int; f int; s int;
begin
  select count(*) into a from public.afs_attributes;
  select count(*) into f from public.afs_features;
  select count(*) into s from public.afs_sections;
  if a <> 53 then raise exception 'Expected 53 afs_attributes, found %', a; end if;
  if f <> 42 then raise exception 'Expected 42 afs_features, found %', f; end if;
  if s <> 7  then raise exception 'Expected 7 afs_sections, found %', s; end if;
end $$;

commit;
