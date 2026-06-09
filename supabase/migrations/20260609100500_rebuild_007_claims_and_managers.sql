-- Catalog/Flat-Role/AFS Rebuild — Migration 007: claims + managers
--
-- Renames the claim + membership tables to the plan's names and aligns columns.
-- RENAME preserves the item_id FKs.
--
--   catalog_claim_requests   -> catalog_item_claims
--   catalog_item_memberships -> catalog_item_managers
--
-- Live catalog_claim_requests: id, item_id, requested_by_user_id, claim_type,
--   evidence, note, status, reviewed_by_user_id, reviewed_at, created_at, updated_at
-- Live catalog_item_memberships: id, item_id, user_id, role, status,
--   created_at, updated_at
--
-- Plan status domain: pending|approved|rejected|cancelled
-- Plan manager_role domain: owner|admin|editor|moderator
-- Idempotent.

begin;

-- 1. catalog_claim_requests -> catalog_item_claims
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_claim_requests')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_item_claims') then
    alter table public.catalog_claim_requests rename to catalog_item_claims;
  end if;
end $$;

-- status domain guard (only if column exists and constraint absent)
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_item_claims' and column_name='status')
     and not exists (select 1 from pg_constraint where conname='catalog_item_claims_status_chk') then
    alter table public.catalog_item_claims
      add constraint catalog_item_claims_status_chk
      check (status in ('pending','approved','rejected','cancelled'));
  end if;
end $$;

-- 2. catalog_item_memberships -> catalog_item_managers
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_item_memberships')
     and not exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='catalog_item_managers') then
    alter table public.catalog_item_memberships rename to catalog_item_managers;
  end if;
end $$;

-- expose manager_role synonym (live column is `role`); keep `role` until rewire.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_item_managers' and column_name='role')
     and not exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_item_managers' and column_name='manager_role') then
    alter table public.catalog_item_managers rename column role to manager_role;
  end if;
end $$;

-- manager_role domain guard
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='catalog_item_managers' and column_name='manager_role')
     and not exists (select 1 from pg_constraint where conname='catalog_item_managers_role_chk') then
    -- widen-safe: only enforce if existing values already conform
    if not exists (
      select 1 from public.catalog_item_managers
      where manager_role is not null
        and manager_role not in ('owner','admin','editor','moderator')) then
      alter table public.catalog_item_managers
        add constraint catalog_item_managers_role_chk
        check (manager_role in ('owner','admin','editor','moderator'));
    end if;
  end if;
end $$;

comment on table public.catalog_item_claims   is 'Rebuild 2026-06-09: item claim requests (was catalog_claim_requests).';
comment on table public.catalog_item_managers is 'Rebuild 2026-06-09: item managers (was catalog_item_memberships).';

commit;
