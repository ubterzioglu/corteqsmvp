begin;

create table if not exists public.whatsapp_landing_editors (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.whatsapp_landings(id) on delete cascade,
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  granted_by uuid references public.admin_users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (landing_id, user_id)
);

create index if not exists idx_whatsapp_landing_editors_user_id
  on public.whatsapp_landing_editors (user_id, created_at desc);

create index if not exists idx_whatsapp_landing_editors_landing_id
  on public.whatsapp_landing_editors (landing_id, created_at desc);

alter table public.whatsapp_landing_editors enable row level security;

drop policy if exists "Admins can manage whatsapp landing editors" on public.whatsapp_landing_editors;
create policy "Admins can manage whatsapp landing editors"
on public.whatsapp_landing_editors
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users can view own whatsapp landing editor assignments" on public.whatsapp_landing_editors;
create policy "Users can view own whatsapp landing editor assignments"
on public.whatsapp_landing_editors
for select to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

grant select, insert, update, delete on public.whatsapp_landing_editors to authenticated;

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
  'whatsapp_landing.edit_assigned',
  'Atanmış Topluluk Landing Düzenleme',
  'Kullanıcının admin tarafından atandığı topluluk landing kayıtlarını düzenlemesini sağlar.',
  '*',
  'community',
  'capability',
  jsonb_build_object('resource_type', 'whatsapp_landing'),
  610,
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

create or replace function public.current_user_can_edit_whatsapp_landing(p_landing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      public.is_admin(auth.uid())
      or (
        exists (
          select 1
          from public.whatsapp_landing_editors wle
          where wle.landing_id = p_landing_id
            and wle.user_id = auth.uid()
        )
        and exists (
          select 1
          from public.get_current_user_features() guf
          where guf.feature_key = 'whatsapp_landing.edit_assigned'
            and guf.is_enabled = true
        )
      )
    );
$$;

create or replace function public.admin_grant_whatsapp_landing_editor(
  p_landing_id uuid,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_landing_id is null or p_user_id is null then
    raise exception 'landing_id and user_id are required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.whatsapp_landings wl
    where wl.id = p_landing_id
  ) then
    raise exception 'landing not found'
      using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.user_profiles up
    where up.user_id = p_user_id
  ) then
    raise exception 'user profile not found'
      using errcode = 'P0002';
  end if;

  insert into public.whatsapp_landing_editors (landing_id, user_id, granted_by, updated_at)
  values (p_landing_id, p_user_id, auth.uid(), now())
  on conflict (landing_id, user_id) do update
  set
    granted_by = excluded.granted_by,
    updated_at = now()
  returning id into v_assignment_id;

  insert into public.user_feature_overrides (user_id, feature_key, is_enabled, updated_by, updated_at, reason)
  values (
    p_user_id,
    'whatsapp_landing.edit_assigned',
    true,
    auth.uid(),
    now(),
    'Assigned landing editor permission'
  )
  on conflict on constraint user_feature_overrides_pkey do update
  set
    is_enabled = true,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at,
    reason = excluded.reason;

  perform public.write_admin_audit_log(
    'whatsapp_landing.editor_granted',
    p_user_id,
    'whatsapp_landing',
    p_landing_id,
    null,
    jsonb_build_object('landing_id', p_landing_id, 'user_id', p_user_id)
  );

  return v_assignment_id;
end;
$$;

create or replace function public.admin_revoke_whatsapp_landing_editor(
  p_assignment_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.whatsapp_landing_editors%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  if p_assignment_id is null then
    raise exception 'assignment id is required'
      using errcode = '22023';
  end if;

  select *
  into v_assignment
  from public.whatsapp_landing_editors
  where id = p_assignment_id;

  if v_assignment.id is null then
    raise exception 'assignment not found'
      using errcode = 'P0002';
  end if;

  delete from public.whatsapp_landing_editors
  where id = p_assignment_id;

  if not exists (
    select 1
    from public.whatsapp_landing_editors
    where user_id = v_assignment.user_id
  ) then
    delete from public.user_feature_overrides
    where user_id = v_assignment.user_id
      and feature_key = 'whatsapp_landing.edit_assigned';
  end if;

  perform public.write_admin_audit_log(
    'whatsapp_landing.editor_revoked',
    v_assignment.user_id,
    'whatsapp_landing',
    v_assignment.landing_id,
    to_jsonb(v_assignment),
    null
  );
end;
$$;

create or replace function public.get_current_user_editable_whatsapp_landing(
  p_slug text
)
returns setof public.whatsapp_landings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_landing public.whatsapp_landings%rowtype;
begin
  if auth.uid() is null then
    return;
  end if;

  select *
  into v_landing
  from public.whatsapp_landings
  where slug = p_slug
  limit 1;

  if v_landing.id is null then
    return;
  end if;

  if not public.current_user_can_edit_whatsapp_landing(v_landing.id) then
    return;
  end if;

  return next v_landing;
end;
$$;

create or replace function public.update_current_user_editable_whatsapp_landing(
  p_landing_id uuid,
  p_group_name text,
  p_category text,
  p_country text,
  p_city text,
  p_hero_image text,
  p_call_to_action_text text,
  p_conditions text,
  p_whatsapp_link text,
  p_admin_name text,
  p_admin_contact text,
  p_description text
)
returns public.whatsapp_landings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.whatsapp_landings%rowtype;
  v_after public.whatsapp_landings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'unauthorized'
      using errcode = '42501';
  end if;

  select *
  into v_before
  from public.whatsapp_landings
  where id = p_landing_id
  limit 1;

  if v_before.id is null then
    raise exception 'landing not found'
      using errcode = 'P0002';
  end if;

  if not public.current_user_can_edit_whatsapp_landing(v_before.id) then
    raise exception 'forbidden'
      using errcode = '42501';
  end if;

  update public.whatsapp_landings
  set
    group_name = btrim(p_group_name),
    category = btrim(p_category),
    country = btrim(p_country),
    city = btrim(p_city),
    hero_image = nullif(btrim(coalesce(p_hero_image, '')), ''),
    call_to_action_text = nullif(btrim(coalesce(p_call_to_action_text, '')), ''),
    conditions = nullif(btrim(coalesce(p_conditions, '')), ''),
    whatsapp_link = btrim(p_whatsapp_link),
    admin_name = nullif(btrim(coalesce(p_admin_name, '')), ''),
    admin_contact = nullif(btrim(coalesce(p_admin_contact, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    status = 'pending',
    rejection_reason = null,
    updated_at = now()
  where id = v_before.id
  returning * into v_after;

  perform public.write_admin_audit_log(
    'whatsapp_landing.editor_submitted',
    auth.uid(),
    'whatsapp_landing',
    v_after.id,
    to_jsonb(v_before),
    to_jsonb(v_after)
  );

  return v_after;
end;
$$;

grant execute on function public.current_user_can_edit_whatsapp_landing(uuid) to authenticated;
grant execute on function public.admin_grant_whatsapp_landing_editor(uuid, uuid) to authenticated;
grant execute on function public.admin_revoke_whatsapp_landing_editor(uuid) to authenticated;
grant execute on function public.get_current_user_editable_whatsapp_landing(text) to authenticated;
grant execute on function public.update_current_user_editable_whatsapp_landing(uuid, text, text, text, text, text, text, text, text, text, text, text) to authenticated;

commit;
