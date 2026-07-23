begin;

-- Bridge: every role in public.roles gets a matching catalog_item_type.
-- linked_role_key column lets get_catalog_item_profile resolve rules from
-- role_attribute_rules / role_feature_flags instead of item_type_attribute_rules.

-- 1. Add linked_role_key to catalog_item_types
alter table public.catalog_item_types
  add column if not exists linked_role_key text
    references public.roles(key) on delete set null;

-- 2. Map existing legacy item types to their canonical roles
update public.catalog_item_types set linked_role_key = 'bireysel'         where key = 'member';
update public.catalog_item_types set linked_role_key = 'danisman'         where key = 'advisor';
update public.catalog_item_types set linked_role_key = 'kurulus-dernek'   where key = 'organization';
update public.catalog_item_types set linked_role_key = 'isletme'          where key = 'business';
update public.catalog_item_types set linked_role_key = 'blogger-vlogger-youtuber' where key = 'person_profile';

-- 3. Upsert one catalog_item_type for every active role
--    Existing rows are updated to set linked_role_key = role key.
--    New rows are inserted with key = label = role.key / role.label.
insert into public.catalog_item_types (key, label, linked_role_key, is_active)
select
  r.key,
  r.label,
  r.key,
  true
from public.roles r
where r.is_active = true
on conflict (key) do update
  set
    linked_role_key = excluded.linked_role_key,
    is_active       = true,
    updated_at      = now()
  where public.catalog_item_types.linked_role_key is distinct from excluded.linked_role_key
     or public.catalog_item_types.is_active is distinct from true;

commit;
