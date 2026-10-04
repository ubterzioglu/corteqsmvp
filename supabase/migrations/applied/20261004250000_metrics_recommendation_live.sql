-- Faz 6 takip · metrics_recommendation_response_rate + content_created.tavsiye
-- M17/M18 verisine BAĞLANIYOR (M14 placeholder'ları canlı veriyle değişiyor).
--
-- ═══ NEDEN ŞİMDİ ═══
-- M14 bu iki noktayı BİLEREK placeholder bıraktı ("M17 öncesi boş dönebilir —
-- normal"): response_rate available=false/0 · content_created.recommendations_total=0.
-- Faz 2 (M17 tablolar + M18 eşleştirme + M19-M23) CANLIDA tamamlandı; bütünlük
-- süpürmesi (04.10) placeholder'ın bayatladığını ÖLÇTÜ (M16 doğrulama satırı
-- "tavsiye tablosu YOK" ön koşulu artık yanlış). Bu migration Faz 6'nın plan
-- ertelemesini kapatır: metrikler gerçek recommendation_requests/answers verisi.
--
-- ═══ KURALLAR (M14 ile birebir korunur) ═══
--   • MATERIALIZED DEĞİL (relkind='v') · guard `where is_admin(auth.uid())`
--     PARAMETRELİ · anon grant YOK (create or replace grant'ları KORUR).
--   • Kolon ad/tip/sıra BİREBİR (create or replace kısıtı): total/responded
--     ::integer (count bigint döner!), response_rate numeric, note text.
--   • "Yanıtlanan" tanımı: EN AZ BİR yanıtı olan talep (EXISTS) — status
--     'answered'a eşlenir ama closed-a-dönmüş taleplerde de doğruluğunu korur.
--   • Cohort boşsa rate NULL (uydurma yüzde yok — M14 kuralı aynen).
--   • 🔴 Metrik YALNIZ SAYI döner — talep/yanıt İÇERİĞİ (body/iletişim) view'a
--     girmez (panel metrik yüzeyi, içerik yüzeyi değil).

begin;

-- ── 1) Tavsiye yanıt oranı — GERÇEK veri ────────────────────────────────────
create or replace view public.metrics_recommendation_response_rate as
select
  true as available,
  (select count(*) from public.recommendation_requests)::integer as total,
  (select count(*) from public.recommendation_requests rq
    where exists (select 1 from public.recommendation_answers a
                   where a.request_id = rq.id))::integer as responded,
  case
    when (select count(*) from public.recommendation_requests) = 0 then null::numeric
    else round(
      (select count(*) from public.recommendation_requests rq
        where exists (select 1 from public.recommendation_answers a
                       where a.request_id = rq.id))::numeric
      / (select count(*) from public.recommendation_requests), 4)
  end as response_rate,
  null::text as note
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_recommendation_response_rate is
  'Faz 6 traction (M14, Faz 2 sonrası CANLIYA BAĞLANDI): yanıtlanan/toplam '
  'tavsiye talebi (yanıtlanan = en az bir recommendation_answers satırı olan '
  'talep). Talep yoksa rate NULL. Yalnız SAYI döner — içerik/iletişim yok. '
  'admin-only (is_admin guard) · MATERIALIZED DEGIL · anon grant YOK.';

-- ── 2) content_created.recommendations_total — 0 placeholder → gerçek sayı ──
-- Kolon şekli/tipleri M14 ile BİREBİR (yalnız recommendations_total dolar).
create or replace view public.metrics_content_created as
select
  (select count(*) from public.events
     where created_at >= now() - interval '7 days') as events_7d,
  (select count(*) from public.events) as events_total,
  (select count(*) from public.cadde_posts
     where created_at >= now() - interval '7 days') as cadde_posts_7d,
  (select count(*) from public.cadde_posts) as cadde_posts_total,
  (select count(*) from public.carsi_items
     where created_at >= now() - interval '7 days') as carsi_items_7d,
  (select count(*) from public.carsi_items) as carsi_items_total,
  (select count(*) from public.whatsapp_landings
     where created_at >= now() - interval '7 days') as groups_7d,
  (select count(*) from public.whatsapp_landings) as groups_total,
  (select count(*) from public.group_posts
     where created_at >= now() - interval '7 days') as group_posts_7d,
  (select count(*) from public.group_posts) as group_posts_total,
  (select count(*) from public.recommendation_requests)::integer as recommendations_total,
  7 as window_days
from (select 1) dummy
where public.is_admin(auth.uid());

comment on view public.metrics_content_created is
  'Faz 6 traction (M14): haftalık + toplam içerik (etkinlik/cadde/çarşı/grup/grup '
  'gönderisi/tavsiye). recommendations_total Faz 2 sonrası GERÇEK sayı (M14''te '
  'placeholder 0''dı). admin-only · MATERIALIZED DEGIL · anon grant YOK.';

commit;
