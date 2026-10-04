-- Command Center arşiv dalgası — C (kullanıcı kararı 04.10: "sinyalli 12 kalsın, 439 arşive").
--
-- Arşiv = `archived_at` damgası. SİLME DEĞİLDİR ve geri alınabilir:
--   · ana listeler `queries.ts` içinde `.is('archived_at', null)` ile süzüyor
--   · arşivlenenler ayrı listede görünüyor (`ArchivedItemsList.tsx`)
--   · geri alma: `update command_center_items set archived_at = null where id = ...`
--
-- ── NEDEN YAŞ DEĞİL SİNYAL ──────────────────────────────────────────────────
-- A+B dalgasının notu "aradaki bir değere indiren kesim YOK" diyordu. Bu doğru
-- ama EKSİK: orada yalnız YAŞ kesimleri denenmişti. Yaş gerçekten ayırmıyor
-- (en eski 2026-04-17, en yeni 2026-09-27; 90 günlük kesim 451'in 401'ini alır).
-- İLGİ ayırıyor ve çok keskin ayırıyor.
--
-- ── ÖLÇÜM (04.10 akşam, uygulamadan hemen önce) ─────────────────────────────
--   Kapsam: deleted_at null + archived_at null + status='Beklemede'
--           + item_type='meeting_note' ......................... 451
--     urgent ................................................... 0
--     due_date dolu ............................................ 0
--     "elle dokunulmuş" GÖRÜNEN (updated_at > created_at+1dk) ... 412
--       ↳ bunun 400'ü TEK BİR DAKİKADA: 2026-05-13 11:51 UTC
--         → toplu içe aktarma damgası, insan ilgisi DEĞİL
--     GERÇEKTEN tek tek dokunulmuş ............................. 12
--     hiç dokunulmamış ......................................... 39
--
-- 🔴 "412 kayıt işlenmiş" sinyali SAHTEDİR. Bu sayıya bakıp "çoğu üzerinde
--    çalışılmış" sonucuna varma — updated_at kümelenmesine bak.
--
-- ⚠️ `urgent` ve tarihli kayıtların HEPSİ bu 451'in DIŞINDA (todo tarafında ve
--    diğer durumlarda). Bu dalga onlara dokunmaz; ölçütte yine de emniyet
--    kemeri olarak elenirler.
--
-- ⚠️ Kapsam YALNIZ meeting_note'tur. `Beklemede` + `todo` olan 10 kayıt
--    kapsam DIŞIDIR (karar 451 üzerineydi) — dokunulmaz.

begin;

create temp table c_oncesi on commit drop as
select count(*) as aktif_once
from command_center_items
where deleted_at is null and archived_at is null;

-- ── C · sinyalsiz bekleyen toplantı notları ─────────────────────────────────
update command_center_items
   set archived_at = now()
 where deleted_at is null
   and archived_at is null
   and item_type = 'meeting_note'
   and status = 'Beklemede'
   and not urgent
   and due_date is null
   -- tek tek dokunulmamış: ya hiç güncellenmemiş, ya da toplu damgayı taşıyor
   and not (
         updated_at > created_at + interval '1 minute'
     and date_trunc('minute', updated_at) <> timestamptz '2026-05-13 11:51:00+00'
   );

\echo ''
\echo '=== SONUC: ne kaldi (aktif) ==='
select coalesce(item_type,'TOPLAM') as tur, coalesce(status,'-') as durum, count(*)
from command_center_items
where deleted_at is null and archived_at is null
group by rollup(item_type, status)
order by 1,2;

\echo ''
\echo '=== Beklenen: 56 aktif (495 - 439) ==='
select (select aktif_once from c_oncesi) as once,
       (select count(*) from command_center_items
         where deleted_at is null and archived_at is null) as simdi,
       (select aktif_once from c_oncesi)
       - (select count(*) from command_center_items
           where deleted_at is null and archived_at is null) as arsivlenen;

\echo ''
\echo '=== Hayatta kalan 12 sinyalli kayit (hepsi gorunmeli) ==='
select left(title,60) as baslik, assignee
from command_center_items
where deleted_at is null and archived_at is null
  and item_type='meeting_note' and status='Beklemede'
order by created_at;

\echo ''
-- Kontrol BU KOŞUYA daraltılır: 04.10 öncesi elle arşivlenmiş kayıtların 12'si
-- urgent; tüm arşivli satırlara bakan bir sayım yanıltır (A+B dalgası dersi).
\echo '=== Guvenlik kontrolu: BU KOSUDA urgent/tarihli/Devam-eden arsivlendi mi (0 olmali) ==='
select count(*) as yanlis_arsivlenen
from command_center_items
where archived_at >= (select min(archived_at) from command_center_items
                      where archived_at > now() - interval '5 minutes')
  and (urgent or due_date is not null or status = 'Devam ediyor');

commit;