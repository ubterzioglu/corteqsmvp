-- Sosyal Medya Paylaşım Takip Sistemi
-- /admin/social-share-vault sayfasındaki içerik kalemlerinin (araç tanıtımları,
-- diaspora postları, test araçları) hangi platformlarda paylaşıldığını işaretlemek için.
--
-- İçerik kaynağı statik TS dosyalarında yaşıyor (src/lib/admin-shell/social-*.ts);
-- bu yüzden takip katmanı serbest `item_id text` ile üstüne eklenir, FK yoktur.
-- Tasarım: docs/superpowers/specs/2026-06-26-social-share-tracking-design.md
--
-- Görünürlük: tüm adminler ortak. RLS gate = public.is_admin(auth.uid()) (okuma+yazma).
-- Desen kaynağı: 20260625100000_agent_ops_analytics.sql.

-- 1) Rozetler: kalem × platform tek satır -----------------------------------
create table if not exists public.social_share_log (
  id          uuid primary key default gen_random_uuid(),
  item_tab    text not null check (item_tab in ('tools', 'diaspora', 'tests')),
  item_id     text not null,                 -- ör. 'tool-1', 'post-1', 'test-tool-1'
  platform    text not null check (platform in ('linkedin', 'instagram', 'reddit', 'x', 'facebook', 'threads')),
  shared      boolean not null default true,
  marked_by   uuid references auth.users (id) on delete set null,
  marked_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  constraint social_share_log_item_platform_uniq unique (item_tab, item_id, platform)
);

create index if not exists social_share_log_item_idx
  on public.social_share_log (item_tab, item_id);

-- 2) Not: kalem başına tek opsiyonel not/link -------------------------------
create table if not exists public.social_share_item_note (
  id          uuid primary key default gen_random_uuid(),
  item_tab    text not null check (item_tab in ('tools', 'diaspora', 'tests')),
  item_id     text not null,
  note        text not null default '',
  marked_by   uuid references auth.users (id) on delete set null,
  marked_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  constraint social_share_item_note_item_uniq unique (item_tab, item_id)
);

-- 3) RLS: yalnız admin okur/yazar; tüm adminler ortak durumu görür ----------
alter table public.social_share_log       enable row level security;
alter table public.social_share_item_note enable row level security;

drop policy if exists social_share_log_admin_select on public.social_share_log;
create policy social_share_log_admin_select on public.social_share_log
  for select using (public.is_admin(auth.uid()));

drop policy if exists social_share_log_admin_insert on public.social_share_log;
create policy social_share_log_admin_insert on public.social_share_log
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists social_share_log_admin_update on public.social_share_log;
create policy social_share_log_admin_update on public.social_share_log
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists social_share_note_admin_select on public.social_share_item_note;
create policy social_share_note_admin_select on public.social_share_item_note
  for select using (public.is_admin(auth.uid()));

drop policy if exists social_share_note_admin_insert on public.social_share_item_note;
create policy social_share_note_admin_insert on public.social_share_item_note
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists social_share_note_admin_update on public.social_share_item_note;
create policy social_share_note_admin_update on public.social_share_item_note
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

comment on table public.social_share_log is
  'Sosyal paylaşım takip rozetleri: /admin/social-share-vault kalemlerinin platform bazlı paylaşım durumu (ortak, admin-only).';
comment on table public.social_share_item_note is
  'Sosyal paylaşım takip notları: kalem başına tek opsiyonel not/link (ortak, admin-only).';
