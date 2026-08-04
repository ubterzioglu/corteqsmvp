begin;

insert into public.feature_catalog (
  key,
  label,
  description,
  scope_role,
  scope,
  feature_type,
  metadata,
  sort_order,
  is_active_globally
)
values (
  'cadde.access',
  'Cadde Erişimi',
  'Kullanıcının CorteQS Cadde sayfasına erişmesini sağlar.',
  '*',
  'cadde',
  'page',
  jsonb_build_object('route', '/cadde'),
  615,
  true
)
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  scope_role = excluded.scope_role,
  scope = excluded.scope,
  feature_type = excluded.feature_type,
  metadata = excluded.metadata,
  sort_order = excluded.sort_order,
  is_active_globally = excluded.is_active_globally,
  updated_at = now();

insert into public.role_feature_flags (role_id, feature_key, is_enabled, updated_by)
select r.id, 'cadde.access', true, null
from public.roles r
where r.is_active = true
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select r.key, 'cadde.access', true
from public.roles r
where r.is_active = true
on conflict (profile_type, feature_key) do update
set
  is_enabled = excluded.is_enabled;

commit;
