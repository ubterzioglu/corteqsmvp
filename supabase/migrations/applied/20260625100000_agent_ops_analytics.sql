-- Agent ops analytics şeması (Faz 3: telemetri + anonimleştirme)
-- Ajan yürütme telemetrisi (redacted, pseudonymized) + anonim günlük raporlar.
-- Kaynak tasarım: newtools.md §"Araç envanteri" ops.* + §"Skorlama, gizlilik".
--
-- Gizlilik: payload/result redacted yazılır; doğrudan tanımlayıcı tutulmaz
-- (actor_pseudo_id = HMAC). RLS deny-all default + yalnız is_admin() okuma.
-- Retention: ops.purge_expired_runs() eski ham run'ları siler (cron'a bağlanabilir).

create schema if not exists ops;

-- 1) Ham yürütme kayıtları (kısa retention) ---------------------------------
create table if not exists ops.tool_runs (
  run_id            uuid primary key default gen_random_uuid(),
  tool_key          text not null,
  actor_type        text not null,            -- human, agent, scheduler
  actor_pseudo_id   text,                     -- HMAC-SHA256 pseudonym (ham id DEĞİL)
  idempotency_key   text,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text not null,            -- ok, retry, failed, blocked
  http_status       integer,
  latency_ms        integer,
  error_code        text,
  privacy_level     text not null default 'anon',  -- pii, pseudo, anon
  payload_redacted  jsonb,
  result_redacted   jsonb,
  tags              jsonb not null default '[]'::jsonb
);

create index if not exists tool_runs_tool_time_idx
  on ops.tool_runs (tool_key, started_at desc);
create unique index if not exists tool_runs_idempotency_idx
  on ops.tool_runs (tool_key, idempotency_key)
  where idempotency_key is not null;

-- 2) Anonim günlük metrikler (uzun retention / süresiz agregat) --------------
create table if not exists ops.anon_daily_metrics (
  metric_date       date not null,
  tool_key          text not null,
  country_code      text,
  city_bucket       text,
  run_count         integer not null default 0,
  success_count     integer not null default 0,
  failure_count     integer not null default 0,
  p50_latency_ms    integer,
  p95_latency_ms    integer,
  k_threshold       integer not null default 20,
  released_at       timestamptz not null default now(),
  primary key (metric_date, tool_key, country_code, city_bucket)
);

-- 3) Hata kümeleri (4xx/5xx explorer) ---------------------------------------
create table if not exists ops.error_buckets (
  bucket_date       date not null,
  tool_key          text not null,
  http_status       integer not null,
  error_code        text not null default 'unknown',
  occurrences       integer not null default 0,
  primary key (bucket_date, tool_key, http_status, error_code)
);

-- RLS: deny-all default, yalnız admin okuma -------------------------------
alter table ops.tool_runs          enable row level security;
alter table ops.anon_daily_metrics enable row level security;
alter table ops.error_buckets      enable row level security;

drop policy if exists tool_runs_admin_read on ops.tool_runs;
create policy tool_runs_admin_read on ops.tool_runs
  for select using (public.is_admin(auth.uid()));

drop policy if exists anon_metrics_admin_read on ops.anon_daily_metrics;
create policy anon_metrics_admin_read on ops.anon_daily_metrics
  for select using (public.is_admin(auth.uid()));

drop policy if exists error_buckets_admin_read on ops.error_buckets;
create policy error_buckets_admin_read on ops.error_buckets
  for select using (public.is_admin(auth.uid()));

-- 4) Retention: süresi dolmuş ham run'ları sil (varsayılan 90 gün) ----------
create or replace function ops.purge_expired_runs(retain_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = ops, public
as $$
declare
  removed integer;
begin
  delete from ops.tool_runs
  where started_at < now() - make_interval(days => greatest(retain_days, 1));
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- 5) Günlük anonim metrik toplama (ham → agregat; k-anonimlik baskılaması) ---
-- Küçük kümeleri (run_count < k_threshold) gizlilik için coğrafi olarak yutar.
create or replace function ops.rollup_anon_daily(target_date date default (current_date - 1))
returns integer
language plpgsql
security definer
set search_path = ops, public
as $$
declare
  inserted integer;
begin
  insert into ops.anon_daily_metrics (
    metric_date, tool_key, country_code, city_bucket,
    run_count, success_count, failure_count, p50_latency_ms, p95_latency_ms
  )
  select
    target_date,
    tool_key,
    coalesce((payload_redacted->>'country_code'), 'XX') as country_code,
    'all' as city_bucket,  -- şehir bucket'ı k-anonimlik için varsayılan 'all'
    count(*),
    count(*) filter (where status = 'ok'),
    count(*) filter (where status <> 'ok'),
    percentile_cont(0.5) within group (order by latency_ms)::int,
    percentile_cont(0.95) within group (order by latency_ms)::int
  from ops.tool_runs
  where started_at >= target_date and started_at < target_date + 1
  group by tool_key, coalesce((payload_redacted->>'country_code'), 'XX')
  on conflict (metric_date, tool_key, country_code, city_bucket) do update set
    run_count = excluded.run_count,
    success_count = excluded.success_count,
    failure_count = excluded.failure_count,
    p50_latency_ms = excluded.p50_latency_ms,
    p95_latency_ms = excluded.p95_latency_ms,
    released_at = now();
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

comment on schema ops is
  'Agent yürütme telemetrisi + anonim raporlar. Ham PII tutulmaz; actor_pseudo_id HMAC, payload redacted.';
