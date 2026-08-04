begin;

alter table public.catalog_items
  add column if not exists linked_user_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_catalog_items_linked_user_id
  on public.catalog_items (linked_user_id)
  where linked_user_id is not null;

comment on column public.catalog_items.linked_user_id is
  'AFS bridge: authenticated user that owns or represents this catalog record.';

create table if not exists public.catalog_item_attributes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  value_text text,
  value_json jsonb,
  visibility text not null default 'private'
    check (visibility in ('public', 'private', 'admin_only')),
  approval_status text not null default 'approved'
    check (approval_status in ('draft', 'pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, attribute_id),
  constraint catalog_item_attributes_value_check
    check (value_text is not null or value_json is not null)
);

create index if not exists idx_catalog_item_attributes_item_id
  on public.catalog_item_attributes(item_id);

create index if not exists idx_catalog_item_attributes_attribute_id
  on public.catalog_item_attributes(attribute_id);

create table if not exists public.item_type_attribute_rules (
  id uuid primary key default gen_random_uuid(),
  item_type text not null references public.catalog_item_types(key) on delete cascade,
  attribute_id uuid not null references public.attribute_catalog(id) on delete cascade,
  is_enabled boolean not null default true,
  is_required boolean not null default false,
  is_public_default boolean not null default false,
  editor_can_edit boolean not null default true,
  editor_can_hide boolean not null default true,
  requires_admin_approval_on_change boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, attribute_id)
);

create index if not exists idx_item_type_attribute_rules_item_type
  on public.item_type_attribute_rules(item_type);

create table if not exists public.item_type_feature_defaults (
  id uuid primary key default gen_random_uuid(),
  item_type text not null references public.catalog_item_types(key) on delete cascade,
  feature_key text not null references public.feature_definitions(key) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_type, feature_key)
);

create index if not exists idx_item_type_feature_defaults_item_type
  on public.item_type_feature_defaults(item_type);

alter table public.catalog_item_feature_overrides
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists reason text;

do $$
declare
  v_table_name text;
begin
  foreach v_table_name in array array[
    'catalog_item_attributes',
    'item_type_attribute_rules',
    'item_type_feature_defaults'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s', v_table_name);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s for each row execute function public.update_updated_at_column()',
      v_table_name
    );
  end loop;
end
$$;

alter table public.catalog_item_attributes enable row level security;
alter table public.item_type_attribute_rules enable row level security;
alter table public.item_type_feature_defaults enable row level security;

drop policy if exists "catalog_item_attributes_public_read" on public.catalog_item_attributes;
create policy "catalog_item_attributes_public_read"
on public.catalog_item_attributes
for select
to anon, authenticated
using (
  visibility = 'public'
  and public.catalog_item_is_publicly_visible(item_id)
);

drop policy if exists "catalog_item_attributes_editor_read" on public.catalog_item_attributes;
create policy "catalog_item_attributes_editor_read"
on public.catalog_item_attributes
for select
to authenticated
using (
  public.catalog_user_can_edit_item(auth.uid(), item_id)
  or exists (
    select 1
    from public.catalog_items ci
    where ci.id = item_id
      and ci.linked_user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

drop policy if exists "catalog_item_attributes_admin_write" on public.catalog_item_attributes;
create policy "catalog_item_attributes_admin_write"
on public.catalog_item_attributes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "item_type_attribute_rules_read_authenticated" on public.item_type_attribute_rules;
create policy "item_type_attribute_rules_read_authenticated"
on public.item_type_attribute_rules
for select
to authenticated
using (true);

drop policy if exists "item_type_attribute_rules_admin_write" on public.item_type_attribute_rules;
create policy "item_type_attribute_rules_admin_write"
on public.item_type_attribute_rules
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "item_type_feature_defaults_read_authenticated" on public.item_type_feature_defaults;
create policy "item_type_feature_defaults_read_authenticated"
on public.item_type_feature_defaults
for select
to authenticated
using (true);

drop policy if exists "item_type_feature_defaults_admin_write" on public.item_type_feature_defaults;
create policy "item_type_feature_defaults_admin_write"
on public.item_type_feature_defaults
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "catalog_items_self_select_linked_user" on public.catalog_items;
create policy "catalog_items_self_select_linked_user"
on public.catalog_items
for select
to authenticated
using (linked_user_id = auth.uid());

drop policy if exists "catalog_items_self_update_linked_user" on public.catalog_items;
create policy "catalog_items_self_update_linked_user"
on public.catalog_items
for update
to authenticated
using (linked_user_id = auth.uid())
with check (linked_user_id = auth.uid());

drop policy if exists "catalog_item_feature_overrides_select_linked_user" on public.catalog_item_feature_overrides;
create policy "catalog_item_feature_overrides_select_linked_user"
on public.catalog_item_feature_overrides
for select
to authenticated
using (
  public.catalog_user_can_edit_item(auth.uid(), item_id)
  or exists (
    select 1
    from public.catalog_items ci
    where ci.id = item_id
      and ci.linked_user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

grant select on public.catalog_item_attributes to anon, authenticated;
grant select on public.item_type_attribute_rules, public.item_type_feature_defaults to authenticated;
grant insert, update, delete on public.catalog_item_attributes, public.item_type_attribute_rules, public.item_type_feature_defaults to authenticated, service_role;

commit;
