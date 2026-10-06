-- AI Legion kategorisini hobi-kultur olarak işaretle.
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §3 (Soru 5)
--
-- AI Legion için catalog_item_tags tablosuna hobi-kultur tag'i ekle.
-- 3 kayıt var: person_profile, community_group, member.

begin;

-- AI Legion kayıtlarını bul
with ai_legion_items as (
  select id from catalog_items
  where title ilike '%AI Legion%'
)

-- hobi-kultur tag'i ekle (varsa atla)
insert into public.catalog_item_tags (item_id, tag_slug, tag_label)
select
  id,
  'hobi-kultur',
  'Hobi & Kültür'
from ai_legion_items
on conflict (item_id, tag_slug) do nothing;

commit;
