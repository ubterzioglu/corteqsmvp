create extension if not exists pgcrypto with schema extensions;

create table public.vip_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invitation_type text not null default 'founding_vip',
  title text not null default 'CorteQS VIP Daveti',
  recipient_name text,
  recipient_email text,
  message text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoke_reason text,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  use_count integer not null default 0 check (use_count between 0 and 1),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vip_invitations_terminal_state_check check (
    not (revoked_at is not null and redeemed_at is not null)
  )
);

create index vip_invitations_created_at_idx on public.vip_invitations (created_at desc);
create index vip_invitations_expires_at_idx on public.vip_invitations (expires_at)
  where revoked_at is null and redeemed_at is null;

create trigger vip_invitations_set_updated_at
before update on public.vip_invitations
for each row execute function public.set_updated_at();

alter table public.vip_invitations enable row level security;

create policy vip_invitations_admin_all
on public.vip_invitations
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Resolve rate limiting stores only hashes; no raw IP, user-agent, or token is persisted.
create table public.vip_invitation_resolve_attempts (
  id bigint generated always as identity primary key,
  requester_hash text not null check (requester_hash ~ '^[0-9a-f]{64}$'),
  candidate_hash text not null check (candidate_hash ~ '^[0-9a-f]{64}$'),
  attempted_at timestamptz not null default now()
);

create index vip_invitation_resolve_attempts_rate_idx
on public.vip_invitation_resolve_attempts (requester_hash, attempted_at desc);

alter table public.vip_invitation_resolve_attempts enable row level security;

revoke all on public.vip_invitations from anon, authenticated;
revoke all on public.vip_invitation_resolve_attempts from anon, authenticated;
grant select, insert, update, delete on public.vip_invitations to authenticated;

create or replace function public.admin_create_vip_invitation(
  p_recipient_name text default null,
  p_recipient_email text default null,
  p_title text default 'CorteQS VIP Daveti',
  p_message text default null,
  p_invitation_type text default 'founding_vip',
  p_valid_days integer default 30,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  invitation_id uuid,
  token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_token text;
  v_invitation_id uuid;
  v_expires_at timestamptz;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  if p_valid_days is null or p_valid_days < 1 or p_valid_days > 365 then
    raise exception 'valid_days_out_of_range' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception 'title_required' using errcode = '22023';
  end if;
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'metadata_must_be_object' using errcode = '22023';
  end if;

  v_token := 'vip_' || translate(encode(gen_random_bytes(32), 'base64'), E'+/\n=', '-_');
  v_expires_at := now() + make_interval(days => p_valid_days);

  insert into public.vip_invitations (
    token_hash,
    invitation_type,
    title,
    recipient_name,
    recipient_email,
    message,
    metadata,
    expires_at,
    created_by
  ) values (
    encode(digest(v_token, 'sha256'), 'hex'),
    left(coalesce(nullif(btrim(p_invitation_type), ''), 'founding_vip'), 80),
    left(btrim(p_title), 160),
    nullif(left(btrim(coalesce(p_recipient_name, '')), 160), ''),
    nullif(left(lower(btrim(coalesce(p_recipient_email, ''))), 254), ''),
    nullif(left(btrim(coalesce(p_message, '')), 2000), ''),
    p_metadata,
    v_expires_at,
    v_actor
  )
  returning id into v_invitation_id;

  perform public.write_admin_audit_log(
    p_action => 'vip.invitation_created',
    p_target_entity_type => 'vip_invitation',
    p_target_entity_id => v_invitation_id,
    p_after_value => jsonb_build_object(
      'invitation_type', p_invitation_type,
      'expires_at', v_expires_at,
      'recipient_email_present', nullif(btrim(coalesce(p_recipient_email, '')), '') is not null
    )
  );

  return query select v_invitation_id, v_token, v_expires_at;
end;
$$;

create or replace function public.resolve_vip_invitation(p_token text)
returns table (
  status text,
  invitation_id uuid,
  invitation_type text,
  title text,
  recipient_name text,
  message text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_candidate_hash text;
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_requester_hash text;
  v_invitation public.vip_invitations%rowtype;
begin
  v_requester_hash := encode(digest(
    coalesce(v_headers ->> 'x-forwarded-for', '') || '|' || coalesce(v_headers ->> 'user-agent', 'unknown'),
    'sha256'
  ), 'hex');
  v_candidate_hash := encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');

  delete from public.vip_invitation_resolve_attempts
  where requester_hash = v_requester_hash
    and attempted_at < now() - interval '24 hours';

  if (
    select count(*)
    from public.vip_invitation_resolve_attempts
    where requester_hash = v_requester_hash
      and attempted_at >= now() - interval '5 minutes'
  ) >= 30 then
    return query select 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  insert into public.vip_invitation_resolve_attempts (requester_hash, candidate_hash)
  values (v_requester_hash, v_candidate_hash);

  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return query select 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  select * into v_invitation
  from public.vip_invitations
  where token_hash = v_candidate_hash;

  if not found then
    return query select 'invalid'::text, null::uuid, null::text, null::text, null::text, null::text, null::timestamptz;
  elsif v_invitation.revoked_at is not null then
    return query select 'revoked'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
  elsif v_invitation.redeemed_at is not null or v_invitation.use_count >= 1 then
    return query select 'used'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
  elsif v_invitation.expires_at <= now() then
    return query select 'expired'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
  end if;

  return query select
    'valid'::text,
    v_invitation.id,
    v_invitation.invitation_type,
    v_invitation.title,
    v_invitation.recipient_name,
    v_invitation.message,
    v_invitation.expires_at;
end;
$$;

create or replace function public.redeem_vip_invitation(p_token text)
returns table (status text, invitation_id uuid)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_candidate_hash text;
  v_invitation public.vip_invitations%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  v_candidate_hash := encode(digest(p_token, 'sha256'), 'hex');
  select * into v_invitation
  from public.vip_invitations
  where token_hash = v_candidate_hash
  for update;

  if not found then
    return query select 'invalid'::text, null::uuid;
    return;
  elsif v_invitation.revoked_at is not null then
    return query select 'revoked'::text, v_invitation.id;
    return;
  elsif v_invitation.redeemed_at is not null or v_invitation.use_count >= 1 then
    return query select 'used'::text, v_invitation.id;
    return;
  elsif v_invitation.expires_at <= now() then
    return query select 'expired'::text, v_invitation.id;
    return;
  end if;

  update public.vip_invitations
  set redeemed_at = now(), redeemed_by = v_actor, use_count = 1
  where id = v_invitation.id;

  perform public.write_admin_audit_log(
    p_action => 'vip.invitation_redeemed',
    p_target_user_id => v_actor,
    p_target_entity_type => 'vip_invitation',
    p_target_entity_id => v_invitation.id,
    p_after_value => jsonb_build_object('redeemed_at', now())
  );

  return query select 'redeemed'::text, v_invitation.id;
end;
$$;

create or replace function public.admin_revoke_vip_invitation(
  p_invitation_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_invitation public.vip_invitations%rowtype;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.vip_invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0002';
  end if;
  if v_invitation.redeemed_at is not null then
    raise exception 'invitation_already_redeemed' using errcode = '23514';
  end if;

  update public.vip_invitations
  set
    revoked_at = coalesce(revoked_at, now()),
    revoked_by = coalesce(revoked_by, v_actor),
    revoke_reason = coalesce(revoke_reason, nullif(left(btrim(coalesce(p_reason, '')), 500), ''))
  where id = p_invitation_id;

  perform public.write_admin_audit_log(
    p_action => 'vip.invitation_revoked',
    p_target_entity_type => 'vip_invitation',
    p_target_entity_id => p_invitation_id,
    p_after_value => jsonb_build_object('reason_present', nullif(btrim(coalesce(p_reason, '')), '') is not null)
  );
end;
$$;

revoke all on function public.admin_create_vip_invitation(text, text, text, text, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.resolve_vip_invitation(text) from public, anon, authenticated;
revoke all on function public.redeem_vip_invitation(text) from public, anon, authenticated;
revoke all on function public.admin_revoke_vip_invitation(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_create_vip_invitation(text, text, text, text, text, integer, jsonb) to authenticated;
grant execute on function public.resolve_vip_invitation(text) to anon, authenticated;
grant execute on function public.redeem_vip_invitation(text) to authenticated;
grant execute on function public.admin_revoke_vip_invitation(uuid, text) to authenticated;

comment on table public.vip_invitations is
  'Single-use VIP invitations. Only SHA-256 token hashes are stored; raw tokens are returned once by the admin create RPC.';
