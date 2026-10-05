-- A1.5 · Bekleyen etkinlikleri toplu yayınlama (operasyon SQL'i)
--
-- Kaynak: docs/plans/2026-10-05-birlesik-uygulama-plani.md A1.5
-- Migration'dan çıkarıldı (…900000_events_auto_approval.sql §3).
--
-- ⚠️ ÇALIŞTIRMA (§B8): Önce sayım sonucunu gör, çok çıkarsa karar al.
--
-- Geri alma: update events set status='pending' where approval_source='backfill_auto';
--
-- T1 koruyucusu: events tablosunda doğrudan INSERT RLS ile engelli (T1).
-- A15 tetikleyicisi: trg_events_after_publish, approval_source='backfill_auto'
-- olan etkinlikler için enqueue YAPMAZ (mail gitmez).

begin;

-- ── 1. Sayım (önce bunu çalıştır, sonucu gör) ────────────────────────────────
select count(*) as pending_count
from public.events
where status = 'pending';

-- ── 2. Yayınlama (sayım sonucunu onayladıktan sonra) ─────────────────────────
-- approval_source='backfill_auto' → A15 tetikleyicisi mail YAZMAZ.
update public.events
set status = 'published', approval_source = 'backfill_auto'
where status = 'pending';

-- ── 3. Doğrulama ─────────────────────────────────────────────────────────────
select
  count(*) as newly_published,
  count(*) filter (where approval_source = 'backfill_auto') as backfill_count
from public.events
where approval_source = 'backfill_auto';

commit;

-- ── Geri alma (gerekirse) ─────────────────────────────────────────────────────
-- begin;
-- update public.events
-- set status = 'pending', approval_source = null
-- where approval_source = 'backfill_auto';
-- commit;
