begin;

create or replace function public.sync_member_catalog_role_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_key text;
begin
  if p_user_id is null then
    return;
  end if;

  select r.key
  into v_role_key
  from public.user_role_assignments ura
  join public.roles r on r.id = ura.role_id
  where ura.user_id = p_user_id
  limit 1;

  if v_role_key is null then
    select up.profile_type
    into v_role_key
    from public.user_profiles up
    where up.user_id = p_user_id
    limit 1;
  end if;

  v_role_key := coalesce(v_role_key, 'bireysel');

  update public.catalog_items ci
  set
    platform_role_key = v_role_key,
    attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', v_role_key),
    updated_at = now()
  where ci.linked_user_id = p_user_id
    and ci.item_type = 'member'
    and (
      ci.platform_role_key is distinct from v_role_key
      or coalesce(ci.attributes ->> 'platform_role_key', '') is distinct from v_role_key
    );
end;
$$;

create or replace function public.sync_member_catalog_role_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  perform public.sync_member_catalog_role_for_user(v_user_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_member_catalog_role_from_user_role_assignments on public.user_role_assignments;
create trigger trg_sync_member_catalog_role_from_user_role_assignments
after insert or update or delete on public.user_role_assignments
for each row execute function public.sync_member_catalog_role_trigger();

drop trigger if exists trg_sync_member_catalog_role_from_user_profiles on public.user_profiles;
create trigger trg_sync_member_catalog_role_from_user_profiles
after insert or update of profile_type on public.user_profiles
for each row execute function public.sync_member_catalog_role_trigger();

do $$
declare
  v_user_id uuid;
begin
  for v_user_id in
    select ci.linked_user_id
    from public.catalog_items ci
    where ci.item_type = 'member'
      and ci.linked_user_id is not null
  loop
    perform public.sync_member_catalog_role_for_user(v_user_id);
  end loop;
end;
$$;

create or replace function public.get_current_member_catalog_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'item_id', ci.id,
        'user_id', ci.linked_user_id,
        'full_name', ci.title,
        'profile_type', coalesce(ci.platform_role_key, 'bireysel'),
        'created_at', ci.created_at,
        'status', ci.status,
        'visibility', ci.visibility
      )
      from public.catalog_items ci
      where ci.linked_user_id = auth.uid()
        and ci.item_type = 'member'
      order by ci.created_at asc
      limit 1
    ),
    '{}'::jsonb
  );
$$;

create or replace function public.list_member_catalog_names(p_user_ids uuid[])
returns table (
  user_id uuid,
  full_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ci.linked_user_id as user_id,
    ci.title as full_name
  from public.catalog_items ci
  where ci.item_type = 'member'
    and ci.linked_user_id = any(coalesce(p_user_ids, '{}'::uuid[]));
$$;

create or replace function public.admin_list_member_catalog_profiles(
  p_query text default null,
  p_provider text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_sort text default 'created_desc'
)
returns table (
  item_id uuid,
  user_id uuid,
  email text,
  full_name text,
  profile_type text,
  auth_provider text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_provider text := nullif(btrim(coalesce(p_provider, '')), '');
  v_sort text := coalesce(nullif(btrim(coalesce(p_sort, '')), ''), 'created_desc');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ci.id as item_id,
    ci.linked_user_id as user_id,
    p.email,
    ci.title as full_name,
    coalesce(ci.platform_role_key, 'bireysel') as profile_type,
    up.auth_provider,
    ci.created_at
  from public.catalog_items ci
  left join public.profiles p on p.id = ci.linked_user_id
  left join public.user_profiles up on up.user_id = ci.linked_user_id
  where ci.item_type = 'member'
    and ci.linked_user_id is not null
    and (
      v_provider is null
      or v_provider = 'all'
      or (v_provider = 'unknown' and coalesce(up.auth_provider, 'unknown') = 'unknown')
      or up.auth_provider = v_provider
    )
    and (p_from is null or ci.created_at >= p_from)
    and (p_to is null or ci.created_at < p_to)
    and (
      v_query is null
      or ci.title ilike '%' || v_query || '%'
      or coalesce(p.email, '') ilike '%' || v_query || '%'
    )
  order by
    case when v_sort = 'name_asc' then lower(ci.title) end asc nulls last,
    case when v_sort = 'created_asc' then ci.created_at end asc nulls last,
    case when v_sort = 'created_desc' then ci.created_at end desc nulls last,
    ci.created_at desc,
    ci.title asc;
end;
$$;

create or replace function public.admin_set_member_catalog_role(
  p_item_id uuid,
  p_role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select ci.linked_user_id
  into v_user_id
  from public.catalog_items ci
  where ci.id = p_item_id
    and ci.item_type = 'member'
  limit 1;

  if v_user_id is null then
    raise exception 'member catalog item not found' using errcode = 'P0002';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = p_role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  update public.catalog_items ci
  set
    platform_role_key = p_role_key,
    attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', p_role_key),
    updated_at = now()
  where ci.id = p_item_id;

  update public.user_profiles up
  set
    profile_type = p_role_key,
    updated_at = now()
  where up.user_id = v_user_id
    and up.profile_type is distinct from p_role_key;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (v_user_id, v_role_id, auth.uid())
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now();

  perform public.write_admin_audit_log(
    'catalog.member_role_set',
    v_user_id,
    'catalog_item',
    p_item_id,
    null,
    jsonb_build_object('role_key', p_role_key)
  );
end;
$$;

create or replace function public.set_current_member_catalog_role(
  p_role_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select ci.id
  into v_item_id
  from public.catalog_items ci
  where ci.linked_user_id = auth.uid()
    and ci.item_type = 'member'
  order by ci.created_at asc
  limit 1;

  if v_item_id is null then
    raise exception 'member catalog item not found' using errcode = 'P0002';
  end if;

  select r.id
  into v_role_id
  from public.roles r
  where r.key = p_role_key
    and r.is_active = true
  limit 1;

  if v_role_id is null then
    raise exception 'invalid role key' using errcode = '22023';
  end if;

  update public.catalog_items ci
  set
    platform_role_key = p_role_key,
    attributes = coalesce(ci.attributes, '{}'::jsonb) || jsonb_build_object('platform_role_key', p_role_key),
    updated_at = now()
  where ci.id = v_item_id;

  update public.user_profiles up
  set
    profile_type = p_role_key,
    updated_at = now()
  where up.user_id = auth.uid()
    and up.profile_type is distinct from p_role_key;

  insert into public.user_role_assignments (user_id, role_id, updated_by)
  values (auth.uid(), v_role_id, auth.uid())
  on conflict (user_id) do update
  set
    role_id = excluded.role_id,
    updated_by = excluded.updated_by,
    updated_at = now();
end;
$$;

revoke all on function public.get_current_member_catalog_profile() from public;
revoke all on function public.list_member_catalog_names(uuid[]) from public;
revoke all on function public.admin_list_member_catalog_profiles(text, text, timestamptz, timestamptz, text) from public;
revoke all on function public.admin_set_member_catalog_role(uuid, text) from public;
revoke all on function public.set_current_member_catalog_role(text) from public;

grant execute on function public.get_current_member_catalog_profile() to authenticated;
grant execute on function public.list_member_catalog_names(uuid[]) to anon, authenticated;
grant execute on function public.admin_list_member_catalog_profiles(text, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.admin_set_member_catalog_role(uuid, text) to authenticated;
grant execute on function public.set_current_member_catalog_role(text) to authenticated;

commit;
