begin;

-- Keep the account independent from admin users while granting feature access.
delete from public.admin_users
where user_id in (
  select id
  from auth.users
  where lower(email) = 'corteqspersonal@gmail.com'
);

with target_user as (
  select
    up.user_id
  from public.user_profiles up
  where lower(up.email) = 'corteqspersonal@gmail.com'
)
update public.user_profiles up
set
  profile_type = 'bireysel',
  updated_at = now()
where up.user_id in (select user_id from target_user)
  and up.profile_type is distinct from 'bireysel';

update public.feature_catalog
set
  is_active_globally = true,
  updated_at = now()
where key in (
  'city.manage',
  'dashboard.tab_whatsapp',
  'dashboard.tab_analitik'
);

with target_user as (
  select
    up.user_id
  from public.user_profiles up
  where lower(up.email) = 'corteqspersonal@gmail.com'
),
feature_overrides as (
  select
    tu.user_id,
    fc.key as feature_key,
    case
      when fc.key = 'admin.requires_approval' then false
      else true
    end as is_enabled,
    case
      when fc.key = 'admin.requires_approval' then 'Independent from admin approval'
      else 'Full feature access for independent bireysel account'
    end as reason
  from target_user tu
  join public.feature_catalog fc
    on fc.scope_role in ('*', 'bireysel')
  where fc.key <> 'dashboard.admin_onizleme_modu'
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
