-- Catalog/Flat-Role/AFS Rebuild — Migration 011: seed flat roles
--
-- The 76 flat roles already exist (seeded by migration history). This migration
-- is an idempotent CONFIRMATION + normalization: ensures every one of the 76
-- non-legacy roles is active, and the 6 legacy roles remain deactivated.
-- No new roles are invented. Final assignable count must be 76.

begin;

-- Ensure the 76 current flat roles are active (no-op if already).
update public.roles
  set is_active = true, deleted_at = null
  where key not in ('bireysel','danisman','isletme','kurulus-dernek',
                    'blogger-vlogger-youtuber','sehir-elcisi')
    and (is_active is distinct from true or deleted_at is not null);

-- Defensive: keep legacy deactivated (full delete is in migration 016).
update public.roles
  set is_active = false
  where key in ('bireysel','danisman','isletme','kurulus-dernek',
                'blogger-vlogger-youtuber','sehir-elcisi')
    and is_active is distinct from false;

-- Assertion: exactly 76 active flat roles.
do $$
declare n int;
begin
  select count(*) into n from public.roles where is_active = true and deleted_at is null;
  if n <> 76 then
    raise exception 'Expected 76 active flat roles, found %', n;
  end if;
end $$;

commit;
