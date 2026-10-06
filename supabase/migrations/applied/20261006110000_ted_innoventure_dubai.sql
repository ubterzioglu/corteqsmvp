-- TED InnoVenture konumu: Global → Dubai (6 Ekim 2026, Soru 10).
-- 20261005190000 canlıda 'Global' yazmıştı; o dosya değişmez, düzeltme yeni migration.

begin;

update public.catalog_items
set city = 'Dubai'
where title ilike '%TED InnoVenture%'
  and city = 'Global';

commit;
