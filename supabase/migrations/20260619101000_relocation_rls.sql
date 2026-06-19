-- Relocation Engine — RLS politikaları (Faz 1a).
-- Desen: cadde/service-finder ile aynı.
--   • Kullanıcı dosyaları (moves/interactions): sahip-bazlı (auth.uid()).
--   • Referans içerik (locations/services/steps/emergency/source_registry): public read.
--   • İçerik tablolarına KULLANICI INSERT/UPDATE yok — yazma service-definer RPC veya
--     ingestion worker (service_role, RLS bypass) üzerinden. (cadde RPC-only kuralı.)
--   • recommendations: sahibi okur; yazma yalnızca RPC (security definer).

alter table public.relocation_source_registry      enable row level security;
alter table public.relocation_locations            enable row level security;
alter table public.relocation_services             enable row level security;
alter table public.relocation_bureaucratic_steps   enable row level security;
alter table public.relocation_emergency_contacts   enable row level security;
alter table public.relocation_moves                enable row level security;
alter table public.relocation_recommendations      enable row level security;
alter table public.relocation_interactions         enable row level security;

-- ---------------------------------------------------------------------------
-- Referans içerik: herkes (anon + authenticated) aktif satırları okur.
-- source_registry yalnızca authenticated okur (provider isimleri/terms — partner gürültüsü).
-- ---------------------------------------------------------------------------
drop policy if exists relocation_locations_read on public.relocation_locations;
create policy relocation_locations_read on public.relocation_locations
  for select using (is_active);

drop policy if exists relocation_services_read on public.relocation_services;
create policy relocation_services_read on public.relocation_services
  for select using (is_active);

drop policy if exists relocation_steps_read on public.relocation_bureaucratic_steps;
create policy relocation_steps_read on public.relocation_bureaucratic_steps
  for select using (is_active);

drop policy if exists relocation_emergency_read on public.relocation_emergency_contacts;
create policy relocation_emergency_read on public.relocation_emergency_contacts
  for select using (is_active);

drop policy if exists relocation_source_registry_read on public.relocation_source_registry;
create policy relocation_source_registry_read on public.relocation_source_registry
  for select to authenticated using (is_active);

-- ---------------------------------------------------------------------------
-- Taşınma dosyaları: sahip okur/yazar. (Mutasyonlar pratikte RPC üzerinden gider;
-- doğrudan sahip-INSERT/UPDATE de güvenli tutulur — user_id = auth.uid() zorunlu.)
-- ---------------------------------------------------------------------------
drop policy if exists relocation_moves_owner_select on public.relocation_moves;
create policy relocation_moves_owner_select on public.relocation_moves
  for select to authenticated using (user_id = auth.uid());

drop policy if exists relocation_moves_owner_insert on public.relocation_moves;
create policy relocation_moves_owner_insert on public.relocation_moves
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists relocation_moves_owner_update on public.relocation_moves;
create policy relocation_moves_owner_update on public.relocation_moves
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists relocation_moves_owner_delete on public.relocation_moves;
create policy relocation_moves_owner_delete on public.relocation_moves
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Öneriler: sahibi (move üzerinden) okur. Yazma yalnızca RPC (security definer, RLS bypass).
-- ---------------------------------------------------------------------------
drop policy if exists relocation_recommendations_owner_select on public.relocation_recommendations;
create policy relocation_recommendations_owner_select on public.relocation_recommendations
  for select to authenticated using (
    exists (
      select 1 from public.relocation_moves m
      where m.id = relocation_recommendations.move_id and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Etkileşimler: sahip yazar (kendi event'i); okuma yalnızca sahibe.
-- ---------------------------------------------------------------------------
drop policy if exists relocation_interactions_owner_insert on public.relocation_interactions;
create policy relocation_interactions_owner_insert on public.relocation_interactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists relocation_interactions_owner_select on public.relocation_interactions;
create policy relocation_interactions_owner_select on public.relocation_interactions
  for select to authenticated using (user_id = auth.uid());

-- Not: content tablolarına (locations/services/steps/emergency/source_registry) hiçbir
-- INSERT/UPDATE/DELETE policy YOK — bu bilinçli. Yazma service_role (worker) veya
-- security-definer admin RPC üzerinden yapılır. RLS açık + policy yok = yazma reddedilir.
