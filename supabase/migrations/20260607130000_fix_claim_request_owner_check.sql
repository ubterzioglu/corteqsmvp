begin;

create or replace function public.submit_catalog_claim_request(
  target_item_id uuid,
  claim_type text default 'ownership',
  evidence jsonb default '{}'::jsonb,
  note text default null
)
returns public.catalog_claim_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_claim public.catalog_claim_requests%rowtype;
begin
  if v_user_id is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if target_item_id is null then
    raise exception 'item_id is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.catalog_items ci
    where ci.id = target_item_id
  ) then
    raise exception 'catalog item not found' using errcode = 'P0002';
  end if;

  -- Only block if the user has an explicit owner membership row.
  -- Moderators can still submit claims on behalf of others (they don't "own" items just by being moderators).
  if exists (
    select 1
    from public.catalog_item_memberships
    where item_id = target_item_id
      and user_id = v_user_id
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'item already owned by current user' using errcode = '23505';
  end if;

  insert into public.catalog_claim_requests (
    item_id,
    requested_by_user_id,
    claim_type,
    evidence,
    note,
    status
  )
  values (
    target_item_id,
    v_user_id,
    coalesce(nullif(btrim(claim_type), ''), 'ownership'),
    coalesce(evidence, '{}'::jsonb),
    note,
    'pending'
  )
  returning * into v_claim;

  insert into public.catalog_audit_logs (
    item_id,
    actor_user_id,
    action,
    details,
    after_data
  )
  values (
    target_item_id,
    v_user_id,
    'catalog_claim_request_submitted',
    jsonb_build_object('claim_request_id', v_claim.id),
    to_jsonb(v_claim)
  );

  return v_claim;
end;
$$;

commit;
