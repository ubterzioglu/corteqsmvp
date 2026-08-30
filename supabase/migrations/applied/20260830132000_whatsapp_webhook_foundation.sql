create table public.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_key text not null unique check (char_length(provider_event_key) between 10 and 700),
  provider_message_id text not null check (char_length(provider_message_id) between 1 and 512),
  event_type text not null check (event_type in ('inbound_message', 'message_status')),
  wa_id_hash text check (wa_id_hash is null or wa_id_hash ~ '^[0-9a-f]{64}$'),
  phone_number_id_hash text check (phone_number_id_hash is null or phone_number_id_hash ~ '^[0-9a-f]{64}$'),
  message_type text check (message_type is null or char_length(message_type) <= 80),
  message_text text check (message_text is null or char_length(message_text) <= 4000),
  message_status text check (message_status is null or char_length(message_status) <= 80),
  provider_timestamp text check (provider_timestamp is null or char_length(provider_timestamp) <= 40),
  received_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  processed_at timestamptz,
  constraint whatsapp_webhook_event_shape check (
    (event_type = 'inbound_message' and message_status is null)
    or (event_type = 'message_status' and message_text is null)
  )
);

create index whatsapp_webhook_events_received_idx
on public.whatsapp_webhook_events (received_at desc);

create index whatsapp_webhook_events_expiry_idx
on public.whatsapp_webhook_events (expires_at);

create index whatsapp_webhook_events_wa_id_idx
on public.whatsapp_webhook_events (wa_id_hash, received_at desc)
where wa_id_hash is not null;

create table public.whatsapp_webhook_audit_logs (
  id bigint generated always as identity primary key,
  webhook_event_id uuid references public.whatsapp_webhook_events(id) on delete set null,
  action text not null check (action in ('event_received', 'duplicate_ignored', 'expired_data_purged')),
  outcome text not null check (outcome in ('accepted', 'ignored', 'completed')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create index whatsapp_webhook_audit_logs_created_idx
on public.whatsapp_webhook_audit_logs (created_at desc);

create table public.whatsapp_webhook_rate_limits (
  requester_hash text not null check (requester_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (requester_hash, window_started_at)
);

alter table public.whatsapp_webhook_events enable row level security;
alter table public.whatsapp_webhook_audit_logs enable row level security;
alter table public.whatsapp_webhook_rate_limits enable row level security;

create policy whatsapp_webhook_events_admin_read
on public.whatsapp_webhook_events for select to authenticated
using (public.is_admin(auth.uid()));

create policy whatsapp_webhook_audit_logs_admin_read
on public.whatsapp_webhook_audit_logs for select to authenticated
using (public.is_admin(auth.uid()));

revoke all on public.whatsapp_webhook_events from public, anon, authenticated;
revoke all on public.whatsapp_webhook_audit_logs from public, anon, authenticated;
revoke all on public.whatsapp_webhook_rate_limits from public, anon, authenticated;
grant select on public.whatsapp_webhook_events to authenticated;
grant select on public.whatsapp_webhook_audit_logs to authenticated;

create or replace function public.claim_whatsapp_webhook_rate_limit(
  p_requester_hash text,
  p_max_requests integer default 120
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window_started_at timestamptz := date_trunc('minute', clock_timestamp());
  v_request_count integer;
begin
  if p_requester_hash is null or p_requester_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_requester_hash' using errcode = '22023';
  end if;
  if p_max_requests is null or p_max_requests < 1 or p_max_requests > 1000 then
    raise exception 'invalid_rate_limit' using errcode = '22023';
  end if;

  delete from public.whatsapp_webhook_rate_limits
  where requester_hash = p_requester_hash
    and window_started_at < v_window_started_at - interval '1 hour';

  insert into public.whatsapp_webhook_rate_limits (
    requester_hash,
    window_started_at,
    request_count
  ) values (
    p_requester_hash,
    v_window_started_at,
    1
  )
  on conflict (requester_hash, window_started_at)
  do update set request_count = public.whatsapp_webhook_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return v_request_count <= p_max_requests;
end;
$$;

create or replace function public.ingest_whatsapp_webhook_event(
  p_provider_event_key text,
  p_provider_message_id text,
  p_event_type text,
  p_wa_id_hash text default null,
  p_phone_number_id_hash text default null,
  p_message_type text default null,
  p_message_text text default null,
  p_message_status text default null,
  p_provider_timestamp text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
begin
  insert into public.whatsapp_webhook_events (
    provider_event_key,
    provider_message_id,
    event_type,
    wa_id_hash,
    phone_number_id_hash,
    message_type,
    message_text,
    message_status,
    provider_timestamp
  ) values (
    left(p_provider_event_key, 700),
    left(p_provider_message_id, 512),
    p_event_type,
    p_wa_id_hash,
    p_phone_number_id_hash,
    nullif(left(coalesce(p_message_type, ''), 80), ''),
    nullif(left(coalesce(p_message_text, ''), 4000), ''),
    nullif(left(coalesce(p_message_status, ''), 80), ''),
    nullif(left(coalesce(p_provider_timestamp, ''), 40), '')
  )
  on conflict (provider_event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id
    from public.whatsapp_webhook_events
    where provider_event_key = left(p_provider_event_key, 700);

    insert into public.whatsapp_webhook_audit_logs (webhook_event_id, action, outcome)
    values (v_event_id, 'duplicate_ignored', 'ignored');
    return false;
  end if;

  insert into public.whatsapp_webhook_audit_logs (
    webhook_event_id,
    action,
    outcome,
    details
  ) values (
    v_event_id,
    'event_received',
    'accepted',
    jsonb_build_object('event_type', p_event_type, 'message_type', p_message_type)
  );
  return true;
end;
$$;

create or replace function public.purge_expired_whatsapp_webhook_data()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.whatsapp_webhook_events where expires_at <= now();
  get diagnostics v_deleted = row_count;

  delete from public.whatsapp_webhook_rate_limits
  where window_started_at < now() - interval '1 day';

  insert into public.whatsapp_webhook_audit_logs (action, outcome, details)
  values ('expired_data_purged', 'completed', jsonb_build_object('deleted_events', v_deleted));
  return v_deleted;
end;
$$;

revoke all on function public.claim_whatsapp_webhook_rate_limit(text, integer) from public, anon, authenticated;
revoke all on function public.ingest_whatsapp_webhook_event(text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.purge_expired_whatsapp_webhook_data() from public, anon, authenticated;

grant execute on function public.claim_whatsapp_webhook_rate_limit(text, integer) to service_role;
grant execute on function public.ingest_whatsapp_webhook_event(text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.purge_expired_whatsapp_webhook_data() to service_role;

-- expires_at tek basina saklama siniri degildir; pg_cron bulunan ortamlarda veri
-- her gece fiziksel olarak silinir. Eklenti yoksa ops ekibi ayni RPC'yi zamanlar.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'whatsapp-webhook-retention',
      '17 3 * * *',
      'select public.purge_expired_whatsapp_webhook_data()'
    );
    raise notice 'pg_cron bulundu: WhatsApp 90 gun saklama temizligi zamanlandi.';
  else
    raise notice 'pg_cron yok: purge_expired_whatsapp_webhook_data() dis scheduler ile cagrilmali.';
  end if;
exception when others then
  raise notice 'WhatsApp saklama cron zamanlamasi atlandi: %', sqlerrm;
end $$;

comment on table public.whatsapp_webhook_events is
  'Allowlisted Meta WhatsApp webhook data. Phone identifiers are keyed hashes, raw payloads are discarded, and message data expires after 90 days.';
