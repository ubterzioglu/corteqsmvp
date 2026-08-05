-- Cadde workshop panosu — ikinci işaretleme turu (05.08.2026)
--
-- NEDEN BU DOSYA VAR: ajan canlı veritabanına YAZAMIYOR (izin sınıflandırıcısı hem
-- psql UPDATE'ini hem PostgREST PATCH'ini reddediyor). Aynı işi panelden elle de
-- yapabilirsin: /admin/workshop/cadde → ilgili maddenin UBT kutusu.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez, dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-workshop-ubt-isaretleme-2.sql
--
-- Geri alma:
--   update public.workshop_items set ubt_done = false, ubt_done_at = null
--   where workshop_key = 'cadde' and item_no in (71, 75);
--
-- ÖNCEKİ TUR: 2026-08-05-workshop-ubt-isaretleme.sql (28 madde) ÇALIŞTIRILDI —
-- canlıdan doğrulandı, pano 76/133 işaretli. Bu dosya onun üzerine ekler.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- BÖLÜM 1 — ŞİMDİ İŞARETLENECEK (kanıt canlıda, ölçüldü 05.08.2026)
--
--   m71  "Kullanıcı tarafından yapılan paylaşım, profilinde kayıtlı olan ülkenin
--        akışında gösterilecek."
--        KANIT: migration 20260805130000_cadde_post_target_fold.sql canlı
--        schema_migrations'ta KAYITLI. create_cadde_post_v2'nin ülke/şehir join'leri
--        cadde_fold_text karşılaştırmasına çevrildi; profildeki 'Türkiye' artık
--        katalogdaki 'Turkiye' ile eşleşiyor. Sözleşme testi:
--        src/lib/cadde-post-target-fold.test.ts.
--        ÖLÇÜM: paylaşabilen üye 42 → 83 (fold) → 104 (20260805140000 veri onarımı).
--        NOT: bu madde 4 Ağustos turunda BİLİNÇLİ olarak dışarıda bırakılmıştı —
--        o gün ölçüm 38 üyenin hiç paylaşım yapamadığını göstermişti. Artık kapandı.
--
--   m75  "Cadde üzerinde görülen 'Paylaşım gönderilemedi' hatası çözülecek."
--        KANIT: üç parçanın üçü de canlıda.
--          1) 1cd7ef8 — hata mesajı haritası üretimde HİÇ çalışmıyormuş
--             (supabase-js'in PostgrestError'ı Error örneği değil düz nesnedir;
--             `error instanceof Error` kontrolü 51 Türkçe mesajın tamamını ölü
--             bırakıyordu). extractErrorText ile düzeltildi, deploy edilmiş.
--          2) 20260805130000 — fold eşleşmesi (yukarıda).
--          3) 20260805140000 — profil konum verisi onarımı (4 ülke + 4 şehir
--             eklendi, 21 ülke + 3 şehir değeri düzeltildi).
--        DEPLOY DOĞRULAMASI: canlı CaddePage chunk'ında session5 ızgarası
--        (minmax(0,1fr)_320px) var, eskisi (290px_minmax) yok; index.html
--        Last-Modified 13:12, son kod commit'i 390f137 13:11 → deploy yapılmış.
--
-- BİLİNÇLİ OLARAK DIŞARIDA BIRAKILANLAR — kanıt yok, tahmin edilmiyor:
--   m70  kafe ülke/şehir filtresinin yeniden tasarımı — session5 sol kolon
--        kartlarını başlık altına taşıdı ama kafe filtresi ayrı bir iş.
--   m76  "farklı kullanıcılarla tekrar test edilecek" — QA turu yapılmadı.
--   m77  filtrelerin profil veritabanından beslenmesi — geo köprüsü kısmi
--        (20260805120000), profil formu hâlâ serbest metin.
--   m72, m78, m79 — aşağıdaki BÖLÜM 2'ye bak (önce SQL'leri çalıştır).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

update public.workshop_items
set ubt_done = true,
    ubt_done_at = now()
where workshop_key = 'cadde'
  and deleted_at is null
  and ubt_done = false
  and item_no in (71, 75);

-- Beklenen: 2 satır → toplam 78/133. Farklıysa commit etmeden sebebini araştır.
select count(*) filter (where ubt_done) as ubt_isaretli,
       count(*)                        as toplam
from public.workshop_items
where workshop_key = 'cadde' and deleted_at is null;

commit;

-- ═════════════════════════════════════════════════════════════════════════════
-- BÖLÜM 2 — HENÜZ ÇALIŞTIRMA. Önce ilgili SQL'i uygula, sonra bu bloğu aç.
--
-- Bu üç madde kodda/dosyada hazır ama canlı veritabanına HENÜZ yazılmadı.
-- İşaretlemek, yapılmamış işi yapılmış göstermek olur.
--
--   m72  "Kullanıcının ülkesinde yayınlanan paylaşım şimdilik global akışta da
--        gösterilecek."
--        ÖNKOŞUL: docs/operations/2026-08-05-cadde-acilis-duzeltme.sql
--        Şu an 4 aktif ülke hiçbir global post tarafından hedeflenmiyor
--        (22 ülke, 82 hedef satırı) ve 6 üye boş akış görüyor. Script bunu kapatır.
--        Sonrasında doğrula: hedeflenmemiş ülke = 0, boş akış gören = 0.
--
--   m78  "Yanlış ülkelere bağlı görünen şehirler doğru ülkelerle eşleştirilecek."
--   m79  "Şehir isimlerindeki büyük ve küçük harf problemleri düzeltilecek."
--        ÖNKOŞUL: supabase/migrations/20260804190000_cadde_geo_data_cleanup.sql
--        (4 Ağustos'ta yazıldı, 5 Ağustos'ta REVİZE EDİLDİ — mükerrer Roma).
--        Sonrasında doğrula: küçük harfle başlayan şehir = 0, fold bazlı mükerrer
--        şehir = 0, Roma → İtalya, Vancouver → Kanada.
--
-- ÖNKOŞULLAR KARŞILANDIKTAN SONRA aşağıdaki bloğun yorumunu kaldır:
--
-- begin;
-- update public.workshop_items
-- set ubt_done = true, ubt_done_at = now()
-- where workshop_key = 'cadde' and deleted_at is null and ubt_done = false
--   and item_no in (72, 78, 79);
-- -- Beklenen: 3 satır → toplam 81/133.
-- select count(*) filter (where ubt_done) as ubt_isaretli, count(*) as toplam
-- from public.workshop_items where workshop_key = 'cadde' and deleted_at is null;
-- commit;
-- ═════════════════════════════════════════════════════════════════════════════
