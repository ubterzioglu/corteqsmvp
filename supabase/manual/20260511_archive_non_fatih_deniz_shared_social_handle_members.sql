-- One-off cleanup query for member records.
-- Goal:
-- Delete all members created on 2026-05-11, except "Fatih Deniz".
--
-- Important:
-- If your database does not have public.submissions, switch to the correct
-- project/database first or replace public.submissions with the real table.

begin;

with target_rows as (
  select
    s.id,
    s.fullname,
    s.email,
    s.phone,
    s.status,
    s.source_type,
    s.created_at
  from public.submissions s
  where s.created_at >= timestamptz '2026-05-11 00:00:00+03'
    and s.created_at < timestamptz '2026-05-12 00:00:00+03'
    and lower(trim(s.fullname)) <> 'fatih deniz'
)
select *
from target_rows
order by created_at desc, fullname asc;

-- After reviewing the preview result above, run ONE of the blocks below.

-- Option A: Hard delete
-- delete from public.submissions
-- where created_at >= timestamptz '2026-05-11 00:00:00+03'
--   and created_at < timestamptz '2026-05-12 00:00:00+03'
--   and lower(trim(fullname)) <> 'fatih deniz';

-- Option B: Safer alternative, archive instead of delete
-- update public.submissions
-- set
--   status = 'archived',
--   notes = trim(
--     concat_ws(
--       E'\n',
--       nullif(notes, ''),
--       '[cleanup 2026-05-11] All 2026-05-11 members except Fatih Deniz archived.'
--     )
--   )
-- where created_at >= timestamptz '2026-05-11 00:00:00+03'
--   and created_at < timestamptz '2026-05-12 00:00:00+03'
--   and lower(trim(fullname)) <> 'fatih deniz';

rollback;
