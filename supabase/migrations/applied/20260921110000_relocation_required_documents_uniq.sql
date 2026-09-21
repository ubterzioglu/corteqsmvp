-- Relocation — gerekli belgeler tablosuna tekillik kısıtı.
--
-- NEDEN
-- `relocation_living_costs`'ta `relocation_living_costs_uniq` vardı ve seed
-- `on conflict` ile idempotent çalışıyordu. `relocation_required_documents`'ta
-- KARŞILIĞI YOKTU: seed ikinci kez koşulduğunda hata vermez, satırları SESSİZCE
-- ÇOĞALTIR ve kullanıcı "Gerekli Belgeler" sekmesinde aynı belgeyi iki kez görür.
-- Bu, bu depoda defalarca yaşanan "test yeşil, canlı yanlış" sınıfıdır.
--
-- Anahtar (country_code, doc_name): bir ülkede aynı adlı belge bir kez listelenir.
-- Kategori/not/sıra güncellenebilir alanlardır, anahtarın parçası DEĞİLDİR —
-- yoksa bir belgenin kategorisini düzeltmek kopya satır üretirdi.
--
-- Tablo bu migration yazıldığında 0 satırdır (ölçüldü 2026-09-21), dolayısıyla
-- indeks oluşturma çakışma riski taşımaz.

create unique index if not exists relocation_required_documents_uniq
  on public.relocation_required_documents (country_code, doc_name);

comment on index public.relocation_required_documents_uniq is
  'Seed idempotensi: aynı ülkede aynı belge adı bir kez. Seed dosyası bu indekse on conflict ile dayanır.';
