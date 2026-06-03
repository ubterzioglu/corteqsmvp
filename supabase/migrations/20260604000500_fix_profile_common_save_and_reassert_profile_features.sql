begin;

with feature_seed(feature_key, label, description, sort_order) as (
  values
    ('individual.job_seeking_badge', 'İş Arıyorum Badge''i', 'Profilde İş Arıyorum etiketi görünür.', 174),
    ('individual.moving_soon_badge', 'Yakında Taşınacağım', 'Taşınma planını rozet ve filtre akışlarında görünür kılar.', 175),
    ('individual.volunteer_mentorship', 'Gönüllü Mentörlük', 'Profil üzerinden gönüllü mentör görünürlüğünü açar.', 176),
    ('profile.linkedin_card', 'LinkedIn Kartı', 'Kullanıcının LinkedIn kartını profilinde yönetmesini sağlar.', 178),
    ('profile.website_card', 'Web Sitesi Kartı', 'Kullanıcının web sitesi kartını profilinde yönetmesini sağlar.', 179),
    ('profile.cv_upload', 'CV Yükleme', 'Kullanıcının profiline CV / özgeçmiş dosyası yüklemesini sağlar.', 180),
    ('profile.presentation_upload', 'Sunum Yükleme', 'Kullanıcının profiline sunum / tanıtım dosyası yüklemesini sağlar.', 181)
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
  '*',
  case
    when feature_key like 'individual.%' then 'individual'
    else 'profile'
  end,
  'capability',
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
    ('individual.volunteer_mentorship'),
    ('profile.linkedin_card'),
    ('profile.website_card'),
    ('profile.cv_upload'),
    ('profile.presentation_upload')
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
    ('individual.volunteer_mentorship'),
    ('profile.linkedin_card'),
    ('profile.website_card'),
    ('profile.cv_upload'),
    ('profile.presentation_upload')
) as fs(feature_key)
where r.is_active = true
on conflict (profile_type, feature_key) do update
set
  is_enabled = excluded.is_enabled;

create or replace function public.update_profile_attribute(
  attribute_key text,
  attribute_value jsonb,
  visibility text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user public.user_profiles%rowtype;
  v_role_key text;
  v_attribute public.attribute_catalog%rowtype;
  v_rule public.role_attribute_rules%rowtype;
  v_visibility text;
  v_value_text text;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.user_profiles where user_id = v_user_id limit 1;
  if v_user.user_id is null then
    raise exception 'user profile not found' using errcode = 'P0002';
  end if;

  v_role_key := v_user.profile_type;

  select * into v_attribute from public.attribute_catalog where key = attribute_key and is_active = true limit 1;
  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  select rar.* into v_rule
  from public.role_attribute_rules rar
  join public.roles r on r.id = rar.role_id
  where r.key = v_role_key
    and rar.attribute_id = v_attribute.id
    and rar.is_enabled = true
  limit 1;

  if v_rule.id is null then
    raise exception 'attribute is not enabled for current role' using errcode = '42501';
  end if;

  if not v_rule.user_can_edit then
    raise exception 'attribute is not editable' using errcode = '42501';
  end if;

  v_visibility := coalesce(visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  if v_visibility not in ('public', 'private') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if not v_rule.user_can_hide and v_visibility <> 'public' then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_rule.requires_admin_approval_on_change then
    insert into public.approval_requests (
      request_type,
      user_id,
      target_entity_type,
      payload,
      status
    ) values (
      'attribute_change',
      v_user_id,
      'attribute',
      jsonb_build_object(
        'attribute_key', attribute_key,
        'attribute_value', attribute_value,
        'visibility', v_visibility
      ),
      'pending'
    ) returning id into v_request_id;

    insert into public.user_profile_attributes (
      user_id,
      attribute_id,
      value_text,
      value_json,
      visibility,
      approval_status,
      updated_at
    ) values (
      v_user_id,
      v_attribute.id,
      case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
      case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
      v_visibility,
      'pending',
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'pending',
      updated_at = now();

    return jsonb_build_object(
      'attribute_key', attribute_key,
      'status', 'pending',
      'request_id', v_request_id
    );
  end if;

  if attribute_key = 'full_name' then
    update public.user_profiles
    set
      full_name = v_value_text,
      updated_at = now()
    where user_id = v_user_id;

    if not found then
      raise exception 'user profile not found' using errcode = 'P0002';
    end if;
  else
    insert into public.user_profile_attributes (
      user_id,
      attribute_id,
      value_text,
      value_json,
      visibility,
      approval_status,
      approved_by,
      approved_at,
      updated_at
    ) values (
      v_user_id,
      v_attribute.id,
      case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
      case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
      v_visibility,
      'approved',
      v_user_id,
      now(),
      now()
    )
    on conflict (user_id, attribute_id) do update
    set
      value_text = excluded.value_text,
      value_json = excluded.value_json,
      visibility = excluded.visibility,
      approval_status = 'approved',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at,
      updated_at = now();
  end if;

  return jsonb_build_object(
    'attribute_key', attribute_key,
    'status', 'approved'
  );
end;
$$;

commit;
