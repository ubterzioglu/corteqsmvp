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
    return;
  elsif v_invitation.revoked_at is not null then
    return query select 'revoked'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
    return;
  elsif v_invitation.redeemed_at is not null or v_invitation.use_count >= 1 then
    return query select 'used'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
    return;
  elsif v_invitation.expires_at <= now() then
    return query select 'expired'::text, v_invitation.id, null::text, null::text, null::text, null::text, v_invitation.expires_at;
    return;
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

revoke all on function public.resolve_vip_invitation(text) from public, anon, authenticated;
grant execute on function public.resolve_vip_invitation(text) to anon, authenticated;
