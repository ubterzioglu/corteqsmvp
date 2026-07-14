-- Revizyon İstekleri — talep/yorum ekleri (görsel).
-- /admin/revision-requests sayfasında bir revizyon talebine veya bir yoruma
-- eklenen görseller. Her satır tam olarak bir üst kayda bağlıdır (talep XOR yorum).
-- Görünürlük: tüm adminler ortak okur/yazar. RLS gate = public.is_admin(auth.uid()).
-- Desen kaynakları:
--   • Tablo/RLS deseni → 20260628100000_revision_requests.sql
--   • Storage bucket/policy deseni → 20260708120000_burak_share_assets.sql

-- 1) Ekler tablosu -----------------------------------------------------------
create table if not exists public.revision_request_attachments (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid references public.revision_requests (id) on delete cascade,
  comment_id    uuid references public.revision_request_comments (id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  content_type  text,
  size_bytes    integer,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  constraint revision_request_attachments_one_parent_chk check (
    ((request_id is not null)::int + (comment_id is not null)::int) = 1
  )
);

create index if not exists revision_request_attachments_request_idx
  on public.revision_request_attachments (request_id) where deleted_at is null;
create index if not exists revision_request_attachments_comment_idx
  on public.revision_request_attachments (comment_id) where deleted_at is null;

-- 2) RLS — yalnız admin okur/yazar; tüm adminler ortak görür -----------------
alter table public.revision_request_attachments enable row level security;

drop policy if exists revision_request_attachments_admin_select on public.revision_request_attachments;
create policy revision_request_attachments_admin_select on public.revision_request_attachments
  for select using (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_insert on public.revision_request_attachments;
create policy revision_request_attachments_admin_insert on public.revision_request_attachments
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_update on public.revision_request_attachments;
create policy revision_request_attachments_admin_update on public.revision_request_attachments
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists revision_request_attachments_admin_delete on public.revision_request_attachments;
create policy revision_request_attachments_admin_delete on public.revision_request_attachments
  for delete using (public.is_admin(auth.uid()));

comment on table public.revision_request_attachments is
  'Revizyon talebi/yorum görsel ekleri: satır başına tek dosya, talep XOR yoruma bağlı (ortak, admin-only).';

-- 3) Private storage bucket (yalnız admin okuma/yazma) ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select
  'revision-attachments',
  'revision-attachments',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where not exists (
  select 1 from storage.buckets where id = 'revision-attachments'
);

drop policy if exists "revision attachments admin read" on storage.objects;
create policy "revision attachments admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin insert" on storage.objects;
create policy "revision attachments admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin update" on storage.objects;
create policy "revision attachments admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()))
  with check (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));

drop policy if exists "revision attachments admin delete" on storage.objects;
create policy "revision attachments admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'revision-attachments' and public.is_admin(auth.uid()));
