-- 🔴 CANLI VERİ SIZINTISI KAPATILDI — `_submission_backfill_log_20260609`.
--
-- ── BULGU (04.10, anonim HTTP ile DOĞRULANDI) ───────────────────────────────
-- Tablo RLS'siz duruyordu ve `anon` rolünün SELECT/INSERT/UPDATE/DELETE
-- yetkisi vardı. PostgREST `public` şemasını dışarı açtığı için tablo,
-- her sayfanın `env-config.js`'inde bulunan anon anahtarıyla okunabiliyordu.
--
-- Kanıt (uygulamadan önce, gerçek istek):
--   GET /rest/v1/_submission_backfill_log_20260609?select=user_id,attribute_key,detail
--   → HTTP 200 · `Content-Range: 0-937/938` (938 satırın TAMAMI)
--   → gövde: {"user_id":"1145acdc-…","detail":{"email":"16315551181@wa.local"}}
--
-- Sızan veri: **938 satır** üye `user_id`'si + `detail` içindeki e-posta.
-- ⚠️ O e-postalar WhatsApp bot kayıtlarından gelir (`<telefon>@wa.local`),
--    yani pratikte **telefon numarası** taşırlar. Kişisel veridir.
-- Ayrıca `anon` YAZABİLİYORDU da (insert/update/delete) — yani kayıtlar
-- silinebilir veya uydurma satır eklenebilirdi.
--
-- ── NEDEN GÖZDEN KAÇTI ──────────────────────────────────────────────────────
-- Tablo 2026-06-09 üye backfill'inin tek seferlik DENETİM GÜNLÜĞÜ'dür
-- (`supabase/manual/2026-06-09_backfill_member_attributes_from_submissions.sql`).
-- Geçici bir iş ürünü olarak yaratıldı, RLS hiç açılmadı ve kimse
-- "geçici tablo da PostgREST'ten görünür" diye düşünmedi.
-- Çalışma zamanı kodunda SIFIR referansı var (yalnız üretilmiş `types.ts`,
-- baseline dump ve o manuel betik anıyor) — yani kapatmak hiçbir şeyi bozmaz.
--
-- ── YAPILAN ─────────────────────────────────────────────────────────────────
-- Tablo SİLİNMEZ (bir göçün denetim izidir, "migration'ı neden böyle" sorusunun
-- cevabı burada). Erişim service_role'e indirilir:
--   · RLS açılır ve HİÇ POLİTİKA EKLENMEZ → anon/authenticated için tam kapalı
--   · anon ve authenticated grant'ları çekilir (ikinci savunma: RLS bir gün
--     yanlışlıkla kapatılsa bile yetki yok)
-- service_role RLS'i atlar, yani bakım erişimi korunur.

alter table public._submission_backfill_log_20260609 enable row level security;

-- ⚠️ Politika EKLENMİYOR. RLS açık + politika yok = deny-all. Bu bilinçlidir:
--    bu tabloyu okuması gereken bir kullanıcı yüzeyi YOKTUR.

revoke all on table public._submission_backfill_log_20260609 from anon;
revoke all on table public._submission_backfill_log_20260609 from authenticated;
revoke all on table public._submission_backfill_log_20260609 from public;

comment on table public._submission_backfill_log_20260609 is
  '2026-06-09 üye attribute backfill denetim günlüğü (938 satır). '
  '04.10.2026: RLS''siz ve anon''a açık olduğu, 938 satırın tamamının anonim '
  'HTTP ile okunabildiği ölçüldü (user_id + wa.local e-postaları = telefon). '
  'Kapatıldı: RLS açık + politika YOK + anon/authenticated grant''ları çekildi. '
  'Yalnız service_role erişir. Silme — bir göçün denetim izidir.';
