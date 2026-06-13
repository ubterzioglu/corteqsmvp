-- Service Finder jobs tablosuna seed_urls kolonu eklenir.
-- Seed URL'ler arama aşamasını atlayarak doğrudan ekstraksiyon kuyruğuna girer.
alter table public.service_finder_jobs
  add column if not exists seed_urls text[] not null default '{}';
