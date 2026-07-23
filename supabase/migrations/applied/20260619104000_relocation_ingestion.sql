-- Relocation Ingestion — worker iş kuyruğu + aday + maliyet defteri (Faz 2).
-- Desen: service_finder modülünün birebir uyarlaması (queue-in-table, worker_* RPC,
-- cost ledger). Worker (workers/relocation-ingestion) service_role ile bağlanır → RLS bypass.
-- Aday → admin review → relocation_services / relocation_bureaucratic_steps publish.

-- ---------------------------------------------------------------------------
-- 1) İşler (FOR UPDATE SKIP LOCKED ile claim edilir)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'review', 'completed', 'failed', 'cancelled', 'budget_stopped')),
  priority integer not null default 100,
  created_by_user_id uuid not null,
  -- Hedef: hangi kategori + ülke/şehir için veri toplanacak.
  target_kind text not null check (target_kind in ('service', 'bureaucratic_step', 'emergency_contact')),
  service_category text,                  -- target_kind='service' ise
  country_code text not null,
  city_code text,
  source_id uuid references public.relocation_source_registry(id) on delete set null,
  -- Çalışma sınırları + maliyet
  soft_cap_usd numeric(12,4) not null default 1.0000,
  hard_cap_usd numeric(12,4) not null default 2.0000,
  cost_total_usd numeric(12,4) not null default 0.0000,
  attempts integer not null default 0,
  -- Claim/lease
  locked_by text,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  last_error_message text,
  progress jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists relocation_jobs_claimable_idx
  on public.relocation_jobs (status, next_attempt_at, priority)
  where status in ('queued', 'failed');

-- ---------------------------------------------------------------------------
-- 2) Adaylar (publish'ten önce admin review)
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.relocation_jobs(id) on delete cascade,
  target_kind text not null,
  -- Normalize edilmiş payload (target_kind'a göre service / step / emergency şekli)
  normalized_payload jsonb not null,
  duplicate_key text not null,
  source_url text,
  evidence jsonb not null default '[]'::jsonb,
  confidence_score numeric(4,3) not null default 0.500,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'needs_edit', 'published')),
  review_notes text,
  published_entity_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, duplicate_key)
);

create index if not exists relocation_candidates_review_idx
  on public.relocation_candidates (review_status, created_at desc);

-- ---------------------------------------------------------------------------
-- 3) Maliyet defteri
-- ---------------------------------------------------------------------------
create table if not exists public.relocation_cost_ledger (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.relocation_jobs(id) on delete cascade,
  provider_key text not null,
  event_type text not null,
  billing_unit text not null,
  quantity numeric(14,4) not null default 0,
  unit_cost_usd numeric(12,6) not null default 0,
  amount_usd numeric(12,4) not null default 0,
  request_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists relocation_cost_ledger_job_idx
  on public.relocation_cost_ledger (job_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: ingestion tabloları admin-only okuma; yazma service_role + admin RPC.
-- ---------------------------------------------------------------------------
alter table public.relocation_jobs          enable row level security;
alter table public.relocation_candidates    enable row level security;
alter table public.relocation_cost_ledger   enable row level security;

drop policy if exists relocation_jobs_admin_read on public.relocation_jobs;
create policy relocation_jobs_admin_read on public.relocation_jobs
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists relocation_candidates_admin_read on public.relocation_candidates;
create policy relocation_candidates_admin_read on public.relocation_candidates
  for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists relocation_cost_ledger_admin_read on public.relocation_cost_ledger;
create policy relocation_cost_ledger_admin_read on public.relocation_cost_ledger
  for select to authenticated using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- worker_* RPC'leri (yalnız service_role'e grant) — service-finder db.ts aynası
-- ---------------------------------------------------------------------------

-- Atomik claim: FOR UPDATE SKIP LOCKED ile en fazla p_limit iş kilitle.
create or replace function public.worker_claim_relocation_jobs(p_worker_id text, p_limit integer)
returns setof public.relocation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimable as (
    select id from public.relocation_jobs
    where status in ('queued', 'failed')
      and next_attempt_at <= now()
    order by priority asc, next_attempt_at asc
    limit p_limit
    for update skip locked
  )
  update public.relocation_jobs j
  set status = 'running',
      locked_by = p_worker_id,
      locked_at = now(),
      lease_expires_at = now() + interval '5 minutes',
      started_at = coalesce(j.started_at, now()),
      attempts = j.attempts + 1
  from claimable c
  where j.id = c.id
  returning j.*;
end;
$$;

create or replace function public.worker_heartbeat_relocation_job(
  p_job_id uuid, p_worker_id text, p_progress jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  update public.relocation_jobs
  set lease_expires_at = now() + interval '5 minutes',
      progress = coalesce(p_progress, progress)
  where id = p_job_id and locked_by = p_worker_id and status = 'running'
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.worker_record_relocation_cost(p_payload jsonb)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid := (p_payload ->> 'job_id')::uuid;
  v_amount numeric := coalesce((p_payload ->> 'amount_usd')::numeric, 0);
  v_total numeric;
begin
  insert into public.relocation_cost_ledger
    (job_id, provider_key, event_type, billing_unit, quantity, unit_cost_usd, amount_usd, request_meta)
  values (
    v_job_id,
    p_payload ->> 'provider_key',
    p_payload ->> 'event_type',
    coalesce(p_payload ->> 'billing_unit', 'request'),
    coalesce((p_payload ->> 'quantity')::numeric, 0),
    coalesce((p_payload ->> 'unit_cost_usd')::numeric, 0),
    v_amount,
    coalesce(p_payload -> 'request_meta', '{}'::jsonb)
  );
  update public.relocation_jobs
  set cost_total_usd = cost_total_usd + v_amount
  where id = v_job_id
  returning cost_total_usd into v_total;
  return coalesce(v_total, 0);
end;
$$;

create or replace function public.worker_upsert_relocation_candidate(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.relocation_candidates
    (job_id, target_kind, normalized_payload, duplicate_key, source_url, evidence, confidence_score)
  values (
    (p_payload ->> 'job_id')::uuid,
    p_payload ->> 'target_kind',
    p_payload -> 'normalized_payload',
    p_payload ->> 'duplicate_key',
    p_payload ->> 'source_url',
    coalesce(p_payload -> 'evidence', '[]'::jsonb),
    coalesce((p_payload ->> 'confidence_score')::numeric, 0.5)
  )
  on conflict (job_id, duplicate_key) do nothing
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.worker_complete_relocation_job(
  p_job_id uuid, p_worker_id text, p_status text, p_result_summary jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if p_status not in ('review', 'completed', 'budget_stopped') then
    raise exception 'rl_invalid_completion_status';
  end if;
  update public.relocation_jobs
  set status = p_status,
      result_summary = coalesce(p_result_summary, result_summary),
      finished_at = now(),
      locked_by = null,
      lease_expires_at = null
  where id = p_job_id and locked_by = p_worker_id
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.worker_fail_relocation_job(
  p_job_id uuid, p_worker_id text, p_error_code text, p_error_message text,
  p_retryable boolean, p_retry_delay_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.relocation_jobs
  set status = case when p_retryable then 'failed' else 'failed' end,
      last_error_code = p_error_code,
      last_error_message = p_error_message,
      next_attempt_at = now() + make_interval(secs => greatest(coalesce(p_retry_delay_seconds, 60), 1)),
      locked_by = null,
      lease_expires_at = null
  where id = p_job_id and locked_by = p_worker_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_* RPC'leri (is_admin gated, authenticated grant) — review/publish
-- ---------------------------------------------------------------------------
create or replace function public.admin_review_relocation_candidate(
  p_candidate_id uuid, p_action text, p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'rl_admin_required';
  end if;
  if p_action not in ('approved', 'rejected', 'needs_edit') then
    raise exception 'rl_invalid_review_action';
  end if;
  update public.relocation_candidates
  set review_status = p_action, review_notes = p_notes, updated_at = now()
  where id = p_candidate_id;
end;
$$;

-- Publish: onaylı adayı hedef tabloya (service/step/emergency) yazar.
create or replace function public.admin_publish_relocation_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cand public.relocation_candidates%rowtype;
  v_p jsonb;
  v_entity_id uuid;
begin
  if not public.is_admin(v_uid) then
    raise exception 'rl_admin_required';
  end if;
  select * into v_cand from public.relocation_candidates where id = p_candidate_id;
  if not found then
    raise exception 'rl_candidate_not_found';
  end if;
  if v_cand.review_status not in ('approved', 'needs_edit') then
    raise exception 'rl_candidate_not_approved';
  end if;
  v_p := v_cand.normalized_payload;

  if v_cand.target_kind = 'service' then
    insert into public.relocation_services
      (category, provider_name, country_code, city_code, plan_name, price_min, price_max,
       currency, languages, website_url, appointment_url, source_id, trust_score, freshness_at)
    values (
      v_p ->> 'category', v_p ->> 'provider_name', v_p ->> 'country_code', v_p ->> 'city_code',
      v_p ->> 'plan_name', nullif(v_p ->> 'price_min','')::numeric, nullif(v_p ->> 'price_max','')::numeric,
      v_p ->> 'currency',
      coalesce(array(select jsonb_array_elements_text(v_p -> 'languages')), '{}'::text[]),
      v_p ->> 'website_url', v_p ->> 'appointment_url',
      (select id from public.relocation_source_registry where id = (v_p ->> 'source_id')::uuid),
      coalesce((v_p ->> 'trust_score')::numeric, 0.3), now()
    )
    returning id into v_entity_id;
  elsif v_cand.target_kind = 'bureaucratic_step' then
    insert into public.relocation_bureaucratic_steps
      (country_code, city_code, name, description, trigger, deadline_rule, required_documents,
       official_url_label, official_url, source_id)
    values (
      v_p ->> 'country_code', v_p ->> 'city_code', v_p ->> 'name', v_p ->> 'description',
      coalesce(v_p ->> 'trigger', 'after_arrival'), v_p ->> 'deadline_rule',
      coalesce(array(select jsonb_array_elements_text(v_p -> 'required_documents')), '{}'::text[]),
      v_p ->> 'official_url_label', v_p ->> 'official_url',
      (v_p ->> 'source_id')::uuid
    )
    returning id into v_entity_id;
  elsif v_cand.target_kind = 'emergency_contact' then
    insert into public.relocation_emergency_contacts
      (country_code, city_code, type, label, phone, url, source_id)
    values (
      v_p ->> 'country_code', v_p ->> 'city_code', v_p ->> 'type', v_p ->> 'label',
      v_p ->> 'phone', v_p ->> 'url', (v_p ->> 'source_id')::uuid
    )
    returning id into v_entity_id;
  else
    raise exception 'rl_unknown_target_kind';
  end if;

  update public.relocation_candidates
  set review_status = 'published', published_entity_id = v_entity_id, published_at = now(), updated_at = now()
  where id = p_candidate_id;

  return v_entity_id;
end;
$$;

-- Grants
grant execute on function public.worker_claim_relocation_jobs(text, integer) to service_role;
grant execute on function public.worker_heartbeat_relocation_job(uuid, text, jsonb) to service_role;
grant execute on function public.worker_record_relocation_cost(jsonb) to service_role;
grant execute on function public.worker_upsert_relocation_candidate(jsonb) to service_role;
grant execute on function public.worker_complete_relocation_job(uuid, text, text, jsonb) to service_role;
grant execute on function public.worker_fail_relocation_job(uuid, text, text, text, boolean, integer) to service_role;
grant execute on function public.admin_review_relocation_candidate(uuid, text, text) to authenticated;
grant execute on function public.admin_publish_relocation_candidate(uuid) to authenticated;
