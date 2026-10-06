-- outbox event_type CHECK onarımı: weekly_city_digest geri eklendi
--
-- SORUN: 20261005100500_event_published_notification (A15) CHECK'i DROP edip yeniden kurarken
-- eski bir listeden yola çıktı ve 20261004120000_user_city_follows'un eklediği
-- `weekly_city_digest`'i listeye KOYMADI. A15 canlıya uygulandıysa haftalık şehir özeti
-- satırı yazılırken 23514 (check_violation) alınır ve mail sessizce gitmez; edge tarafı
-- (send-notification-emails knownEventTypes) bu tipi biliyor. Aynası:
-- supabase/functions/_shared/emails/weekly-city-digest.test.ts "F13".
--
-- ÇÖZÜM: constraint'i, edge'in bildiği tipler kümesiyle BİREBİR aynı listeyle yeniden kur.
-- İdempotent: constraint zaten tam listeyle varsa aynı listeyle yeniden kurulur, veri etkilenmez
-- (CHECK mevcut satırları doğrular; hiçbir mevcut satır bu 20 değerin dışında olamaz).
--
-- GERİ ALMA: aynı drop + A15'in 19 değerlik listesiyle add constraint.
-- ⚠️ Bu dosya YAZILDI, UYGULANMADI. Uygulamadan önce canlıda ölç:
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'notification_email_outbox_event_type_check';
-- Sonra ledger satırını elle ekle (psql -f ledger yazmaz) ve `npm run check:migrations`.

begin;

do $$
declare
  v_conname text;
begin
  select con.conname into v_conname
  from pg_constraint con
  where con.conrelid = 'public.notification_email_outbox'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%event_type%';
  if v_conname is null then
    raise exception 'notification_email_outbox event_type CHECK bulunamadi';
  end if;
  execute format('alter table public.notification_email_outbox drop constraint %I', v_conname);
end $$;

alter table public.notification_email_outbox
  add constraint notification_email_outbox_event_type_check
  check (event_type = any (array[
    'new_member','admin_update','member_welcome','revision_request',
    'revision_request_completed','relocation_tool_report','relocation_tool_abandonment',
    'radar_scan_digest','career_application','group_submission_received','group_published',
    'group_rejected','group_ownership_verified','group_post_pending','group_link_dead',
    'group_score_badge','group_strike_warning',
    'recommendation_match',
    'event_published',      -- A15 (20261005100500)
    'weekly_city_digest'    -- 20261004120000; A15 yeniden kurarken düşürmüştü
  ]::text[]));

commit;
