-- Cadde açılış içeriği — yerleşim değişince yanlışlanan iki cümlenin düzeltmesi (05.08.2026)
--
-- NEDEN: 05.08.2026'da Konum / Aktif Cafeler / İnsanları Keşfet kartları SOL kolondan
-- SAĞ kolona alındı (commit f54dfba). Sabitlenmiş açılış paylaşımları hâlâ "sol kolondaki"
-- diyor; kullanıcıya var olmayan bir yeri tarif ediyorlar.
--
-- İki cümle etkileniyor:
--   1) "Cadde açıldı"          → 'sol kolondaki "Ülke ve Şehir" kutusundan'
--   2) "Köprü modu ne işe yarar" → 'Sol kolondaki anahtarla'
--
-- Yeni metinler YÖN BELİRTMİYOR ("Konum" kartındaki …). Bu bilinçli: yerleşim bugün üç kez
-- değişti, yön veren her metin bir sonraki değişiklikte yine bayatlar. Kartın ADI sabit.
--
-- Kaynak dosya (repo) aynı düzeltmeyle güncellendi:
--   docs/operations/2026-08-05-cadde-acilis.sql  (satır 107 ve 115)
-- Bu dosya YALNIZ canlıdaki mevcut satırları düzeltir; yeniden seed gerekmez.
--
-- NEDEN AYRI DOSYA: ajan canlı veritabanına YAZAMIYOR (izin sınıflandırıcısı UPDATE'i
-- reddediyor). Çalıştırmak kullanıcıdadır.
--
-- Çalıştırma (Türkçe karakter komut satırından geçmez — dosyadan okut):
--   psql "$CONN" -v ON_ERROR_STOP=1 -f docs/operations/2026-08-05-cadde-acilis-metin-duzeltme.sql
--
-- Geri alma: replace'i ters yönde çalıştır (aşağıdaki iki UPDATE'in arg sırasını değiştir).
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- İdempotent: eşleşme yoksa 0 satır günceller, ikinci çalıştırma zarar vermez.
update public.cadde_posts
set body = replace(
      body,
      'sol kolondaki "Ülke ve Şehir" kutusundan',
      '"Konum" kartındaki Ülke ve Şehir seçiminden'
    )
where body like '%sol kolondaki "Ülke ve Şehir" kutusundan%';

update public.cadde_posts
set body = replace(
      body,
      'Sol kolondaki anahtarla',
      '"Konum" kartındaki anahtarla'
    )
where body like '%Sol kolondaki anahtarla%';

-- Doğrulama: beklenen 0. Sıfır değilse başka bir paylaşımda daha yön referansı var demektir;
-- commit etmeden metni bul ve bu dosyaya üçüncü bir UPDATE ekle.
select count(*) as kalan_yon_referansi,
       coalesce(string_agg(left(title, 40), ' | '), '-') as etkilenen_basliklar
from public.cadde_posts
where body ilike '%sol kolondaki%' or body ilike '%soldaki%';

commit;
