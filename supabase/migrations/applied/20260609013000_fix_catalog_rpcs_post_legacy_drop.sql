begin;

-- Fix catalog RPCs that still reference public.profiles (dropped in 20260609003000).
-- Replacement: join auth.users for email, user_profile_attributes for display name.

-- ─── admin_list_catalog_claims ────────────────────────────────────────────────
-- Was joining public.profiles for requester/reviewer names and emails.
-- Replaced with auth.users for email + user_profile_attributes for full_name.

create or replace function public.admin_list_catalog_claims(
  p_item_id uuid default null,
  p_status text default null
)
returns table (
  id uuid,
  item_id uuid,
  item_title text,
  requested_by_user_id uuid,
  requester_full_name text,
  requester_email text,
  claim_type text,
  note text,
  status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  reviewer_full_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ccr.id,
    ccr.item_id,
    ci.title as item_title,
    ccr.requested_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.attribute_catalog ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.requested_by_user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(req_email.email, 'corteqs-uye'), '@', 1)
    ) as requester_full_name,
    req_email.email as requester_email,
    ccr.claim_type,
    ccr.note,
    ccr.status,
    ccr.created_at,
    ccr.reviewed_at,
    ccr.reviewed_by_user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.attribute_catalog ac on ac.id = upa.attribute_id
       where upa.user_id = ccr.reviewed_by_user_id and ac.key = 'full_name' limit 1),
      'İsimsiz kullanıcı'
    ) as reviewer_full_name
  from public.catalog_claim_requests ccr
  join public.catalog_items ci on ci.id = ccr.item_id
  left join auth.users req_email on req_email.id = ccr.requested_by_user_id
  where (p_item_id is null or ccr.item_id = p_item_id)
    and (p_status is null or btrim(p_status) = '' or ccr.status = p_status)
  order by
    case when ccr.status = 'pending' then 0 else 1 end,
    ccr.created_at desc;
end;
$$;

-- ─── admin_search_profiles ────────────────────────────────────────────────────
-- Was selecting from public.profiles. Replaced with auth.users + user_profile_attributes.

create or replace function public.admin_search_profiles(
  p_query text,
  p_limit integer default 10
)
returns table (
  id uuid,
  full_name text,
  email text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_limit integer := greatest(least(coalesce(p_limit, 10), 25), 1);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    au.id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.attribute_catalog ac on ac.id = upa.attribute_id
       where upa.user_id = au.id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-uye'), '@', 1)
    ) as full_name,
    au.email
  from auth.users au
  where v_query is not null
    and (
      coalesce(au.email, '') ilike '%' || v_query || '%'
      or exists (
        select 1 from public.user_profile_attributes upa
        join public.attribute_catalog ac on ac.id = upa.attribute_id
        where upa.user_id = au.id
          and ac.key = 'full_name'
          and upa.value_text ilike '%' || v_query || '%'
      )
    )
  order by
    case
      when coalesce(au.email, '') ilike v_query || '%' then 0
      else 1
    end,
    au.updated_at desc
  limit v_limit;
end;
$$;

-- ─── admin_grant_catalog_editor ───────────────────────────────────────────────
-- Was checking public.profiles for target user existence.
-- Replaced with auth.users existence check.

create or replace function public.admin_grant_catalog_editor(
  p_item_id uuid,
  p_target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.catalog_items where id = p_item_id) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_target_user_id, 'editor', 'active')
  on conflict (item_id, user_id, role) do update
  set status = 'active',
      updated_at = now();
end;
$$;

-- ─── admin_list_catalog_item_access ───────────────────────────────────────────
-- Was joining public.profiles for full_name/email.
-- Replaced with auth.users + user_profile_attributes.

create or replace function public.admin_list_catalog_item_access(
  p_item_id uuid
)
returns table (
  user_id uuid,
  full_name text,
  email text,
  access_level text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    cim.user_id,
    coalesce(
      (select upa.value_text from public.user_profile_attributes upa
       join public.attribute_catalog ac on ac.id = upa.attribute_id
       where upa.user_id = cim.user_id and ac.key = 'full_name' limit 1),
      split_part(coalesce(au.email, 'corteqs-user'), '@', 1)
    ) as full_name,
    au.email,
    cim.role as access_level,
    cim.status,
    cim.created_at
  from public.catalog_item_memberships cim
  left join auth.users au on au.id = cim.user_id
  where public.is_moderator(auth.uid())
    and cim.item_id = p_item_id
  order by
    case when cim.role = 'owner' then 0 when cim.role = 'manager' then 1 when cim.role = 'editor' then 2 else 3 end,
    cim.created_at asc;
$$;

revoke all on function public.admin_list_catalog_claims(uuid, text) from public;
revoke all on function public.admin_search_profiles(text, integer) from public;
revoke all on function public.admin_grant_catalog_editor(uuid, uuid) from public;
revoke all on function public.admin_list_catalog_item_access(uuid) from public;

grant execute on function public.admin_list_catalog_claims(uuid, text) to authenticated;
grant execute on function public.admin_search_profiles(text, integer) to authenticated;
grant execute on function public.admin_grant_catalog_editor(uuid, uuid) to authenticated;
grant execute on function public.admin_list_catalog_item_access(uuid) to authenticated;

commit;
