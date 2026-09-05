-- Revizyon fb174151 ("Ülke ve Şehir Filtreleri fazla daralmış, ABD sadece Newyork
-- Şehri çıkıyor") — ölçüm notu. STATUS DEĞİŞTİRİLMEZ: bu bir ürün kararı.
--
-- Ölçüldü 2026-09-05 (canlı):
--   cadde_cities aktif satır          : 57
--   ABD'de Cadde şehri                : 2   (geo kataloğunda 13.715 şehir var)
--   İtalya / Hollanda / Polonya       : 1'er (geo'da 4.403 / 1.446 / 1.611)
--   Şehri dolu üye                    : 128
--   Şehri Cadde kataloğunda çözülen   : 112
--   Farklı şehir değeri 58, katalogda karşılığı olan 54
--
-- ŞİKÂYET TEKNİK OLARAK DOĞRU ama kök nedeni sanılan yer DEĞİL. Katalog "dar
-- seçilmiş" değil; ÜYE KONUMLARINDAN TÜREYEN bir katalog. `cadde_profile_city_sync`
-- trigger'ı bir üye şehrini kaydettiğinde `cadde_ensure_geo_city` ile şehri Cadde
-- kataloğuna ekliyor. ABD'de 2 şehir görünmesinin sebebi ABD'de 2 üye olması.
--
-- Dolayısıyla asıl soru ÜRÜN sorusudur:
--   (a) Filtre yalnız İÇERİK/ÜYE olan şehirleri mi göstersin (bugünkü davranış)?
--       Artısı: seçilen her şehir dolu bir akış verir, boş ekran olmaz.
--       Eksisi: kullanıcı "benim şehrim yok" diye düşünür, liste fakir görünür.
--   (b) Tüm geo şehirleri mi listelensin (76.990)?
--       Artısı: liste zengin görünür, kullanıcı kendi şehrini bulur.
--       Eksisi: seçimlerin ezici çoğunluğu BOŞ akış döner; ayrıca PostgREST 1000
--       satırda sessizce keser (CLAUDE.md "Değişmez sözleşmeler" md.5), yani liste
--       sunucu tarafı aramayla beslenmek zorundadır.
--   (c) Karma: arama kutusu geo'dan besleniyor, sonuç sayısı sıfırsa "bu şehirde
--       henüz üye yok, ilk sen ol" mesajı gösteriliyor.
--
-- Öneri: (c). Kullanıcının şehrini bulmasını engellemez, boş akışı da açıklar.
-- Uygulama maliyeti: arama RPC'si + filtre bileşeni; yaklaşık yarım gün.
--
-- BU DOSYA YALNIZ NOT DÜŞER. Karar verilene kadar davranış değişmez.

update public.revision_requests
set detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 ölçüm notu] Katalog dar seçilmiş değil, üye konumlarından türüyor: ' ||
      'cadde_profile_city_sync trigger''ı üye şehrini kaydedince şehri Cadde kataloğuna ekliyor. ' ||
      'ABD''de 2 şehir görünmesinin sebebi ABD''de 2 üye olması. Canlı ölçüm: 57 aktif Cadde şehri, ' ||
      '128 üyenin 112''sinin şehri çözülüyor. Karar gerekiyor: filtre yalnız içerik olan şehirleri mi ' ||
      'göstersin (bugünkü davranış, boş akış olmaz) yoksa tüm geo şehirleri mi (76.990 satır, ' ||
      'çoğu boş akış döner ve PostgREST 1000''de sessizce keser)? Önerilen orta yol: arama geo''dan ' ||
      'beslensin, sonuç boşsa "bu şehirde henüz üye yok, ilk sen ol" densin. Ayrıntı: ' ||
      'docs/operations/2026-09-05-cadde-sehir-filtresi-olcum-notu.sql',
    updated_at = now()
where id = 'fb174151-55fc-4daa-b177-a92af0c8db85';

-- Doğrulama: not eklendi mi, status DEĞİŞMEDİ mi (inceleniyor kalmalı).
select id, status, right(detail, 120) as son_not
from public.revision_requests
where id = 'fb174151-55fc-4daa-b177-a92af0c8db85';
