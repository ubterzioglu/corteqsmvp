-- record_tool_run RPC (telemetri yazımı) — Faz 3 ops.tool_runs için yazma yolu.
-- PostgREST ops şemasını expose etmediğinden, telemetri public şemadaki bir
-- security-definer RPC üzerinden yazılır. Redacted payload bekler (ham PII DEĞİL).
-- Çağıran: tool-executor sink (frontend/edge). RLS bypass etmez — sadece insert.

create or replace function public.record_tool_run(
  p_tool_key        text,
  p_status          text,
  p_http_status     integer default null,
  p_idempotency_key text default null,
  p_payload_redacted jsonb default '{}'::jsonb,
  p_latency_ms      integer default null,
  p_actor_type      text default 'agent',
  p_actor_pseudo_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ops, public
as $$
declare
  new_id uuid;
begin
  -- Girdi doğrulama (boundary): status ve tool_key zorunlu.
  if p_tool_key is null or length(p_tool_key) = 0 then
    raise exception 'tool_key zorunlu';
  end if;
  if p_status not in ('ok', 'retry', 'failed', 'blocked') then
    raise exception 'geçersiz status: %', p_status;
  end if;

  insert into ops.tool_runs (
    tool_key, actor_type, actor_pseudo_id, idempotency_key,
    finished_at, status, http_status, latency_ms,
    privacy_level, payload_redacted
  )
  values (
    p_tool_key, p_actor_type, p_actor_pseudo_id, p_idempotency_key,
    now(), p_status, p_http_status, p_latency_ms,
    'anon', coalesce(p_payload_redacted, '{}'::jsonb)
  )
  -- idempotency çakışmasında sessizce mevcut kaydı bırak (çift yazma koruması).
  on conflict (tool_key, idempotency_key) where idempotency_key is not null
  do nothing
  returning run_id into new_id;

  return new_id;
end;
$$;

comment on function public.record_tool_run is
  'Agent telemetri yazımı (ops.tool_runs). Redacted payload bekler — ham PII gönderilmemeli.';

-- authenticated + anon çağırabilir (yazma security-definer içinde kontrollü).
grant execute on function public.record_tool_run(
  text, text, integer, text, jsonb, integer, text, text
) to anon, authenticated;
