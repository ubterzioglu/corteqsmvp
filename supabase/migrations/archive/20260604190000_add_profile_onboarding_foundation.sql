begin;

create extension if not exists pgcrypto;

alter table public.submissions
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists onboarding_key text;

create index if not exists idx_submissions_user_id on public.submissions(user_id);
create unique index if not exists idx_submissions_onboarding_key
  on public.submissions (onboarding_key)
  where onboarding_key is not null;

alter table public.submissions enable row level security;

drop policy if exists "Anyone can submit a registration" on public.submissions;
create policy "Anyone can submit a registration"
  on public.submissions
  for insert
  to anon, authenticated
  with check (
    user_id is null
    or auth.uid() = user_id
  );

create table if not exists public.profile_onboarding_imports (
  id uuid primary key default gen_random_uuid(),
  batch_id text not null,
  source_submission_id uuid not null references public.submissions(id) on delete cascade,
  email_normalized text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  profile_user_id uuid references public.user_profiles(user_id) on delete set null,
  source_type text not null default 'form',
  status text not null default 'queued'
    check (
      status in (
        'queued',
        'invalid_email',
        'duplicate_submission',
        'existing_auth_user',
        'profile_created',
        'invited',
        'invite_failed',
        'pending_user_review',
        'active',
        'manual_review',
        'opted_out'
      )
    ),
  invite_sent_at timestamptz,
  activated_at timestamptz,
  retry_count integer not null default 0,
  last_error text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, source_submission_id),
  unique (batch_id, email_normalized)
);

create index if not exists idx_profile_onboarding_imports_email_normalized
  on public.profile_onboarding_imports(email_normalized);
create index if not exists idx_profile_onboarding_imports_auth_user_id
  on public.profile_onboarding_imports(auth_user_id);
create index if not exists idx_profile_onboarding_imports_profile_user_id
  on public.profile_onboarding_imports(profile_user_id);
create index if not exists idx_profile_onboarding_imports_status
  on public.profile_onboarding_imports(status);
create index if not exists idx_profile_onboarding_imports_batch_id
  on public.profile_onboarding_imports(batch_id);

drop trigger if exists trg_profile_onboarding_imports_updated_at on public.profile_onboarding_imports;
create trigger trg_profile_onboarding_imports_updated_at
before update on public.profile_onboarding_imports
for each row execute function public.set_updated_at();

alter table public.profile_onboarding_imports enable row level security;

drop policy if exists "profile_onboarding_imports_admin_select" on public.profile_onboarding_imports;
create policy "profile_onboarding_imports_admin_select"
on public.profile_onboarding_imports
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "profile_onboarding_imports_admin_update" on public.profile_onboarding_imports;
create policy "profile_onboarding_imports_admin_update"
on public.profile_onboarding_imports
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

revoke all on public.profile_onboarding_imports from anon;
revoke all on public.profile_onboarding_imports from authenticated;
grant select, update on public.profile_onboarding_imports to authenticated;

with attribute_seed(key, label, description, data_type, is_system, sort_order) as (
  values
    ('business_or_organization', 'İşletme / Kuruluş', 'Kullanıcının ilişkilendirdiği işletme veya kuruluş bilgisi.', 'text', false, 171),
    ('interest_focus', 'İştigal / İlgi Sahası', 'Kullanıcının iştigal veya ilgi sahası.', 'text', false, 172),
    ('referral_code', 'Referral Kodu', 'Kullanıcıyla ilişkilendirilmiş referral kodu.', 'text', false, 173),
    ('referral_source', 'Bizi nereden buldunuz?', 'Kullanıcının CorteQS ile ilk temas kaynağı.', 'select', false, 174)
)
insert into public.attribute_catalog (
  key,
  label,
  description,
  data_type,
  is_active,
  is_system,
  sort_order
)
select
  key,
  label,
  description,
  data_type,
  true,
  is_system,
  sort_order
from attribute_seed
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  data_type = excluded.data_type,
  is_active = excluded.is_active,
  is_system = excluded.is_system,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.role_attribute_rules (
  role_id,
  attribute_id,
  is_enabled,
  is_required,
  is_public_default,
  user_can_edit,
  user_can_hide,
  requires_admin_approval_on_change,
  sort_order
)
select
  r.id,
  ac.id,
  true,
  ac.key in ('referral_code', 'referral_source'),
  ac.key in ('business_or_organization', 'interest_focus'),
  true,
  ac.key in ('business_or_organization', 'interest_focus'),
  false,
  ac.sort_order
from public.roles r
join public.attribute_catalog ac
  on ac.key in ('business_or_organization', 'interest_focus', 'referral_code', 'referral_source')
where r.key = 'bireysel'
on conflict (role_id, attribute_id) do update
set
  is_enabled = excluded.is_enabled,
  is_required = excluded.is_required,
  is_public_default = excluded.is_public_default,
  user_can_edit = excluded.user_can_edit,
  user_can_hide = excluded.user_can_hide,
  requires_admin_approval_on_change = excluded.requires_admin_approval_on_change,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace function public.normalize_profile_onboarding_email(input_email text)
returns text
language sql
immutable
as $$
  select lower(btrim(coalesce(input_email, '')));
$$;

create or replace function public.validate_profile_onboarding_referral_source(input_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_value text := nullif(btrim(coalesce(input_value, '')), '');
begin
  if v_value is null then
    return null;
  end if;

  if v_value not in (
    'whatsapp',
    'instagram',
    'linkedin',
    'x-twitter',
    'facebook',
    'tiktok',
    'youtube',
    'arkadas-tavsiye',
    'etkinlik',
    'google',
    'basin-haber',
    'diger'
  ) then
    raise exception 'invalid referral source' using errcode = '22023';
  end if;

  return v_value;
end;
$$;

create or replace function public.sync_individual_public_profile_settings_from_attribute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attribute_key text;
  v_user_id uuid;
  v_profile_settings jsonb;
  v_value_text text;
  v_visibility text;
  v_approval_status text;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_visibility := 'private';
    v_approval_status := 'rejected';
    select key into v_attribute_key from public.attribute_catalog where id = old.attribute_id limit 1;
    v_value_text := null;
  else
    v_user_id := new.user_id;
    v_visibility := new.visibility;
    v_approval_status := new.approval_status;
    select key into v_attribute_key from public.attribute_catalog where id = new.attribute_id limit 1;
    v_value_text := nullif(btrim(coalesce(new.value_text, new.value_json #>> '{}', '')), '');
  end if;

  if v_attribute_key not in ('business_or_organization', 'interest_focus', 'referral_code', 'referral_source') then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  insert into public.individual_profile_details (user_id, profile_settings)
  values (v_user_id, '{}'::jsonb)
  on conflict (user_id) do nothing;

  select coalesce(profile_settings, '{}'::jsonb)
  into v_profile_settings
  from public.individual_profile_details
  where user_id = v_user_id
  for update;

  if v_attribute_key in ('business_or_organization', 'interest_focus')
     and v_visibility = 'public'
     and v_approval_status = 'approved'
     and v_value_text is not null then
    v_profile_settings := jsonb_set(
      coalesce(v_profile_settings, '{}'::jsonb),
      array[v_attribute_key],
      to_jsonb(v_value_text),
      true
    );
  else
    v_profile_settings := coalesce(v_profile_settings, '{}'::jsonb) - v_attribute_key;
  end if;

  v_profile_settings := v_profile_settings - 'referral_code' - 'referral_source';

  update public.individual_profile_details
  set
    profile_settings = v_profile_settings,
    updated_at = now()
  where user_id = v_user_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_individual_public_profile_settings_from_attribute on public.user_profile_attributes;
create trigger trg_sync_individual_public_profile_settings_from_attribute
after insert or update or delete on public.user_profile_attributes
for each row execute function public.sync_individual_public_profile_settings_from_attribute();

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

  if v_attribute.key in ('referral_code', 'referral_source') then
    v_visibility := 'private';
  else
    v_visibility := coalesce(visibility, case when v_rule.is_public_default then 'public' else 'private' end);
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if not v_rule.user_can_hide and v_visibility <> 'public' and v_attribute.key not in ('referral_code', 'referral_source') then
    raise exception 'attribute visibility cannot be changed' using errcode = '42501';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_attribute.key = 'referral_code' and v_value_text is not null then
    v_value_text := upper(v_value_text);
    attribute_value := to_jsonb(v_value_text);
  end if;

  if v_attribute.key = 'referral_source' then
    v_value_text := public.validate_profile_onboarding_referral_source(v_value_text);
    attribute_value := to_jsonb(v_value_text);
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

create or replace function public.admin_update_user_profile_attribute(
  target_user_id uuid,
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
  v_attribute public.attribute_catalog%rowtype;
  v_visibility text;
  v_value_text text;
  v_before public.user_profile_attributes%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_user_id is null then
    raise exception 'target user is required' using errcode = '22023';
  end if;

  if attribute_key is null or btrim(attribute_key) = '' then
    raise exception 'attribute key is required' using errcode = '22023';
  end if;

  if attribute_key = 'full_name' then
    update public.user_profiles
    set
      full_name = nullif(btrim(coalesce(attribute_value #>> '{}', '')), ''),
      updated_at = now()
    where user_id = target_user_id;

    if not found then
      raise exception 'user profile not found' using errcode = 'P0002';
    end if;

    perform public.write_admin_audit_log(
      'admin.user_profile_attribute_updated',
      target_user_id,
      'user_profile',
      target_user_id,
      null,
      jsonb_build_object(
        'attribute_key', attribute_key,
        'value', attribute_value,
        'visibility', 'public'
      )
    );

    return jsonb_build_object(
      'attribute_key', attribute_key,
      'status', 'approved'
    );
  end if;

  select * into v_attribute
  from public.attribute_catalog
  where key = attribute_key
    and is_active = true
  limit 1;

  if v_attribute.id is null then
    raise exception 'invalid attribute key' using errcode = '22023';
  end if;

  if v_attribute.key in ('referral_code', 'referral_source') then
    v_visibility := 'private';
  else
    v_visibility := coalesce(visibility, 'private');
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception 'invalid visibility' using errcode = '22023';
  end if;

  if v_attribute.data_type in ('text','textarea','select','url','phone') then
    v_value_text := nullif(btrim(coalesce(attribute_value #>> '{}', '')), '');
  end if;

  if v_attribute.key = 'referral_code' and v_value_text is not null then
    v_value_text := upper(v_value_text);
    attribute_value := to_jsonb(v_value_text);
  end if;

  if v_attribute.key = 'referral_source' then
    v_value_text := public.validate_profile_onboarding_referral_source(v_value_text);
    attribute_value := to_jsonb(v_value_text);
  end if;

  select * into v_before
  from public.user_profile_attributes
  where user_id = target_user_id
    and attribute_id = v_attribute.id
  limit 1;

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
    target_user_id,
    v_attribute.id,
    case when v_attribute.data_type in ('text','textarea','select','url','phone') then v_value_text else null end,
    case when v_attribute.data_type in ('multi_select','boolean','json') then attribute_value else null end,
    v_visibility,
    'approved',
    auth.uid(),
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

  perform public.write_admin_audit_log(
    'admin.user_profile_attribute_updated',
    target_user_id,
    'user_profile_attribute',
    target_user_id,
    case when v_before.id is null then null else to_jsonb(v_before) end,
    jsonb_build_object(
      'attribute_key', attribute_key,
      'value', attribute_value,
      'visibility', v_visibility
    )
  );

  return jsonb_build_object(
    'attribute_key', attribute_key,
    'status', 'approved'
  );
end;
$$;

create or replace function public.get_current_profile_onboarding_activation()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_normalized text;
  v_payload jsonb;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select public.normalize_profile_onboarding_email(email)
  into v_email_normalized
  from auth.users
  where id = v_user_id;

  update public.profile_onboarding_imports poi
  set
    auth_user_id = v_user_id,
    updated_at = now()
  where poi.id = (
    select candidate.id
    from public.profile_onboarding_imports candidate
    where candidate.auth_user_id is null
      and candidate.email_normalized = v_email_normalized
      and candidate.status in ('queued', 'existing_auth_user', 'profile_created', 'invited', 'pending_user_review')
    order by candidate.created_at desc
    limit 1
  );

  select jsonb_build_object(
    'id', poi.id,
    'batch_id', poi.batch_id,
    'status', poi.status,
    'source_submission_id', poi.source_submission_id,
    'email_normalized', poi.email_normalized,
    'invite_sent_at', poi.invite_sent_at,
    'activated_at', poi.activated_at,
    'snapshot', poi.snapshot,
    'submission', jsonb_build_object(
      'fullname', coalesce(poi.snapshot ->> 'fullname', s.fullname),
      'email', coalesce(poi.snapshot ->> 'email', s.email),
      'country', coalesce(poi.snapshot ->> 'country', s.country),
      'city', coalesce(poi.snapshot ->> 'city', s.city),
      'business', coalesce(poi.snapshot ->> 'business', s.business),
      'field', coalesce(poi.snapshot ->> 'field', s.field),
      'referral_code', coalesce(poi.snapshot ->> 'referral_code', s.referral_code),
      'referral_source', coalesce(poi.snapshot ->> 'referral_source', s.referral_source)
    )
  )
  into v_payload
  from public.profile_onboarding_imports poi
  join public.submissions s on s.id = poi.source_submission_id
  where (poi.auth_user_id = v_user_id or poi.email_normalized = v_email_normalized)
    and poi.status in ('queued', 'existing_auth_user', 'profile_created', 'invited', 'pending_user_review')
  order by poi.created_at desc
  limit 1;

  return v_payload;
end;
$$;

create or replace function public.complete_current_profile_onboarding_activation()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email_normalized text;
  v_row public.profile_onboarding_imports%rowtype;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select public.normalize_profile_onboarding_email(email)
  into v_email_normalized
  from auth.users
  where id = v_user_id;

  select *
  into v_row
  from public.profile_onboarding_imports poi
  where (poi.auth_user_id = v_user_id or poi.email_normalized = v_email_normalized)
    and poi.status in ('queued', 'existing_auth_user', 'profile_created', 'invited', 'pending_user_review')
  order by poi.created_at desc
  limit 1
  for update;

  if v_row.id is null then
    raise exception 'onboarding import not found' using errcode = 'P0002';
  end if;

  update public.profile_onboarding_imports
  set
    auth_user_id = v_user_id,
    profile_user_id = v_user_id,
    status = 'active',
    activated_at = now(),
    updated_at = now()
  where id = v_row.id;

  insert into public.admin_audit_logs (
    actor_user_id,
    action,
    target_user_id,
    target_entity_type,
    target_entity_id,
    before_value,
    after_value
  ) values (
    v_user_id,
    'profile.onboarding_activated',
    v_user_id,
    'profile_onboarding_import',
    v_row.id,
    jsonb_build_object(
      'status', v_row.status,
      'activated_at', v_row.activated_at
    ),
    jsonb_build_object(
      'status', 'active',
      'activated_at', now(),
      'source_submission_id', v_row.source_submission_id
    )
  );

  return jsonb_build_object(
    'id', v_row.id,
    'status', 'active',
    'activated_at', now()
  );
end;
$$;

grant execute on function public.get_current_profile_onboarding_activation() to authenticated;
grant execute on function public.complete_current_profile_onboarding_activation() to authenticated;

commit;
