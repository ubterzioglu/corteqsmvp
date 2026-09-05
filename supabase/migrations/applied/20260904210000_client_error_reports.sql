-- İstemci hata kayıtları — Cadde WS1 m134 ("yorum yazınca sayfa hataya geçiyor") tanısı
-- için kalıcı kanıt. Devir notu 2026-09-04: "Yazma hataları yalnız console.error ile
-- konsola gidiyor, kalıcı kayıt yok — geriye dönük inceleyecek kanıt üretilmemiş."
--
-- Model, depodaki write_admin_audit_log / record_tool_run desenini izler:
--   * tablo private (RLS açık, yalnız admin SELECT), istemci doğrudan INSERT edemez;
--   * yazma yalnız SECURITY DEFINER RPC `report_client_error` (authenticated);
--   * kullanıcı başına saatte 30 kayıt tavanı — aşımda sessizce null döner (abuse fren);
--   * alan uzunlukları RPC'de kırpılır (mesaj 2000, stack 4000);
--   * 90 günden eski kayıtlar pg_cron ile silinir (uzantı varsa).
-- PII notu: `message/details/hint` ham Postgres hatası taşıyabilir; RPC payload'ı
-- (yorum metni, medya) ASLA gönderilmez — istemci tarafı yalnız hata nesnesini yollar.

create table if not exists public.client_error_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null,
  context text not null,
  message text not null,
  error_code text,
  details text,
  hint text,
  route text,
  user_agent text,
  component_stack text,
  extra jsonb,
  created_at timestamptz not null default now(),
  constraint client_error_reports_source_check
    check (source in ('cadde_write', 'cadde_read', 'render', 'unhandled'))
);

comment on table public.client_error_reports is
  'İstemci (tarayıcı) hata kayıtları — m134 tanısı. Yazma yalnız report_client_error RPC (authenticated, saatte 30/kullanıcı); okuma yalnız admin. 90 gün saklanır.';

create index if not exists client_error_reports_created_at_idx
  on public.client_error_reports (created_at desc);
create index if not exists client_error_reports_source_created_at_idx
  on public.client_error_reports (source, created_at desc);
create index if not exists client_error_reports_user_created_at_idx
  on public.client_error_reports (user_id, created_at desc);

alter table public.client_error_reports enable row level security;

drop policy if exists client_error_reports_admin_read on public.client_error_reports;
create policy client_error_reports_admin_read
  on public.client_error_reports
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

revoke all on table public.client_error_reports from anon, authenticated;
grant select on table public.client_error_reports to authenticated;
grant all on table public.client_error_reports to service_role;

create or replace function public.report_client_error(
  p_source text,
  p_context text,
  p_message text,
  p_error_code text default null,
  p_details text default null,
  p_hint text default null,
  p_route text default null,
  p_user_agent text default null,
  p_component_stack text default null,
  p_extra jsonb default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_recent integer;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_source not in ('cadde_write', 'cadde_read', 'render', 'unhandled') then
    raise exception 'invalid source' using errcode = '22023';
  end if;

  if coalesce(btrim(p_context), '') = '' or coalesce(btrim(p_message), '') = '' then
    raise exception 'context and message are required' using errcode = '22023';
  end if;

  -- Abuse freni: bir kullanıcı saatte en fazla 30 kayıt; aşımda sessizce düşür.
  select count(*) into v_recent
  from public.client_error_reports
  where user_id = v_uid
    and created_at > now() - interval '1 hour';

  if v_recent >= 30 then
    return null;
  end if;

  insert into public.client_error_reports (
    user_id, source, context, message, error_code, details, hint,
    route, user_agent, component_stack, extra
  ) values (
    v_uid,
    p_source,
    left(btrim(p_context), 200),
    left(btrim(p_message), 2000),
    nullif(left(btrim(coalesce(p_error_code, '')), 40), ''),
    nullif(left(coalesce(p_details, ''), 2000), ''),
    nullif(left(coalesce(p_hint, ''), 1000), ''),
    nullif(left(coalesce(p_route, ''), 300), ''),
    nullif(left(coalesce(p_user_agent, ''), 400), ''),
    nullif(left(coalesce(p_component_stack, ''), 4000), ''),
    p_extra
  )
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.report_client_error(text, text, text, text, text, text, text, text, text, jsonb) is
  'İstemci hata kaydı yazar (client_error_reports). Yalnız authenticated; saatte 30/kullanıcı, aşımda null. Ham PII/payload gönderilmemeli.';

revoke all on function public.report_client_error(text, text, text, text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.report_client_error(text, text, text, text, text, text, text, text, text, jsonb) to authenticated, service_role;

-- 90 gün saklama — pg_cron kurulu olan canlıda günlük temizlik (03:17 UTC).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'client_error_reports_prune';

    perform cron.schedule(
      'client_error_reports_prune',
      '17 3 * * *',
      $job$ delete from public.client_error_reports where created_at < now() - interval '90 days' $job$
    );
  end if;
end
$$;
