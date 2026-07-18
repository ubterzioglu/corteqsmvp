-- Admin Panel V2 — favori sayfalar artık DB'de kalıcı (kullanıcı bazlı).
-- Önceden localStorage'da tutuluyordu (corteqs.admin.favorite-pages.v1) — tarayıcı verisi
-- silinince veya farklı cihazda kayboluyordu. Her admin kendi favori id listesini görür/yazar.
--
-- Desen kaynağı: 20260707100000_member_feedback.sql (updated_at trigger, is_admin RLS gate).

create table if not exists public.admin_favorite_pages (
  admin_user_id uuid primary key references auth.users (id) on delete cascade,
  page_ids      text[] not null default '{}',
  updated_at    timestamptz not null default now()
);

create or replace function public.set_admin_favorite_pages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_favorite_pages_updated_at on public.admin_favorite_pages;
create trigger set_admin_favorite_pages_updated_at
before update on public.admin_favorite_pages
for each row
execute function public.set_admin_favorite_pages_updated_at();

alter table public.admin_favorite_pages enable row level security;

drop policy if exists admin_favorite_pages_self_select on public.admin_favorite_pages;
create policy admin_favorite_pages_self_select on public.admin_favorite_pages
  for select using (public.is_admin(auth.uid()) and auth.uid() = admin_user_id);

drop policy if exists admin_favorite_pages_self_insert on public.admin_favorite_pages;
create policy admin_favorite_pages_self_insert on public.admin_favorite_pages
  for insert to authenticated
  with check (public.is_admin(auth.uid()) and auth.uid() = admin_user_id);

drop policy if exists admin_favorite_pages_self_update on public.admin_favorite_pages;
create policy admin_favorite_pages_self_update on public.admin_favorite_pages
  for update using (public.is_admin(auth.uid()) and auth.uid() = admin_user_id)
  with check (public.is_admin(auth.uid()) and auth.uid() = admin_user_id);

comment on table public.admin_favorite_pages is
  'Admin panel favori sayfa id listesi (kullanıcı bazlı, tek satır/admin). RLS: sadece kendi kaydı, is_admin gate.';
