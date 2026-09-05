-- Revizyon 9f1d416f ("Radardaki itemlara biraz daha uzun metinler koysak derim.
-- Şu an çok mock/hazırlanılmamış gibi duruyor") — ölçüm notu.
-- STATUS DEĞİŞTİRİLMEZ: bu bir İÇERİK işi, kod işi değil.
--
-- Ölçüldü 2026-09-05 (canlı, marquee_items):
--   toplam kayıt                        : 9
--   özeti boş                           : 0
--   yedek cümleye düşen                 : 0   ("Harici haber akışından ... aktarıldı.")
--   80 karakterden kısa özet            : 7
--   200 karakterden uzun özet           : 0
--   ortalama özet uzunluğu              : 70 karakter
--
-- Şikâyet HAKLI ama teşhis edilen kök neden yanlış olurdu: özetler yedek cümleye
-- DÜŞMÜYOR (0 kayıt) ve boş DEĞİL (0 kayıt). Metinler gerçek, sadece kısa — ortalama
-- 70 karakter, en uzunu 105. Ayrıca akışta toplam 9 kayıt var; "mock gibi" hissinin
-- yarısı metin kısalığından, yarısı KAYIT AZLIĞINDAN geliyor.
--
-- Dolayısıyla kod tarafında yapılacak iş YOK:
--   * Metinler /admin/marquee ekranından koda dokunmadan uzatılabilir.
--   * `buildNewsPostSummary` yedek zinciri (kaynak • kategori • şehir, ülke →
--     "Harici haber akışından CorteQS radarına aktarıldı.") bugün hiç tetiklenmiyor.
--   * Kart yüksekliği sabittir (h-[420px]); kısa metinle altta boşluk kalır. Metinler
--     uzayınca bu kendiliğinden düzelir. Metin uzamayacaksa kart yüksekliği içeriğe
--     göre esnetilmeli — ama önce içerik kararı verilmeli, tersi değil.
--
-- Öneri: 9 kaydın özetlerini 150-250 karakter aralığına çıkar ve kayıt sayısını
-- artır. İkisi de admin panelinden yapılır.

update public.revision_requests
set detail = coalesce(detail || E'\n\n', '') ||
      '[05.09.2026 ölçüm notu] Kod işi YOK, içerik işi. Canlı ölçüm: 9 kayıt, özeti boş olan 0, ' ||
      'yedek cümleye düşen 0, ortalama özet 70 karakter, 7 kayıt 80 karakterin altında, ' ||
      '200 karakterden uzun hiç yok. Yani metinler yedek zincirden gelmiyor, gerçek ama kısa. ' ||
      '"Mock gibi" hissinin diğer yarısı kayıt azlığı (9 haber). Metinler /admin/marquee ekranından ' ||
      'koda dokunmadan uzatılabilir; kart yüksekliği sabit (h-[420px]) olduğu için kısa metinde ' ||
      'altta boşluk kalıyor, metin uzayınca kendiliğinden düzelir. Ayrıntı: ' ||
      'docs/operations/2026-09-05-radar-icerik-olcum-notu.sql',
    updated_at = now()
where id = '9f1d416f-296c-4bbc-adc6-1cf24981d12e';

select id, status, right(detail, 110) as son_not
from public.revision_requests
where id = '9f1d416f-296c-4bbc-adc6-1cf24981d12e';
