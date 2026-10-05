-- W04 · WhatsApp bot foundation — migration
-- Adds bot automation infrastructure to WhatsApp customer messaging system.
-- 
-- Changes:
-- 1. whatsapp_customer_messages.is_automated (boolean, default false)
-- 2. whatsapp_customer_threads.bot_handed_over_at (timestamptz, nullable)
-- 3. whatsapp_bot_settings table (single-row configuration)
-- 4. bot_prepare_whatsapp_reply() — service_role version of admin_prepare_whatsapp_reply()
-- 5. bot_finalize_whatsapp_reply() — service_role version of admin_finalize_whatsapp_reply()
-- 6. ai_assistant_usage.function_name CHECK updated to include 'whatsapp-autoreply'
--
-- Security: Bot functions are service_role only, not accessible to anon/authenticated.
-- Admin functions remain unchanged (no regression).

begin;

-- 1. Add is_automated column to whatsapp_customer_messages
alter table public.whatsapp_customer_messages
add column if not exists is_automated boolean not null default false;

comment on column public.whatsapp_customer_messages.is_automated is
  'True if message was sent by the automated bot (W04+).';

-- Update direction check constraint to allow bot messages (is_automated=true, created_by=null)
alter table public.whatsapp_customer_messages
drop constraint if exists whatsapp_customer_message_direction_check;

alter table public.whatsapp_customer_messages
add constraint whatsapp_customer_message_direction_check check (
  (direction = 'inbound' and created_by is null and delivery_status in ('received', 'delivered', 'read'))
  or (direction = 'outbound' and (
    (created_by is not null and delivery_status <> 'received')  -- human admin
    or (is_automated = true and created_by is null and delivery_status <> 'received')  -- bot
  ))
);

-- 2. Add bot_handed_over_at column to whatsapp_customer_threads
alter table public.whatsapp_customer_threads
add column if not exists bot_handed_over_at timestamptz;

comment on column public.whatsapp_customer_threads.bot_handed_over_at is
  'When set, bot must not send further messages in this thread (W04+).';

-- 3. Create whatsapp_bot_settings table (single-row configuration)
create table if not exists public.whatsapp_bot_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  model text,
  max_replies_per_sender_per_day integer not null default 10 check (max_replies_per_sender_per_day > 0),
  handover_keywords text[] not null default array['insan', 'temsilci', 'yetkili'],
  fallback_message text not null default 'Üzgünüm, sorunuzu anlayamadım. Bir insan temsilci en kısa sürede size yardımcı olacaktır.',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- Insert initial row (enabled=false by default)
insert into public.whatsapp_bot_settings (id, enabled, model, fallback_message)
values (true, false, 'gemini-2.0-flash', 'Üzgünüm, sorunuzu anlayamadım. Bir insan temsilci en kısa sürede size yardımcı olacaktır.')
on conflict (id) do nothing;

alter table public.whatsapp_bot_settings enable row level security;

revoke all on table public.whatsapp_bot_settings from public, anon, authenticated;
grant select on table public.whatsapp_bot_settings to service_role;

comment on table public.whatsapp_bot_settings is
  'Single-row configuration for WhatsApp automated bot (W04+). enabled=false by default.';

-- 4. Create bot_prepare_whatsapp_reply() — service_role version
create or replace function public.bot_prepare_whatsapp_reply(
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
  v_thread public.whatsapp_customer_threads%rowtype;
  v_existing public.whatsapp_customer_messages%rowtype;
  v_mode text;
begin
  -- Idempotency: if request_id already exists, return existing record
  select * into v_existing from public.whatsapp_customer_messages where id = p_request_id;
  if found then
    if v_existing.thread_id <> p_thread_id then
      raise exception 'request_id_conflict' using errcode = '23505';
    end if;
    return query select
      v_existing.id, false, null::text,
      v_existing.message_type, v_existing.body, v_existing.template_name, v_existing.template_language;
    return;
  end if;

  -- Lock thread and validate
  select * into v_thread from public.whatsapp_customer_threads where id = p_thread_id for update;
  if not found then raise exception 'thread_not_found' using errcode = 'P0002'; end if;
  if v_thread.status = 'closed' then raise exception 'thread_closed' using errcode = '23514'; end if;
  if v_thread.expires_at <= now() then raise exception 'recipient_data_expired' using errcode = '23514'; end if;
  
  -- Bot must not write if handed over
  if v_thread.bot_handed_over_at is not null then
    raise exception 'bot_handed_over' using errcode = 'P0001';
  end if;

  -- Determine mode: template or text
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
    -- 24-hour service window check
    if v_thread.last_inbound_at < now() - interval '24 hours' then
      raise exception 'template_required_outside_service_window' using errcode = '23514';
    end if;
    v_mode := 'text';
  end if;

  -- Insert outbound message (is_automated=true, created_by=NULL)
  insert into public.whatsapp_customer_messages (
    id, thread_id, direction, message_type, body, template_name,
    template_language, delivery_status, is_automated, created_by
  ) values (
    p_request_id, p_thread_id, 'outbound', v_mode,
    case when v_mode = 'text' then left(btrim(p_body), 4000) else null end,
    case when v_mode = 'template' then p_template_name else null end,
    case when v_mode = 'template' then p_template_language else null end,
    'sending', true, null
  );

  -- Update thread status
  update public.whatsapp_customer_threads
  set status = 'waiting_customer', last_message_at = now()
  where id = p_thread_id;

  return query select
    p_request_id, true, v_thread.recipient_ciphertext, v_mode,
    case when v_mode = 'text' then left(btrim(p_body), 4000) else null end,
    case when v_mode = 'template' then p_template_name else null end,
    case when v_mode = 'template' then p_template_language else null end;
end;
$$;

-- 5. Create bot_finalize_whatsapp_reply() — service_role version
create or replace function public.bot_finalize_whatsapp_reply(
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
  v_message public.whatsapp_customer_messages%rowtype;
begin
  -- Validate provider_message_id format on success
  if p_success and (p_provider_message_id is null or p_provider_message_id !~ '^wamid\.') then
    raise exception 'valid_provider_message_id_required' using errcode = '22023';
  end if;

  -- Find message (must be automated, no created_by check)
  select * into v_message from public.whatsapp_customer_messages
  where id = p_message_id and is_automated = true for update;
  if not found then raise exception 'reply_not_found' using errcode = 'P0002'; end if;

  -- Update message status
  update public.whatsapp_customer_messages set
    delivery_status = case when p_success then 'sent' else 'failed' end,
    provider_message_id = case when p_success then left(p_provider_message_id, 512) else null end,
    error_code = case when p_success then null else left(coalesce(p_error_code, 'provider_error'), 120) end
  where id = p_message_id;

  -- On failure, revert thread status
  if not p_success then
    update public.whatsapp_customer_threads
    set status = 'in_progress'
    where id = v_message.thread_id and status = 'waiting_customer';
  end if;
end;
$$;

-- Grant bot functions to service_role only
revoke all on function public.bot_prepare_whatsapp_reply(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.bot_finalize_whatsapp_reply(uuid, boolean, text, text) from public, anon, authenticated;

grant execute on function public.bot_prepare_whatsapp_reply(uuid, uuid, text, text, text) to service_role;
grant execute on function public.bot_finalize_whatsapp_reply(uuid, boolean, text, text) to service_role;

-- 6. Update ai_assistant_usage.function_name CHECK constraint
alter table public.ai_assistant_usage
drop constraint if exists ai_assistant_usage_function_name_check;

alter table public.ai_assistant_usage
add constraint ai_assistant_usage_function_name_check
check (function_name in ('site-assistant', 'relocation-assistant', 'whatsapp-autoreply'));

commit;
