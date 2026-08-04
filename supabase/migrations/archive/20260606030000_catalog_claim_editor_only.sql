begin;

create or replace function public.review_catalog_claim_request(
  target_claim_request_id uuid,
  decision text,
  review_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_claim public.catalog_claim_requests%rowtype;
  v_before_item public.catalog_items%rowtype;
begin
  if v_actor_id is null or not public.is_moderator(v_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if decision not in ('approved', 'rejected', 'cancelled') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select *
  into v_claim
  from public.catalog_claim_requests
  where id = target_claim_request_id
  for update;

  if v_claim.id is null then
    raise exception 'claim request not found' using errcode = 'P0002';
  end if;

  if v_claim.status <> 'pending' then
    raise exception 'claim request already reviewed' using errcode = '22023';
  end if;

  select *
  into v_before_item
  from public.catalog_items
  where id = v_claim.item_id
  for update;

  update public.catalog_claim_requests
  set
    status = decision,
    note = coalesce(review_note, note),
    reviewed_by_user_id = v_actor_id,
    reviewed_at = now(),
    updated_at = now()
  where id = v_claim.id;

  if decision = 'approved' then
    insert into public.catalog_item_memberships (
      item_id,
      user_id,
      role,
      status
    )
    values (
      v_claim.item_id,
      v_claim.requested_by_user_id,
      'editor',
      'active'
    )
    on conflict (item_id, user_id, role) do update
    set
      status = 'active',
      updated_at = now();

    update public.catalog_items
    set
      verification_status = case
        when verification_status = 'unverified' then 'claimed'
        else verification_status
      end,
      updated_at = now()
    where id = v_claim.item_id;
  end if;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    before_data,
    after_data
  )
  values (
    v_claim.item_id,
    v_actor_id,
    'catalog_claim_request_reviewed',
    jsonb_build_object(
      'claim_request_id', v_claim.id,
      'decision', decision,
      'review_note', review_note,
      'granted_membership_role', case when decision = 'approved' then 'editor' else null end
    ),
    to_jsonb(v_before_item),
    (
      select to_jsonb(ci)
      from public.catalog_items ci
      where ci.id = v_claim.item_id
    )
  );

  return jsonb_build_object(
    'claim_request_id', v_claim.id,
    'item_id', v_claim.item_id,
    'decision', decision,
    'granted_membership_role', case when decision = 'approved' then 'editor' else null end,
    'reviewed_by_user_id', v_actor_id
  );
end;
$$;

create or replace function public.admin_approve_catalog_claim(
  p_claim_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.review_catalog_claim_request(p_claim_id, 'approved', null);
$$;

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

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'target user not found' using errcode = 'P0002';
  end if;

  insert into public.catalog_item_memberships (item_id, user_id, role, status)
  values (p_item_id, p_target_user_id, 'editor', 'active')
  on conflict (item_id, user_id, role) do update
  set status = 'active',
      updated_at = now();
end;
$$;

create or replace function public.admin_revoke_catalog_editor(
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

  update public.catalog_item_memberships
  set status = 'revoked',
      updated_at = now()
  where item_id = p_item_id
    and user_id = p_target_user_id
    and role = 'editor';
end;
$$;

revoke all on function public.admin_approve_catalog_claim(uuid) from public;
revoke all on function public.admin_grant_catalog_editor(uuid, uuid) from public;
revoke all on function public.admin_revoke_catalog_editor(uuid, uuid) from public;

grant execute on function public.admin_approve_catalog_claim(uuid) to authenticated;
grant execute on function public.admin_grant_catalog_editor(uuid, uuid) to authenticated;
grant execute on function public.admin_revoke_catalog_editor(uuid, uuid) to authenticated;

commit;
