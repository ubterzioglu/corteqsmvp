-- SG9 · Atomik rate-limit RPC
--
-- Kaynak: docs/security/SECURITY_AUDIT.md O1
-- Bulgu: Rate-limit atomik değil, IP sahteciliği mümkün.
--
-- Yama:
-- 1. edge_rate_limit_atomic RPC: INSERT ON CONFLICT DO UPDATE (atomik)
-- 2. user.id ile anahtarlama (sahtecilik önleme)
-- 3. Fallback: IP adresi (auth yoksa)

begin;

-- Atomik rate-limit fonksiyonu
create or replace function public.edge_rate_limit_atomic(
  p_scope text,
  p_client_key text,
  p_window_started_at timestamptz,
  p_max_requests integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Atomik INSERT ON CONFLICT DO UPDATE
  -- Yarış durumu: iki eşzamanlı istek aynı pencerede → ikisi de insert dener,
  -- biri çakışır ve update olur. Select+update ayrı ayrı olsaydı kaybolurdu.
  insert into public.edge_rate_limits (scope, client_key, window_started_at, request_count)
  values (p_scope, p_client_key, p_window_started_at, 1)
  on conflict (scope, client_key) do update
  set
    window_started_at = case
      when edge_rate_limits.window_started_at = p_window_started_at then edge_rate_limits.window_started_at
      else p_window_started_at
    end,
    request_count = case
      when edge_rate_limits.window_started_at = p_window_started_at then edge_rate_limits.request_count + 1
      else 1
    end
  returning request_count into v_count;

  -- Limit kontrolü
  if v_count > p_max_requests then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.edge_rate_limit_atomic(text, text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.edge_rate_limit_atomic(text, text, timestamptz, integer) to service_role;

comment on function public.edge_rate_limit_atomic(text, text, timestamptz, integer) is
  'SG9: Atomik rate-limit. INSERT ON CONFLICT DO UPDATE ile yarış koruması. user.id ile anahtarlama önerilir.';

commit;
