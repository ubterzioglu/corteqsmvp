-- Catalog/Flat-Role/AFS Rebuild — Migration 003: flat roles
--
-- Enforces the product invariant: roles are FLAT. Removes the role-family
-- residue columns. Does NOT delete the 6 legacy role rows here (that is a
-- destructive data change deferred to migration 016 after all consumers are
-- rewired and the placeholders exist) — but marks them inactive so they stop
-- appearing in assignable/selectable lists immediately.
--
-- Live roles columns: id, key, label, description, sort_order, is_active,
--   created_at, updated_at, family_key, parent_role_id, is_assignable,
--   is_directory_visible, default_item_type, is_system, metadata
--
-- Target (design §3): id, key, label, description, is_active, sort_order,
--   created_at, updated_at, deleted_at  (+ keep is_assignable/is_directory_visible
--   as legitimate flat-role flags; drop family_key, parent_role_id, default_item_type).
--
-- default_item_type encodes the role->item_type family indirection that is being
-- torn down, so it is dropped. is_system kept (harmless boolean). metadata kept.
--
-- Idempotent.

begin;

-- 1. Drop the FK from roles.parent_role_id first (self-ref family link), if present.
do $$
declare cname text;
begin
  select tc.constraint_name into cname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
  where tc.table_schema='public' and tc.table_name='roles'
    and tc.constraint_type='FOREIGN KEY' and kcu.column_name='parent_role_id'
  limit 1;
  if cname is not null then
    execute format('alter table public.roles drop constraint %I', cname);
  end if;
end $$;

-- 2. Drop family-residue columns.
alter table public.roles drop column if exists parent_role_id;
alter table public.roles drop column if exists family_key;
alter table public.roles drop column if exists default_item_type;

-- 3. Soft-delete support.
alter table public.roles add column if not exists deleted_at timestamptz;

-- 4. Deactivate the 6 legacy roles (full deletion deferred to 016).
update public.roles
  set is_active = false
  where key in ('bireysel','danisman','isletme','kurulus-dernek',
                'blogger-vlogger-youtuber','sehir-elcisi')
    and is_active is distinct from false;

comment on table public.roles is
  'Rebuild 2026-06-09: FLAT roles only. No families/parent/inheritance. '
  '6 legacy roles deactivated here; deleted in migration 016.';

commit;
