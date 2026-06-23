-- Cadde mobile audit follow-up
-- Goal: identify non-standard cafe capacities before enforcing a tighter allowlist.
-- Review every row returned by the preview query before making any data change.

-- 1. Preview active/public cafes whose capacity is outside the new UI allowlist.
select
  id,
  title,
  capacity,
  status,
  is_active,
  created_at
from public.cadde_cafes
where capacity is not null
  and capacity not in (10, 25, 50)
order by created_at desc;

-- 2. After product review, normalize each outlier explicitly.
-- Example:
-- update public.cadde_cafes
-- set capacity = 50
-- where id = 'replace-with-reviewed-cafe-id'
--   and capacity = 75;

-- 3. Optional hardening step after all outliers are cleaned:
-- alter table public.cadde_cafes
--   drop constraint if exists cadde_cafes_capacity_check;
--
-- alter table public.cadde_cafes
--   add constraint cadde_cafes_capacity_check
--   check (capacity is null or capacity in (10, 25, 50));
