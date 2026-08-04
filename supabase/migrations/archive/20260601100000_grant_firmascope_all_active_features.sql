begin;

-- Keep the account independent from admin users while granting feature access.
delete from public.admin_users
where user_id in (
  select id
  from auth.users
  where lower(email) = 'firmascope@gmail.com'
);

with target_user as (
  select
    up.user_id
  from public.user_profiles up
  where lower(up.email) = 'firmascope@gmail.com'
)
update public.user_profiles up
set
  profile_type = 'bireysel',
  updated_at = now()
where up.user_id in (select user_id from target_user)
  and up.profile_type is distinct from 'bireysel';

with target_user as (
  select
    up.user_id
  from public.user_profiles up
  where lower(up.email) = 'firmascope@gmail.com'
),
feature_overrides as (
  select
    tu.user_id,
    fc.key as feature_key,
    true as is_enabled,
    'All globally active features granted for firmascope bireysel account' as reason
  from target_user tu
  join public.feature_catalog fc
    on fc.is_active_globally = true
)
insert into public.user_feature_overrides (
  user_id,
  feature_key,
  is_enabled,
  updated_by,
  updated_at,
  reason
)
select
  fo.user_id,
  fo.feature_key,
  fo.is_enabled,
  null,
  now(),
  fo.reason
from feature_overrides fo
on conflict (user_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at,
  reason = excluded.reason;

commit;
