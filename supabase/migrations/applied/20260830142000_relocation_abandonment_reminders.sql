-- C7: Yarım kalan taşınma aracı oturumları için güvenli, varsayılan kapalı hatırlatma temeli.

alter table public.relocation_tool_sessions
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists reminder_status text not null default 'not_due',
  add column if not exists reminder_queued_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_status_reason text;

alter table public.relocation_tool_sessions
  drop constraint if exists relocation_tool_sessions_reminder_status_check;

alter table public.relocation_tool_sessions
  add constraint relocation_tool_sessions_reminder_status_check
  check (reminder_status in ('not_due', 'queued', 'sent', 'failed', 'skipped'));

create index if not exists relocation_tool_sessions_abandonment_idx
  on public.relocation_tool_sessions (last_activity_at, started_at)
  where status = 'in_progress' and reminder_status = 'not_due';

comment on column public.relocation_tool_sessions.last_activity_at is
  'İlk cevap ve sonraki cevap değişikliklerinde güncellenir; yarım kalan araç tespiti yalnız bu alana bakar.';
comment on column public.relocation_tool_sessions.reminder_status is
  'Tek hatırlatma yaşam döngüsü: not_due, queued, sent, failed veya skipped.';

create table if not exists public.relocation_tool_reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  opted_out boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.relocation_tool_reminder_preferences enable row level security;
revoke all on table public.relocation_tool_reminder_preferences from public, anon, authenticated;
grant all on table public.relocation_tool_reminder_preferences to service_role;

create or replace function public.get_relocation_tool_reminder_preference()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_opted_out boolean;
begin
  if v_uid is null then
    raise exception 'rl_auth_required';
  end if;

  select p.opted_out into v_opted_out
  from public.relocation_tool_reminder_preferences p
  where p.user_id = v_uid;

  return jsonb_build_object(
    'opted_out', coalesce(v_opted_out, false),
    'global_enabled', public.notification_setting_enabled('email.relocation_tool_abandonment.enabled')
  );
end;
$$;

create or replace function public.set_relocation_tool_reminder_opt_out(p_opted_out boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'rl_auth_required';
  end if;

  insert into public.relocation_tool_reminder_preferences (user_id, opted_out, updated_at)
  values (v_uid, coalesce(p_opted_out, true), now())
  on conflict (user_id) do update
    set opted_out = excluded.opted_out, updated_at = now();

  if coalesce(p_opted_out, true) then
    update public.notification_email_outbox o
      set status = 'skipped',
          last_error = 'user_opted_out',
          sent_at = now()
    where o.event_type = 'relocation_tool_abandonment'
      and o.status = 'pending'
      and o.payload ->> 'user_id' = v_uid::text;
  end if;

  return public.get_relocation_tool_reminder_preference();
end;
$$;

revoke all on function public.get_relocation_tool_reminder_preference() from public, anon;
revoke all on function public.set_relocation_tool_reminder_opt_out(boolean) from public, anon;
grant execute on function public.get_relocation_tool_reminder_preference() to authenticated;
grant execute on function public.set_relocation_tool_reminder_opt_out(boolean) to authenticated;

-- Cevap kaydı, kullanıcının gerçek ilerleme aktivitesidir. Kuyrukta ama henüz
-- gönderilmemiş hatırlatma varsa devam edildiği anda iptal edilir.
create or replace function public.touch_relocation_tool_session_from_answer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid := new.session_id;
begin
  update public.notification_email_outbox o
    set status = 'skipped',
        last_error = 'session_resumed_before_send',
        sent_at = now()
  where o.event_type = 'relocation_tool_abandonment'
    and o.status = 'pending'
    and o.payload ->> 'session_id' = v_session_id::text;

  update public.relocation_tool_sessions s
    set last_activity_at = now(),
        reminder_status = case when s.reminder_status = 'queued' then 'skipped' else s.reminder_status end,
        reminder_status_reason = case
          when s.reminder_status = 'queued' then 'session_resumed_before_send'
          else s.reminder_status_reason
        end
  where s.id = v_session_id and s.status = 'in_progress';

  return new;
end;
$$;

drop trigger if exists relocation_tool_answer_touch_session on public.relocation_tool_answers;
create trigger relocation_tool_answer_touch_session
after insert or update of answer on public.relocation_tool_answers
for each row execute function public.touch_relocation_tool_session_from_answer();

revoke all on function public.touch_relocation_tool_session_from_answer() from public, anon, authenticated;

alter table public.notification_email_outbox
  drop constraint if exists notification_email_outbox_event_type_check;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type in (
    'new_member', 'admin_update', 'member_welcome', 'revision_request',
    'relocation_tool_report', 'relocation_tool_abandonment'
  ));

insert into public.notification_settings (key, value)
values ('email.relocation_tool_abandonment.enabled', 'false'::jsonb)
on conflict (key) do nothing;

-- Outbox nihai durumu session state'ine yansır; Edge Function'ın özel DB yetkisi gerekmez.
create or replace function public.sync_relocation_abandonment_delivery_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if new.event_type <> 'relocation_tool_abandonment' or new.status = old.status then
    return new;
  end if;

  v_session_id := nullif(new.payload ->> 'session_id', '')::uuid;
  if v_session_id is null then
    return new;
  end if;

  update public.relocation_tool_sessions
    set reminder_status = case new.status
          when 'sent' then 'sent'
          when 'failed' then 'failed'
          when 'skipped' then 'skipped'
          else reminder_status
        end,
        reminder_sent_at = case when new.status = 'sent' then coalesce(new.sent_at, now()) else reminder_sent_at end,
        reminder_status_reason = case
          when new.status in ('failed', 'skipped') then coalesce(new.last_error, new.status)
          else reminder_status_reason
        end
  where id = v_session_id;

  return new;
end;
$$;

drop trigger if exists notification_outbox_sync_relocation_abandonment
  on public.notification_email_outbox;
create trigger notification_outbox_sync_relocation_abandonment
after update of status on public.notification_email_outbox
for each row execute function public.sync_relocation_abandonment_delivery_state();

revoke all on function public.sync_relocation_abandonment_delivery_state() from public, anon, authenticated;

create or replace function public.enqueue_relocation_tool_abandonment_reminders(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_candidate record;
  v_queued integer := 0;
  v_inserted uuid;
begin
  if not public.notification_setting_enabled('email.relocation_tool_abandonment.enabled') then
    return 0;
  end if;

  for v_candidate in
    select
      s.id as session_id,
      s.user_id,
      s.tool_key,
      s.mode,
      s.started_at,
      s.last_activity_at,
      u.email,
      t.slug as tool_slug,
      t.title_tr as tool_title,
      (select count(*)::integer from public.relocation_tool_answers a
       where a.session_id = s.id) as answered_count,
      (select count(*)::integer from public.relocation_tool_questions q
       where q.tool_key = s.tool_key and q.is_active) as question_count
    from public.relocation_tool_sessions s
    join auth.users u on u.id = s.user_id
    join public.relocation_tools t on t.key = s.tool_key
    left join public.relocation_tool_reminder_preferences pref on pref.user_id = s.user_id
    where s.status = 'in_progress'
      and s.reminder_status = 'not_due'
      and s.last_activity_at <= now() - interval '24 hours'
      and s.expires_at > now()
      and u.email_confirmed_at is not null
      and u.email is not null
      and coalesce(pref.opted_out, false) = false
      and exists (select 1 from public.relocation_tool_answers ax where ax.session_id = s.id)
    order by s.last_activity_at
    for update of s skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  loop
    v_inserted := null;
    insert into public.notification_email_outbox (event_type, dedupe_key, payload)
    values (
      'relocation_tool_abandonment',
      'relocation_tool_abandonment:' || v_candidate.session_id::text,
      jsonb_build_object(
        'session_id', v_candidate.session_id::text,
        'user_id', v_candidate.user_id::text,
        'email', v_candidate.email,
        'tool_key', v_candidate.tool_key,
        'tool_slug', v_candidate.tool_slug,
        'tool_title', v_candidate.tool_title,
        'mode', v_candidate.mode,
        'answered_count', v_candidate.answered_count,
        'question_count', v_candidate.question_count,
        'last_activity_at', v_candidate.last_activity_at
      )
    )
    on conflict (dedupe_key) do nothing
    returning id into v_inserted;

    if v_inserted is not null then
      update public.relocation_tool_sessions
        set reminder_status = 'queued',
            reminder_queued_at = now(),
            reminder_status_reason = null
      where id = v_candidate.session_id;
      v_queued := v_queued + 1;
    end if;
  end loop;

  if v_queued > 0 then
    perform public.poke_notification_dispatcher();
  end if;

  return v_queued;
end;
$$;

revoke all on function public.enqueue_relocation_tool_abandonment_reminders(integer)
  from public, anon, authenticated;
grant execute on function public.enqueue_relocation_tool_abandonment_reminders(integer) to service_role;

-- Saatlik tarama özellik kapalıyken yalnız 0 döndürür; hukuk/izin onayı sonrasında
-- notification setting açıldığında kod deploy'u gerektirmeden çalışmaya başlar.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and not exists (select 1 from cron.job where jobname = 'relocation-tool-abandonment-reminders') then
    perform cron.schedule(
      'relocation-tool-abandonment-reminders',
      '17 * * * *',
      'select public.enqueue_relocation_tool_abandonment_reminders(100)'
    );
  end if;
end;
$$;
