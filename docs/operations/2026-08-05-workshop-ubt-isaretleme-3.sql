-- Cadde workshop panosu — üçüncü işaretleme turu (05.08.2026, Batch 1)
--
-- NEDEN BU DOSYA VAR: ajan canlı veritabanına YAZAMIYOR (izin sınıflandırıcısı UPDATE'i
-- reddediyor). Aynı işi panelden elle de yapabilirsin: /admin/workshop/cadde.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez, dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-workshop-ubt-isaretleme-3.sql
--
-- Geri alma:
--   update public.workshop_items set ubt_done = false, ubt_done_at = null
--   where workshop_key = 'cadde' and item_no in (90, 133);
--
-- ÖNCEKİ TURLAR: -isaretleme.sql (28 madde) ve -isaretleme-2.sql (2 + 3 madde) çalıştırıldı.
-- Bu oturumda canlıdan ölçüldü: 133 madde, UBT 81 ✓, Burak 27 ✓ (ikisi de: 26).
--
-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 1 — ŞİMDİ İŞARETLENECEK (kanıt kodda, ölçüldü 05.08.2026)
--
--   m90  "Yeni yorumların sayfa tamamen yenilenmeden görünmesi performans
--        değerlendirmesinden sonra uygulanacak."
--        KANIT: src/lib/cadde-feed-polling.ts → caddeOpenCommentsPollInterval; F18
--        (commit ad57a96). Açık yorum paneli adaptif aralıkla (60sn → 2dk → 5dk) sessiz
--        refetch yapar, panel kapanınca query disabled olur. Sayfa yenilenmiyor.
--        NOT: madde "Park Edilen / Sonraki Faz" bölümünde duruyor ama iş yapılmış —
--        park kararı workshop gününde alınmıştı, sonra F18'de kapandı.
--
--   m133 "Ya solda filtrede şehir seçilince ya da feedin üzerinde şehir ülke
--        göstergesinin yanında dijital bir saat, gün içiyse güneşle battıysa ayla
--        beraber çıkabilir."
--        KANIT: src/components/cadde/CaddeLocalClock.tsx + src/lib/cadde-local-clock.ts
--        (bu oturumda yazıldı). Kapsam çiplerinin sağ ucunda, seçili filtre şehrinin —
--        yoksa profil şehrinin — yerel saati; 06:00-20:00 arası güneş, dışı ay ikonu.
--        Saat dilimi cadde_cities.timezone'dan gelir. Testler: 13 test, hepsi geçti.
--        ⚠️ KOD MAIN'DE AMA COOLIFY DEPLOY BEKLİYOR — pano "yapıldı" derken canlı
--        sitede henüz görünmüyor olabilir.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.workshop_items
set ubt_done = true,
    ubt_done_at = now()
where workshop_key = 'cadde'
  and deleted_at is null
  and ubt_done = false
  and item_no in (90, 133);

-- Beklenen: 2 satır → toplam 83/133. Farklıysa commit etmeden sebebini araştır.
select count(*) filter (where ubt_done) as ubt_isaretli,
       count(*)                        as toplam
from public.workshop_items
where workshop_key = 'cadde' and deleted_at is null;

commit;

-- ═════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 2 — İŞARETLENMİYOR. Karar ya da kayıt gerektiren maddeler.
-- Bunlar SQL değil, bilgi. Panoya elle dokunmadan önce oku.
--
--   m89  "Yeni paylaşımlar geldiğinde yalnızca ilgili feed alanının otomatik olarak
--        yenilenmesi sonraki fazda geliştirilecek."
--        DURUM: KARAR BEKLİYOR, işaretlenmedi. Altyapı var (cadde-feed-polling.ts,
--        caddeNewPostPollInterval) ama tasarım bilinçli olarak OTOMATİK YENİLEME yerine
--        "N yeni paylaşım — yenile" ÇİPİ seçti (spec §17.3: "stream yok"). Gerekçe:
--        kullanıcı okurken akışın altından içerik kaymasın.
--        SORU: çip bu maddeyi karşılıyor mu, yoksa gerçekten otomatik yenileme mi
--        isteniyor? Cevap "çip yeterli" ise madde işaretlenebilir.
--
--   m54, m55, m56  "Dünya saatleri kartı %15 büyütülecek / beş şehir / sağa taşınacak."
--        DURUM: panoda ÜÇÜ DE UBT+Burak ✓ ama TARİF ETTİKLERİ BİLEŞEN ARTIK YOK.
--        "Dünya saatleri" şeridi 04.08.2026'da commit 0ec5d9b ile TAMAMEN KALDIRILDI
--        (main'de). Yani pano, var olmayan bir şeyi "bitti" gösteriyor.
--        İşaretler KALDIRILMADI — o gün iş gerçekten yapılmıştı, sonra ürün kararıyla
--        geri alındı; işareti silmek de yanlış olurdu. Yerine geçen istek m133'tür
--        (yukarıda işaretleniyor). Bu not, ileride birinin var olmayan bir kadranı
--        aramasını engellemek içindir.
--
--   m100 "Görsel olarak hazırlanan reklam alanının teknik altyapısı için ayrı bir
--        görev oluşturulacak."
--   m101 "Burak tarafından belirtilen şok veya pano formatı ayrı bir geliştirme
--        maddesi olarak eklenecek."
--        DURUM: bunlar META maddedir — istenen şey "görev açmak", kod yazmak değil.
--        Panoya yeni madde eklenince (panelden, WS3 olarak) ikisi de kapanır.
--        Kod işi sanılıp batch'e alınmamalı.
-- ═════════════════════════════════════════════════════════════════════════════
