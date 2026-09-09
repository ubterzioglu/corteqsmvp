-- TOP 10 HOT FIX maddelerine yorum.
--
-- NEDEN: Acil listesindeki maddeler tek cümleyle yazılıyor ve netleştirme
-- soru-cevabı bugüne kadar liste DIŞINDA (sohbet, mail) yürüyordu; madde ile
-- cevabı arasındaki bağ kayboluyordu. Artık soru ve cevap maddenin ALTINDA durur.
--
-- Desen kaynağı: public.statusreport_comments (admin-only yorum tablosu).
-- Aynı sözleşme izlendi: yumuşak silme (deleted_at), author_name serbest metin,
-- created_by auth.uid(), RLS yalnız admin.

create table if not exists public.command_center_hot_fix_comments (
  id          uuid primary key default gen_random_uuid(),
  -- Madde silinirse yorumları da gider: yorumun maddesiz anlamı yok.
  hot_fix_id  uuid not null references public.command_center_hot_fixes (id) on delete cascade,
  -- Kim yazdı (görünen ad). Soru/cevap iki kişi arasında gidip geldiği için
  -- serbest metin: "Barış", "Burak" ya da yapıştıran kişinin seçtiği ad.
  author_name text not null default 'Anonim' check (length(trim(author_name)) between 1 and 80),
  body        text not null check (length(trim(body)) between 1 and 8000),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid()
);

-- Bir maddenin yorumlarını tarih sırasıyla çekmek tek erişim deseni.
create index if not exists command_center_hot_fix_comments_item_idx
  on public.command_center_hot_fix_comments (hot_fix_id, created_at)
  where deleted_at is null;

alter table public.command_center_hot_fix_comments enable row level security;

-- Acil liste zaten yalnız yöneticiye görünüyor; yorumları da aynı kapının arkasında.
drop policy if exists hot_fix_comments_admin_select on public.command_center_hot_fix_comments;
create policy hot_fix_comments_admin_select
  on public.command_center_hot_fix_comments
  for select
  using (is_admin(auth.uid()));

drop policy if exists hot_fix_comments_admin_insert on public.command_center_hot_fix_comments;
create policy hot_fix_comments_admin_insert
  on public.command_center_hot_fix_comments
  for insert
  with check (is_admin(auth.uid()));

-- Güncelleme yalnız yumuşak silme için kullanılır (UI sert silme sunmaz).
drop policy if exists hot_fix_comments_admin_update on public.command_center_hot_fix_comments;
create policy hot_fix_comments_admin_update
  on public.command_center_hot_fix_comments
  for update
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

grant select, insert, update on public.command_center_hot_fix_comments to authenticated;

comment on table public.command_center_hot_fix_comments is
  'TOP 10 HOT FIX maddelerinin altındaki soru/cevap yorumları. Netlestirme yazismasi
   maddenin yaninda dursun diye var; RLS admin-only (liste zaten admin-only).';
