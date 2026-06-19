-- Relocation Engine — model artifact metadata + promote (Faz 3 alpha).
-- Hibrit sıralama (LTR) için model sürüm kaydı. Faz 1-2'de model YOK; bu tablo
-- dataset yoğunlaştığında offline eğitilen modelin metadata'sını ve aktif alpha'yı taşır.
-- src/lib/relocation-ranking.ts blendFinalScore(rule, ml, alpha) ile eşleşir.

create table if not exists public.relocation_rank_models (
  id uuid primary key default gen_random_uuid(),
  model_version text not null unique,
  algorithm text not null default 'lambdamart',
  -- final = (1-alpha)*rule + alpha*ml. alpha=0 → saf kural (cold-start).
  blend_alpha numeric(4,3) not null default 0.000 check (blend_alpha >= 0 and blend_alpha <= 1),
  -- Offline metrikler (Recall@K / NDCG@K / MRR) — denetim için saklanır.
  offline_metrics jsonb not null default '{}'::jsonb,
  artifact_ref text,                 -- model dosyası referansı (storage yolu / harici)
  is_active boolean not null default false,
  policy_version text,
  notes text,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

comment on table public.relocation_rank_models is
  'Relocation hibrit sıralama modeli metadata. blend_alpha=0 → saf kural skoru. Faz 3.';

alter table public.relocation_rank_models enable row level security;

drop policy if exists relocation_rank_models_admin_read on public.relocation_rank_models;
create policy relocation_rank_models_admin_read on public.relocation_rank_models
  for select to authenticated using (public.is_admin(auth.uid()));

-- Aktif modeli getir (yoksa null → çağıran alpha=0 ile saf kural kullanır).
create or replace function public.relocation_active_rank_model()
returns public.relocation_rank_models
language sql
stable
security definer
set search_path = public
as $$
  select * from public.relocation_rank_models where is_active order by activated_at desc nulls last limit 1;
$$;

-- Yeni modeli aktif et (admin) — tek aktif model garantisi.
create or replace function public.admin_promote_relocation_model(p_model_version text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'rl_admin_required';
  end if;
  if not exists (select 1 from public.relocation_rank_models where model_version = p_model_version) then
    raise exception 'rl_model_not_found';
  end if;
  update public.relocation_rank_models set is_active = false where is_active;
  update public.relocation_rank_models
  set is_active = true, activated_at = now()
  where model_version = p_model_version;
end;
$$;

grant execute on function public.relocation_active_rank_model() to authenticated;
grant execute on function public.admin_promote_relocation_model(text) to authenticated;
