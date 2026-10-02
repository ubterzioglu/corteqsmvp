-- CorteQS Kariyer — başvuru altyapısı (Supabase)
-- Supabase SQL Editor'de bir kez çalıştırılır.
-- Anon kullanıcı yalnızca başvuru EKLEYEBİLİR ve dosya YÜKLEYEBİLİR; okuyamaz, silemez.
-- Başvurular admin panelinden has_role(auth.uid(), 'admin') ile okunur.

-- 1) Tablo
create table if not exists public.career_applications (
  id                 uuid primary key,
  created_at         timestamptz not null default now(),
  full_name          text not null check (char_length(full_name) between 2 and 200),
  email              text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text,
  linkedin           text,
  country            text not null,
  city               text,
  position           text not null,
  model              text not null check (model in ('kurucu-ekip','yatirimci-ortak','staj','gorusmede')),
  cover_letter_text  text check (char_length(cover_letter_text) <= 10000),
  cv_path            text not null,
  cover_letter_path  text,
  presentation_path  text,
  consent            boolean not null check (consent = true),
  source             text,
  status             text not null default 'yeni'
                     check (status in ('yeni','inceleniyor','gorusme','teklif','olumsuz','arsiv')),
  notes              text
);

create index if not exists career_applications_position_idx on public.career_applications (position, created_at desc);

alter table public.career_applications enable row level security;

-- Herkes (anon) başvuru ekleyebilir; status/notes alanlarını dolduramaz
drop policy if exists "anon can apply" on public.career_applications;
create policy "anon can apply" on public.career_applications
  for insert to anon, authenticated
  with check (status = 'yeni' and notes is null);

-- Sadece admin okur ve günceller (mevcut has_role fonksiyonu kullanılır)
drop policy if exists "admin reads applications" on public.career_applications;
create policy "admin reads applications" on public.career_applications
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin updates applications" on public.career_applications;
create policy "admin updates applications" on public.career_applications
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2) Özel (private) dosya kovası: 25 MB sınır, izin verilen türler
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-applications', 'career-applications', false, 26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/x-iwork-keynote-sffkey',
    'application/vnd.apple.keynote',
    'application/octet-stream'
  ]
)
on conflict (id) do nothing;

-- Anon yalnızca bu kovaya dosya yükleyebilir (okuyamaz, üzerine yazamaz)
drop policy if exists "anon uploads career files" on storage.objects;
create policy "anon uploads career files" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'career-applications');

-- Admin dosyaları okuyabilir (signed URL üretmek için)
drop policy if exists "admin reads career files" on storage.objects;
create policy "admin reads career files" on storage.objects
  for select to authenticated
  using (bucket_id = 'career-applications' and public.has_role(auth.uid(), 'admin'));
