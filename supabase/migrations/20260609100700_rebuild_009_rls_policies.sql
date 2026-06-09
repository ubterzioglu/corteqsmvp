-- Catalog/Flat-Role/AFS Rebuild — Migration 009: RLS policies
--
-- Renamed tables KEEP their existing RLS policies automatically (policies follow
-- the table through ALTER TABLE RENAME). This migration:
--   1. enables RLS + baseline policies on the NEW catalog_item_roles table
--   2. (the wholesale RLS rewrite to the design §6 visibility model is performed
--      in Phase 4 alongside the RPC rewire — doing it here, before RPCs are
--      updated, would break access mid-stream)
--
-- Visibility model (design §6): public can read role links of public items;
-- owners/managers/admins manage. Mutations go through SECURITY DEFINER RPCs.
-- Idempotent.

begin;

alter table public.catalog_item_roles enable row level security;

-- public read: role link of a publicly-visible, active item
drop policy if exists catalog_item_roles_public_read on public.catalog_item_roles;
create policy catalog_item_roles_public_read
  on public.catalog_item_roles for select
  using (
    exists (
      select 1 from public.catalog_items ci
      where ci.id = catalog_item_roles.catalog_item_id
        and ci.status = 'active'
        and ci.visibility = 'public'
        and ci.deleted_at is null
    )
  );

-- authenticated read: any signed-in user can read role links (directory needs it)
drop policy if exists catalog_item_roles_auth_read on public.catalog_item_roles;
create policy catalog_item_roles_auth_read
  on public.catalog_item_roles for select
  to authenticated
  using (true);

-- writes: only via SECURITY DEFINER RPCs / service role. No direct client writes.
drop policy if exists catalog_item_roles_no_client_write on public.catalog_item_roles;
create policy catalog_item_roles_no_client_write
  on public.catalog_item_roles for all
  to authenticated
  using (false)
  with check (false);

comment on table public.catalog_item_roles is
  'Rebuild 2026-06-09: M:N item<->role link. RLS: public/auth read; writes via RPC only. '
  'Wholesale RLS rewrite for renamed tables happens in Phase 4 with the RPC rewire.';

commit;
