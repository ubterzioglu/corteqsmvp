-- B7a · 241 konsolosluk kaydını yayınlama (operasyon SQL'i)
--
-- Karar: 5 Ekim 2026 — kullanıcı onayı alındı.
-- Tüm pending_review konsolosluk kayıtları published yapılır.
--
-- Çalıştırma: §B9'da psql ile.

begin;

-- 1. Sayım (önce sonucu gör)
select count(*) as pending_consulate_count
from public.catalog_items
where verification_status = 'pending_review'
  and (title ilike '%konsolosluk%' or title ilike '%consulate%' or title ilike '%başkonsolosluk%');

-- 2. Yayınla
update public.catalog_items
set verification_status = 'verified',
    status = 'published',
    updated_at = now()
where verification_status = 'pending_review'
  and (title ilike '%konsolosluk%' or title ilike '%consulate%' or title ilike '%başkonsolosluk%');

-- 3. Doğrulama
select count(*) as newly_published
from public.catalog_items
where status = 'published'
  and (title ilike '%konsolosluk%' or title ilike '%consulate%' or title ilike '%başkonsolosluk%');

commit;
