-- Admin "Revizyon İstekleri" — DB-bağlı yorum/thread sistemi.
-- /admin/revision-requests sayfasından adminlerin site/ürün revizyon taleplerini
-- açtığı (serbest kalem, FK yok — command_center_items gibi) ve her talebin altına
-- sırayla çoklu yorum (thread) eklediği bölüm.
--
-- Görünürlük: tüm adminler ortak okur/yazar. RLS gate = public.is_admin(auth.uid()).
-- Desen kaynakları:
--   • RLS / created_by  → 20260627100000_social_share_tracking.sql
--   • updated_at trigger / soft-delete → 20260510130000_create_command_center_items_workspace.sql
--   • created_by → e-posta gösterimi → admin_get_user_email(uuid) (mig 20260615160000)

-- 1) Talepler (serbest kalem) ------------------------------------------------
create table if not exists public.revision_requests (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  detail      text not null default '',
  status      text not null default 'acik'
                check (status in ('acik', 'inceleniyor', 'yapildi', 'iptal')),
  priority    integer not null default 5 check (priority between 1 and 10),
  area_label  text not null default '',                  -- opsiyonel serbest etiket
  created_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,                               -- soft-delete
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists revision_requests_deleted_at_idx
  on public.revision_requests (deleted_at);
create index if not exists revision_requests_priority_idx
  on public.revision_requests (priority desc);

-- 2) Yorumlar (thread) -------------------------------------------------------
create table if not exists public.revision_request_comments (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.revision_requests (id) on delete cascade,
  body        text not null,
  created_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,                               -- soft-delete (yorum geri alma)
  created_at  timestamptz not null default now()
);

create index if not exists revision_request_comments_request_idx
  on public.revision_request_comments (request_id, created_at);

-- 3) updated_at trigger (yalnız talepler) ------------------------------------
create or replace function public.set_revision_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_revision_requests_updated_at on public.revision_requests;
create trigger set_revision_requests_updated_at
before update on public.revision_requests
for each row
execute function public.set_revision_requests_updated_at();

-- 4) RLS — yalnız admin okur/yazar; tüm adminler ortak görür -----------------
alter table public.revision_requests          enable row level security;
alter table public.revision_request_comments  enable row level security;

-- Talepler
drop policy if exists revision_requests_admin_select on public.revision_requests;
create policy revision_requests_admin_select on public.revision_requests
  for select using (public.is_admin(auth.uid()));

drop policy if exists revision_requests_admin_insert on public.revision_requests;
create policy revision_requests_admin_insert on public.revision_requests
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists revision_requests_admin_update on public.revision_requests;
create policy revision_requests_admin_update on public.revision_requests
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Yorumlar
drop policy if exists revision_comments_admin_select on public.revision_request_comments;
create policy revision_comments_admin_select on public.revision_request_comments
  for select using (public.is_admin(auth.uid()));

drop policy if exists revision_comments_admin_insert on public.revision_request_comments;
create policy revision_comments_admin_insert on public.revision_request_comments
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists revision_comments_admin_update on public.revision_request_comments;
create policy revision_comments_admin_update on public.revision_request_comments
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

comment on table public.revision_requests is
  'Admin revizyon talepleri: serbest kalem (FK yok), durum + öncelik + alan etiketi (ortak, admin-only).';
comment on table public.revision_request_comments is
  'Revizyon talebi yorum thread''i: talep başına çoklu yorum, soft-delete (ortak, admin-only).';
