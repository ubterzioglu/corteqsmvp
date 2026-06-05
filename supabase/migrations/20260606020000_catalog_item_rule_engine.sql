begin;

create table if not exists public.catalog_item_attribute_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  attribute_key text not null references public.attribute_catalog(key) on delete cascade,
  is_enabled boolean not null default true,
  display_order integer,
  override_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, attribute_key)
);

create table if not exists public.catalog_item_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  feature_key text not null references public.feature_catalog(key) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, feature_key)
);

create table if not exists public.catalog_item_section_overrides (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  section_key text not null references public.profile_section_catalog(key) on delete cascade,
  is_visible boolean not null default true,
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, section_key)
);

create index if not exists idx_catalog_item_attribute_overrides_item
  on public.catalog_item_attribute_overrides(item_id);
create index if not exists idx_catalog_item_feature_overrides_item
  on public.catalog_item_feature_overrides(item_id);
create index if not exists idx_catalog_item_section_overrides_item
  on public.catalog_item_section_overrides(item_id);

alter table public.catalog_item_attribute_overrides enable row level security;
alter table public.catalog_item_feature_overrides enable row level security;
alter table public.catalog_item_section_overrides enable row level security;

drop policy if exists "catalog_item_attribute_overrides_select_editors" on public.catalog_item_attribute_overrides;
create policy "catalog_item_attribute_overrides_select_editors"
on public.catalog_item_attribute_overrides
for select to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_item_feature_overrides_select_editors" on public.catalog_item_feature_overrides;
create policy "catalog_item_feature_overrides_select_editors"
on public.catalog_item_feature_overrides
for select to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_item_section_overrides_select_editors" on public.catalog_item_section_overrides;
create policy "catalog_item_section_overrides_select_editors"
on public.catalog_item_section_overrides
for select to authenticated
using (public.catalog_user_can_edit_item(auth.uid(), item_id));

drop policy if exists "catalog_item_attribute_overrides_admin_all" on public.catalog_item_attribute_overrides;
create policy "catalog_item_attribute_overrides_admin_all"
on public.catalog_item_attribute_overrides
for all to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_item_feature_overrides_admin_all" on public.catalog_item_feature_overrides;
create policy "catalog_item_feature_overrides_admin_all"
on public.catalog_item_feature_overrides
for all to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

drop policy if exists "catalog_item_section_overrides_admin_all" on public.catalog_item_section_overrides;
create policy "catalog_item_section_overrides_admin_all"
on public.catalog_item_section_overrides
for all to authenticated
using (public.is_moderator(auth.uid()))
with check (public.is_moderator(auth.uid()));

grant select on public.catalog_item_attribute_overrides, public.catalog_item_feature_overrides, public.catalog_item_section_overrides to authenticated;
grant insert, update, delete on public.catalog_item_attribute_overrides, public.catalog_item_feature_overrides, public.catalog_item_section_overrides to authenticated, service_role;

commit;
