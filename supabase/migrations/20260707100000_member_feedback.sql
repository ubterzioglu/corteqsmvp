-- Üye Geri Bildirimleri — "Feedback Ver" butonu + /feedback formu + /admin/feedback listesi.
-- Üyeler (authenticated) kendi feedback kaydını ekler; okuma/durum/soft-delete yalnız admin.
--
-- Desen kaynağı: 20260628100000_revision_requests.sql (updated_at trigger, soft-delete,
-- is_admin RLS gate). Tek fark: INSERT policy üyeye açık (auth.uid() = created_by).
-- Gövde limiti 50000 = src/lib/security.ts MAX_CONTENT_LENGTH ile hizalı.

-- 1) Tablo -------------------------------------------------------------------
create table if not exists public.member_feedback (
  id          uuid primary key default gen_random_uuid(),
  body        text not null check (char_length(body) between 1 and 50000),
  page_path   text not null default '',            -- feedback'in verildiği sayfa (opsiyonel bağlam)
  status      text not null default 'yeni'
                check (status in ('yeni', 'okundu', 'arsiv')),
  created_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,                          -- soft-delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists member_feedback_deleted_at_idx
  on public.member_feedback (deleted_at);
create index if not exists member_feedback_created_at_idx
  on public.member_feedback (created_at desc);

-- 2) updated_at trigger ------------------------------------------------------
create or replace function public.set_member_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_member_feedback_updated_at on public.member_feedback;
create trigger set_member_feedback_updated_at
before update on public.member_feedback
for each row
execute function public.set_member_feedback_updated_at();

-- 3) RLS — üye kendi kaydını ekler; okuma/güncelleme yalnız admin -------------
alter table public.member_feedback enable row level security;

drop policy if exists member_feedback_member_insert on public.member_feedback;
create policy member_feedback_member_insert on public.member_feedback
  for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists member_feedback_admin_select on public.member_feedback;
create policy member_feedback_admin_select on public.member_feedback
  for select using (public.is_admin(auth.uid()));

drop policy if exists member_feedback_admin_update on public.member_feedback;
create policy member_feedback_admin_update on public.member_feedback
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

comment on table public.member_feedback is
  'Üye geri bildirimleri: /feedback formundan üye INSERT, /admin/feedback listesi admin-only (durum + soft-delete).';
