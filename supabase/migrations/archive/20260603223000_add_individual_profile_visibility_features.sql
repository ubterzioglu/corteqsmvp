begin;

with feature_seed(feature_key, label, description, scope_role, scope, feature_type, sort_order) as (
  values
    (
      'individual.job_seeking_badge',
      'İş Arıyorum Badge''i',
      'Profilinde "İş Arıyorum" etiketi görünür.',
      '*',
      'profile',
      'capability',
      175
    ),
    (
      'individual.moving_soon_badge',
      'Yakında Taşınacağım',
      'Taşınacağın ülke/şehir profilinde rozet olarak görünür ve "Taşınacaklar" filtresinde listelenirsin.',
      '*',
      'profile',
      'capability',
      176
    ),
    (
      'individual.volunteer_mentorship',
      'Gönüllü Mentörlük',
      'Açıldığında profilinden otomatik bir Gönüllü Mentör kartı oluşturulur.',
      '*',
      'profile',
      'capability',
      177
    )
)
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
select
  feature_key,
  label,
  description,
  scope_role,
  scope,
  feature_type,
  '{}'::jsonb,
  sort_order,
  true
from feature_seed
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
select
  r.id,
  fs.feature_key,
  true,
  null
from public.roles r
cross join (
  values
    ('individual.job_seeking_badge'),
    ('individual.moving_soon_badge'),
    ('individual.volunteer_mentorship')
) as fs(feature_key)
where r.is_active = true
on conflict (role_id, feature_key) do update
set
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.role_feature_defaults (profile_type, feature_key, is_enabled)
select
  r.key,
  fs.feature_key,
  true
from public.roles r
cross join (
  values
    ('individual.job_seeking_badge'),
    ('individual.moving_soon_badge'),
    ('individual.volunteer_mentorship')
) as fs(feature_key)
where r.is_active = true
on conflict (profile_type, feature_key) do update
set
  is_enabled = excluded.is_enabled;

commit;
