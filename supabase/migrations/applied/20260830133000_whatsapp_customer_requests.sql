alter table public.whatsapp_webhook_events
add column wa_id_ciphertext text
check (wa_id_ciphertext is null or wa_id_ciphertext ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$');

create table public.whatsapp_customer_threads (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'whatsapp' check (channel = 'whatsapp'),
  wa_id_hash text not null unique check (wa_id_hash ~ '^[0-9a-f]{64}$'),
  recipient_ciphertext text not null check (recipient_ciphertext ~ '^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'),
  status text not null default 'new' check (status in ('new', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_inbound_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index whatsapp_customer_threads_queue_idx
on public.whatsapp_customer_threads (status, last_message_at desc);

create index whatsapp_customer_threads_assignee_idx
on public.whatsapp_customer_threads (assigned_to, status, last_message_at desc);

create table public.whatsapp_customer_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.whatsapp_customer_threads(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  provider_message_id text unique check (provider_message_id is null or char_length(provider_message_id) between 1 and 512),
  message_type text not null check (message_type in ('text', 'template', 'unsupported')),
  body text check (body is null or char_length(body) <= 4000),
  template_name text check (template_name is null or template_name ~ '^[a-z0-9_]{1,512}$'),
  template_language text check (template_language is null or template_language ~ '^[A-Za-z]{2,3}(?:_[A-Z]{2})?$'),
  delivery_status text not null check (delivery_status in ('received', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed')),
  error_code text check (error_code is null or char_length(error_code) <= 120),
  provider_timestamp text check (provider_timestamp is null or char_length(provider_timestamp) <= 40),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  constraint whatsapp_customer_message_direction_check check (
    (direction = 'inbound' and created_by is null and delivery_status in ('received', 'delivered', 'read'))
    or (direction = 'outbound' and created_by is not null and delivery_status <> 'received')
  ),
  constraint whatsapp_customer_message_template_check check (
    (message_type = 'template' and template_name is not null and template_language is not null)
    or (message_type <> 'template' and template_name is null and template_language is null)
  )
);

create index whatsapp_customer_messages_thread_idx
on public.whatsapp_customer_messages (thread_id, created_at);

create table public.whatsapp_message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (name ~ '^[a-z0-9_]{1,512}$'),
  language text not null check (language ~ '^[A-Za-z]{2,3}(?:_[A-Z]{2})?$'),
  category text not null default 'UTILITY' check (category in ('AUTHENTICATION', 'MARKETING', 'UTILITY')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'paused', 'rejected')),
  body_preview text check (body_preview is null or char_length(body_preview) <= 2000),
  parameter_count integer not null default 0 check (parameter_count between 0 and 20),
  meta_template_id text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, language),
  constraint whatsapp_template_approval_check check (
    approval_status <> 'approved' or (meta_template_id is not null and verified_at is not null)
  )
);

create table public.whatsapp_admin_reply_rate_limits (
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (admin_user_id, window_started_at)
);

create trigger whatsapp_customer_threads_set_updated_at
before update on public.whatsapp_customer_threads
for each row execute function public.set_updated_at();

create trigger whatsapp_message_templates_set_updated_at
before update on public.whatsapp_message_templates
for each row execute function public.set_updated_at();

alter table public.whatsapp_customer_threads enable row level security;
alter table public.whatsapp_customer_messages enable row level security;
alter table public.whatsapp_message_templates enable row level security;
alter table public.whatsapp_admin_reply_rate_limits enable row level security;

create policy whatsapp_message_templates_admin_all
on public.whatsapp_message_templates for all to authenticated
using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

revoke all on public.whatsapp_customer_threads from public, anon, authenticated;
revoke all on public.whatsapp_customer_messages from public, anon, authenticated;
revoke all on public.whatsapp_message_templates from public, anon, authenticated;
revoke all on public.whatsapp_admin_reply_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.whatsapp_message_templates to authenticated;

-- Forward-only signature extension: encrypted recipient is stored for controlled replies.
drop function public.ingest_whatsapp_webhook_event(text, text, text, text, text, text, text, text, text);

create or replace function public.ingest_whatsapp_webhook_event(
  p_provider_event_key text,
  p_provider_message_id text,
  p_event_type text,
  p_wa_id_hash text default null,
  p_wa_id_ciphertext text default null,
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
  v_thread_id uuid;
  v_thread_expiry timestamptz := now() + interval '90 days';
begin
  insert into public.whatsapp_webhook_events (
    provider_event_key, provider_message_id, event_type, wa_id_hash, wa_id_ciphertext,
    phone_number_id_hash, message_type, message_text, message_status, provider_timestamp
  ) values (
    left(p_provider_event_key, 700), left(p_provider_message_id, 512), p_event_type,
    p_wa_id_hash, p_wa_id_ciphertext, p_phone_number_id_hash,
    nullif(left(coalesce(p_message_type, ''), 80), ''),
    nullif(left(coalesce(p_message_text, ''), 4000), ''),
    nullif(left(coalesce(p_message_status, ''), 80), ''),
    nullif(left(coalesce(p_provider_timestamp, ''), 40), '')
  )
  on conflict (provider_event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id from public.whatsapp_webhook_events
    where provider_event_key = left(p_provider_event_key, 700);
    insert into public.whatsapp_webhook_audit_logs (webhook_event_id, action, outcome)
    values (v_event_id, 'duplicate_ignored', 'ignored');
    return false;
  end if;

  insert into public.whatsapp_webhook_audit_logs (webhook_event_id, action, outcome, details)
  values (
    v_event_id, 'event_received', 'accepted',
    jsonb_build_object('event_type', p_event_type, 'message_type', p_message_type)
  );

  if p_event_type = 'inbound_message' then
    if p_wa_id_hash is null or p_wa_id_ciphertext is null then
      raise exception 'recipient_identity_required' using errcode = '22023';
    end if;

    insert into public.whatsapp_customer_threads (
      wa_id_hash, recipient_ciphertext, status, last_inbound_at, last_message_at, expires_at
    ) values (
      p_wa_id_hash, p_wa_id_ciphertext, 'new', now(), now(), v_thread_expiry
    )
    on conflict (wa_id_hash) do update set
      recipient_ciphertext = excluded.recipient_ciphertext,
      status = case when public.whatsapp_customer_threads.status = 'closed' then 'new' else public.whatsapp_customer_threads.status end,
      last_inbound_at = now(),
      last_message_at = now(),
      expires_at = v_thread_expiry
    returning id into v_thread_id;

    insert into public.whatsapp_customer_messages (
      thread_id, direction, provider_message_id, message_type, body,
      delivery_status, provider_timestamp, expires_at
    ) values (
      v_thread_id, 'inbound', left(p_provider_message_id, 512),
      case when p_message_type in ('text', 'button', 'interactive') then 'text' else 'unsupported' end,
      nullif(left(coalesce(p_message_text, ''), 4000), ''), 'received',
      nullif(left(coalesce(p_provider_timestamp, ''), 40), ''), v_thread_expiry
    ) on conflict (provider_message_id) do nothing;
  elsif p_event_type = 'message_status' then
    update public.whatsapp_customer_messages
    set delivery_status = case
      when p_message_status in ('sent', 'delivered', 'read', 'failed') then p_message_status
      else delivery_status
    end
    where provider_message_id = p_provider_message_id
      and direction = 'outbound';
  end if;

  return true;
end;
$$;

create or replace function public.admin_update_whatsapp_customer_thread(
  p_thread_id uuid,
  p_status text,
  p_assigned_to uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.whatsapp_customer_threads%rowtype;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  if p_status not in ('new', 'in_progress', 'waiting_customer', 'resolved', 'closed') then
    raise exception 'invalid_thread_status' using errcode = '22023';
  end if;
  if p_assigned_to is not null and not public.is_admin(p_assigned_to) then
    raise exception 'assignee_must_be_admin' using errcode = '22023';
  end if;

  select * into v_before from public.whatsapp_customer_threads where id = p_thread_id for update;
  if not found then raise exception 'thread_not_found' using errcode = 'P0002'; end if;

  update public.whatsapp_customer_threads
  set status = p_status, assigned_to = p_assigned_to
  where id = p_thread_id;

  perform public.write_admin_audit_log(
    p_action => 'whatsapp.thread_updated',
    p_target_entity_type => 'whatsapp_customer_thread',
    p_target_entity_id => p_thread_id,
    p_before_value => jsonb_build_object('status', v_before.status, 'assigned_to', v_before.assigned_to),
    p_after_value => jsonb_build_object('status', p_status, 'assigned_to', p_assigned_to)
  );
end;
$$;

create or replace function public.admin_list_whatsapp_customer_threads()
returns table (
  id uuid,
  status text,
  assigned_to uuid,
  last_inbound_at timestamptz,
  last_message_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  latest_message_preview text,
  latest_direction text,
  message_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  return query
  select
    t.id, t.status, t.assigned_to, t.last_inbound_at, t.last_message_at,
    t.expires_at, t.created_at,
    left(coalesce(latest.body, case when latest.message_type = 'unsupported' then '[Desteklenmeyen mesaj türü]' else null end), 240),
    latest.direction,
    (select count(*) from public.whatsapp_customer_messages counted where counted.thread_id = t.id)
  from public.whatsapp_customer_threads t
  left join lateral (
    select m.body, m.message_type, m.direction
    from public.whatsapp_customer_messages m
    where m.thread_id = t.id
    order by m.created_at desc
    limit 1
  ) latest on true
  order by
    case t.status when 'new' then 0 when 'in_progress' then 1 when 'waiting_customer' then 2 when 'resolved' then 3 else 4 end,
    t.last_message_at desc;
end;
$$;

create or replace function public.admin_list_whatsapp_customer_messages(p_thread_id uuid)
returns table (
  id uuid,
  direction text,
  message_type text,
  body text,
  template_name text,
  template_language text,
  delivery_status text,
  error_code text,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  return query
  select
    m.id, m.direction, m.message_type, m.body, m.template_name,
    m.template_language, m.delivery_status, m.error_code, m.created_by, m.created_at
  from public.whatsapp_customer_messages m
  where m.thread_id = p_thread_id
  order by m.created_at;
end;
$$;

create or replace function public.admin_prepare_whatsapp_reply(
  p_request_id uuid,
  p_thread_id uuid,
  p_body text default null,
  p_template_name text default null,
  p_template_language text default null
)
returns table (
  message_id uuid,
  should_send boolean,
  recipient_ciphertext text,
  send_mode text,
  message_body text,
  template_name text,
  template_language text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_thread public.whatsapp_customer_threads%rowtype;
  v_existing public.whatsapp_customer_messages%rowtype;
  v_window timestamptz := date_trunc('minute', clock_timestamp());
  v_count integer;
  v_mode text;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;

  select * into v_existing from public.whatsapp_customer_messages where id = p_request_id;
  if found then
    if v_existing.created_by <> v_actor or v_existing.thread_id <> p_thread_id then
      raise exception 'request_id_conflict' using errcode = '23505';
    end if;
    return query select
      v_existing.id, false, null::text,
      v_existing.message_type, v_existing.body, v_existing.template_name, v_existing.template_language;
    return;
  end if;

  select * into v_thread from public.whatsapp_customer_threads where id = p_thread_id for update;
  if not found then raise exception 'thread_not_found' using errcode = 'P0002'; end if;
  if v_thread.status = 'closed' then raise exception 'thread_closed' using errcode = '23514'; end if;
  if v_thread.expires_at <= now() then raise exception 'recipient_data_expired' using errcode = '23514'; end if;

  if nullif(btrim(coalesce(p_template_name, '')), '') is not null then
    if not exists (
      select 1 from public.whatsapp_message_templates
      where name = p_template_name and language = p_template_language
        and approval_status = 'approved' and verified_at is not null and parameter_count = 0
    ) then
      raise exception 'approved_template_required' using errcode = '23514';
    end if;
    v_mode := 'template';
  else
    if nullif(btrim(coalesce(p_body, '')), '') is null then
      raise exception 'reply_body_required' using errcode = '22023';
    end if;
    if v_thread.last_inbound_at < now() - interval '24 hours' then
      raise exception 'template_required_outside_service_window' using errcode = '23514';
    end if;
    v_mode := 'text';
  end if;

  delete from public.whatsapp_admin_reply_rate_limits
  where admin_user_id = v_actor and window_started_at < v_window - interval '1 hour';
  insert into public.whatsapp_admin_reply_rate_limits (admin_user_id, window_started_at, request_count)
  values (v_actor, v_window, 1)
  on conflict (admin_user_id, window_started_at)
  do update set request_count = public.whatsapp_admin_reply_rate_limits.request_count + 1
  returning request_count into v_count;
  if v_count > 30 then raise exception 'admin_reply_rate_limited' using errcode = 'P0001'; end if;

  insert into public.whatsapp_customer_messages (
    id, thread_id, direction, message_type, body, template_name,
    template_language, delivery_status, created_by
  ) values (
    p_request_id, p_thread_id, 'outbound', v_mode,
    case when v_mode = 'text' then left(btrim(p_body), 4000) else null end,
    case when v_mode = 'template' then p_template_name else null end,
    case when v_mode = 'template' then p_template_language else null end,
    'sending', v_actor
  );

  update public.whatsapp_customer_threads
  set status = 'waiting_customer', assigned_to = coalesce(assigned_to, v_actor), last_message_at = now()
  where id = p_thread_id;

  return query select
    p_request_id, true, v_thread.recipient_ciphertext, v_mode,
    case when v_mode = 'text' then left(btrim(p_body), 4000) else null end,
    case when v_mode = 'template' then p_template_name else null end,
    case when v_mode = 'template' then p_template_language else null end;
end;
$$;

create or replace function public.admin_finalize_whatsapp_reply(
  p_message_id uuid,
  p_success boolean,
  p_provider_message_id text default null,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_message public.whatsapp_customer_messages%rowtype;
begin
  if v_actor is null or not public.is_admin(v_actor) then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  select * into v_message from public.whatsapp_customer_messages
  where id = p_message_id and created_by = v_actor for update;
  if not found then raise exception 'reply_not_found' using errcode = 'P0002'; end if;

  update public.whatsapp_customer_messages set
    delivery_status = case when p_success then 'sent' else 'failed' end,
    provider_message_id = case when p_success then left(p_provider_message_id, 512) else null end,
    error_code = case when p_success then null else left(coalesce(p_error_code, 'provider_error'), 120) end
  where id = p_message_id;

  perform public.write_admin_audit_log(
    p_action => case when p_success then 'whatsapp.reply_sent' else 'whatsapp.reply_failed' end,
    p_target_entity_type => 'whatsapp_customer_message',
    p_target_entity_id => p_message_id,
    p_after_value => jsonb_build_object(
      'thread_id', v_message.thread_id,
      'message_type', v_message.message_type,
      'template_name', v_message.template_name,
      'error_code', case when p_success then null else left(coalesce(p_error_code, 'provider_error'), 120) end
    )
  );
end;
$$;

create or replace function public.purge_expired_whatsapp_webhook_data()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted_events integer;
  v_deleted_threads integer;
begin
  delete from public.whatsapp_customer_threads where expires_at <= now();
  get diagnostics v_deleted_threads = row_count;
  delete from public.whatsapp_webhook_events where expires_at <= now();
  get diagnostics v_deleted_events = row_count;
  delete from public.whatsapp_webhook_rate_limits where window_started_at < now() - interval '1 day';
  delete from public.whatsapp_admin_reply_rate_limits where window_started_at < now() - interval '1 day';
  insert into public.whatsapp_webhook_audit_logs (action, outcome, details)
  values (
    'expired_data_purged', 'completed',
    jsonb_build_object('deleted_events', v_deleted_events, 'deleted_threads', v_deleted_threads)
  );
  return v_deleted_events + v_deleted_threads;
end;
$$;

revoke all on function public.ingest_whatsapp_webhook_event(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_update_whatsapp_customer_thread(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_whatsapp_customer_threads() from public, anon, authenticated;
revoke all on function public.admin_list_whatsapp_customer_messages(uuid) from public, anon, authenticated;
revoke all on function public.admin_prepare_whatsapp_reply(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_finalize_whatsapp_reply(uuid, boolean, text, text) from public, anon, authenticated;

grant execute on function public.ingest_whatsapp_webhook_event(text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.admin_update_whatsapp_customer_thread(uuid, text, uuid) to authenticated;
grant execute on function public.admin_list_whatsapp_customer_threads() to authenticated;
grant execute on function public.admin_list_whatsapp_customer_messages(uuid) to authenticated;
grant execute on function public.admin_prepare_whatsapp_reply(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.admin_finalize_whatsapp_reply(uuid, boolean, text, text) to authenticated;

comment on column public.whatsapp_customer_threads.recipient_ciphertext is
  'AES-GCM ciphertext produced by the Edge Function with a key derived from WHATSAPP_APP_SECRET; never readable by the browser.';
