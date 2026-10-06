-- TED InnoVenture konumunu Global olarak ayarla.
--
-- Kaynak: docs/plans/qwen-sirali/01-tek-plan-kalan-isler.md §3 (Soru 5)
-- ⚠️ Canlıda uygulandı. 6 Ekim 2026'da karar Dubai'ye döndü:
-- bkz. 20261006110000_ted_innoventure_dubai.sql (bu dosya DEĞİŞMEZ).
--
-- TED InnoVenture bir community_group, şu anda city boş.
-- city='Global' olarak güncelle.

begin;

update public.catalog_items
set city = 'Global'
where title ilike '%TED InnoVenture%'
  and city is null;

commit;
