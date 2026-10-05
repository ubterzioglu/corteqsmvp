-- SG6 · Açık RLS politikalarını kapat
--
-- Kaynak: docs/security/SECURITY_AUDIT.md S10, O3, O9, O11, O10
--
-- Kapatılan politikalar:
-- - S10: advisor_social_media_links (USING(true) WITH CHECK(true)) → is_admin
-- - O3: notifications INSERT (anon) → kaldır (tetikleyici/RPC kullan)
-- - O9: command_center_hot_fixes (tüm üyelere yazılabilir) → is_admin
-- - O11: todos (anon SELECT/INSERT/UPDATE/DELETE) → kaldır
-- - O10: job_listings SELECT (anon) → kaldır (kota RPC kullan)
--
-- ⚠️ notifications doğrudan INSERT varsa → §B4 (tetikleyici/RPC'ye taşı)

begin;

-- S10: advisor_social_media_links — is_admin politikası
drop policy if exists "advisor_social_media_links_all_authenticated" on public.advisor_social_media_links;

create policy "advisor_social_media_links_admin_only"
  on public.advisor_social_media_links
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

revoke all on public.advisor_social_media_links from anon;

-- O3: notifications INSERT (anon) — kaldır
-- ⚠️ Eğer istemci doğrudan INSERT yapıyorsa bu uygulamayı bozar.
-- Önce kontrol et: src/** içinde "notifications" tablosuna INSERT var mı?
-- Yoksa güvenli. Varsa → §B4 (tetikleyici/RPC'ye taşı).
drop policy if exists "notifications_insert_anon" on public.notifications;
drop policy if exists "Notifications_insert" on public.notifications;

-- O9: command_center_hot_fixes — is_admin politikası
drop policy if exists "command_center_hot_fixes_all_members" on public.command_center_hot_fixes;
drop policy if exists "command_center_hot_fixes_select" on public.command_center_hot_fixes;
drop policy if exists "command_center_hot_fixes_insert" on public.command_center_hot_fixes;
drop policy if exists "command_center_hot_fixes_update" on public.command_center_hot_fixes;
drop policy if exists "command_center_hot_fixes_delete" on public.command_center_hot_fixes;

create policy "command_center_hot_fixes_admin_only"
  on public.command_center_hot_fixes
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- O11: todos — anon revoke
drop policy if exists "todos_anon_select" on public.todos;
drop policy if exists "todos_anon_insert" on public.todos;
drop policy if exists "todos_anon_update" on public.todos;
drop policy if exists "todos_anon_delete" on public.todos;
drop policy if exists "Todos_select" on public.todos;
drop policy if exists "Todos_insert" on public.todos;
drop policy if exists "Todos_update" on public.todos;
drop policy if exists "Todos_delete" on public.todos;

revoke all on public.todos from anon;

-- O10: job_listings SELECT (anon) — kaldır
-- Kota RPC (list_job_listings_public, get_job_listing_detail_v1) kullanılmalı.
drop policy if exists "Anyone can view published listings" on public.job_listings;
drop policy if exists "job_listings_select_published" on public.job_listings;

revoke select on public.job_listings from anon;

comment on table public.advisor_social_media_links is
  'SG6: advisor_social_media_links — is_admin politikası (S10).';

comment on table public.command_center_hot_fixes is
  'SG6: command_center_hot_fixes — is_admin politikası (O9).';

comment on table public.todos is
  'SG6: todos — anon revoke (O11).';

comment on table public.job_listings is
  'SG6: job_listings — anon SELECT revoke, kota RPC kullan (O10).';

commit;
