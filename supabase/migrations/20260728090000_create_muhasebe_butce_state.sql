-- supabase/migrations/20260728090000_create_muhasebe_butce_state.sql
-- Muhasebe > Bütçe sekmesi: yıl bazlı bütçe planı state'i (departman gideri,
-- alokasyon, gelir kalemleri). Tek JSONB sütununda saklanır — kapsam küçük
-- tutulduğu için normalize edilmiş şema yerine blob state tercih edildi.

create table public.muhasebe_butce_state (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.muhasebe_butce_state enable row level security;

create policy muhasebe_butce_state_admin_all
  on public.muhasebe_butce_state
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.set_muhasebe_butce_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_muhasebe_butce_state_updated_at
  before update on public.muhasebe_butce_state
  for each row
  execute function public.set_muhasebe_butce_state_updated_at();
