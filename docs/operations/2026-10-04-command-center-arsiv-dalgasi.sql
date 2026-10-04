-- Command Center arşiv dalgası — A + B (kullanıcı kararı: seçenek C'nin alt kümesi).
--
-- Arşiv = `archived_at` damgası. SİLME DEĞİLDİR ve geri alınabilir:
--   · ana listeler `queries.ts` içinde `.is('archived_at', null)` ile süzüyor
--   · arşivlenenler ayrı listede görünüyor (`ArchivedItemsList.tsx`)
--   · geri alma: `update command_center_items set archived_at = null where id = ...`
--
-- 🔴 ÖN KOŞUL YAPILDI: `docs/commandcenter/` altındaki 18 yerel MD dosyası
--    (313 adet `[Denetim 28.09]` notu) gitignore'da ve export yeniden
--    üretilirse SİLİNİR. Yedek alındı ve doğrulandı:
--    c:/tmp/corteqs-commandcenter-yedek-2026-10-03 (18 dosya · 313 not)
--
-- ── ÖLÇÜM (04.10, uygulamadan hemen önce) ───────────────────────────────────
--   Aktif (deleted_at null + archived_at null): 1635
--     A · meeting_note + Baslanmadi ............ 822
--     B · Tamamlandi (tüm türler) .............. 329
--     Beklemede (tüm türler) ................... 461
--     Devam ediyor ............................. 14
--     todo + Baslanmadi ........................ 9
--   Zaten arşivli: 18
--
-- ⚠️ PLANDAKİ "~150-200 kalır" TAHMİNİ VERİYLE UYUŞMUYOR — ölçüldü:
--    A+B ................................... 484 kalır
--    A+B + plandaki C kuralı (KARAR'lı/süresi geçmiş, ~63 kayıt) ... ~421 kalır
--    A+B + TÜM Beklemede ................... 33 kalır
--    Aradaki bir değere indiren yaş kesimi YOK: en yeni Beklemede kaydı
--    2026-09-27, en eskisi 2026-04-17; 90 günlük kesim bile 451'in 401'ini alır.
--    Bu yüzden bu betik YALNIZ A+B uygular; `Beklemede` kuyruğunun ne olacağı
--    ayrı bir karardır (kullanıcıya soruldu).
--
-- ⚠️ `urgent` kayıtlar ve `Devam ediyor` DOKUNULMAZ — bunlar açık iştir.

begin;

create temp table arsiv_oncesi on commit drop as
select status, item_type, count(*) as adet
from command_center_items
where deleted_at is null and archived_at is null
group by 1,2;

-- ── A · başlanmamış toplantı notları ────────────────────────────────────────
update command_center_items
   set archived_at = now()
 where deleted_at is null
   and archived_at is null
   and item_type = 'meeting_note'
   and status = 'Baslanmadi'
   and not urgent;

-- ── B · tamamlanmış kayıtlar (tüm türler) ───────────────────────────────────
update command_center_items
   set archived_at = now()
 where deleted_at is null
   and archived_at is null
   and status = 'Tamamlandi'
   and not urgent;

\echo ''
\echo '=== SONUC: ne kaldi (aktif) ==='
select coalesce(item_type,'TOPLAM') as tur, coalesce(status,'-') as durum, count(*)
from command_center_items
where deleted_at is null and archived_at is null
group by rollup(item_type, status)
order by 1,2;

\echo ''
\echo '=== Arsivlenen toplam ==='
select count(*) as arsivli_toplam from command_center_items where archived_at is not null;

\echo ''
-- ⚠️ Kontrol BU KOŞUYA daraltılmalı. Tüm arşivli satırlara bakan bir sayım
-- yanıltır: 04.10 öncesinde kullanıcının elle arşivlediği 18 kayıt var ve
-- bunların 12'si `urgent`. Provada tam bu oldu — "12 yanlış arşivlenen"
-- göründü, oysa bu koşunun dokunduğu urgent kayıt sayısı SIFIRDI.
\echo '=== Guvenlik kontrolu: BU KOSUDA urgent/Devam ediyor arsivlendi mi (0 olmali) ==='
select count(*) as yanlis_arsivlenen
from command_center_items
where archived_at >= (select min(archived_at) from command_center_items
                      where archived_at > now() - interval '5 minutes')
  and (urgent or status = 'Devam ediyor');

commit;
