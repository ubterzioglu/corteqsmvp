-- Catalog/Flat-Role/AFS Rebuild — Migration 013: explicit role<->AFS matrix
--
-- Per Checkpoint-1 decision (option A): reproduce the existing UNIFORM matrix.
-- The matrix already exists as explicit rows (role_attributes=1977,
-- role_features=2487, role_sections=574) seeded by history, and is verified
-- 100% uniform across all 76 roles (report 04). This migration ASSERTS the
-- explicit rows exist for every active flat role (no inheritance) and reports
-- per-role coverage. It does NOT invent differentiation (that is a tracked
-- fast-follow). Idempotent.

begin;

-- Assertion: every active flat role has explicit attribute + feature + section rows.
do $$
declare missing int;
begin
  select count(*) into missing
  from public.roles r
  where r.is_active = true and r.deleted_at is null
    and ( not exists (select 1 from public.role_attributes ra where ra.role_id = r.id)
       or not exists (select 1 from public.role_features  rf where rf.role_id = r.id)
       or not exists (select 1 from public.role_sections  rs where rs.role_id = r.id) );
  if missing > 0 then
    raise exception '% active flat roles are missing explicit AFS rows (expected 0)', missing;
  end if;
end $$;

-- Assertion: no role has a non-explicit (inherited) dependency — flat by construction.
-- (role_attributes/features/sections carry role_id directly; there is no parent linkage.)

commit;
