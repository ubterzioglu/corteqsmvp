# Kariyer Sayfası Yenilemesi — Uygulama Planı

> Tarih: 2026-09-30 · Durum: onaya sunuldu, uygulama başlamadı
>
> **Yürütme:** bu plan **KR01–KR10** batch'lerine bölündü — sıra, kapsam ve kabul
> kriterleri [`docs/kalanlar/KALANLAR.md`](../kalanlar/KALANLAR.md) master'ının
> **KR bölümünde**. Batch'e başlarken ayrıntı (bağlam, tuzak gerekçesi, ölçümler) için
> bu dosya okunur; neyin sırada olduğu master'dan öğrenilir.

## Bağlam — bu iş neden yapılıyor

Dışarıdan üç dosya geldi (`EKİP WEB SAYFASI 28 EYLÜL VERS/`, depo kökünde untracked):

| Dosya | İçerik |
| --- | --- |
| `kariyer (1).html` | 582 satır, tek dosya. 17 ilan + staj programı + kurucu mektupları + saat bandı + 3 dosyalı başvuru formu. Görseller base64 gömülü (246 KB). |
| `kariyer_supabase_setup.sql` | `career_applications` tablosu + RLS + `career-applications` private kova |
| `kariyer_BENIOKU.md` | Kurulum notu — "`public/kariyer.html` koy, route'u yönlendir" |

**Bu iş yeni sayfa değil, mevcut sayfanın yerine geçme işidir.** `/kariyer` zaten canlıda:

- `src/pages/Career.tsx` — 4 pozisyon, `InterestForm` ile başvuru
- `src/App.tsx:311` rota · `src/lib/page-seo.ts:63` `PAGE_SEO.career`
- `src/components/footerLinks.ts:22` menü bağlantısı
- `scripts/generate-sitemap.mjs` `STATIC_ROUTES` içinde `priority 0.4`

Bugünkü başvurular `interest_registrations` tablosuna + `interest-uploads` kovasına
gidiyor — ve **bu tablonun özel bir admin ekranı yok**, yalnız genel DB tablo
görüntüleyicisinden (`AdminDatabaseTablesPage`) bakılabiliyor. Yani gelen kariyer
başvuruları pratikte düzenli olarak kimse tarafından okunmuyor.

**Amaç:** sayfayı 17 ilanlık, gerçek bir başvuru hattı olan sürüme çıkarmak; başvuruları
kendi tablosunda toplamak ve admin panelinden yönetilebilir hâle getirmek.

## Onaylanan kararlar (30.09)

1. **Tasarım:** site tasarım sistemine uyarlanır (Inter / Space Grotesk, shadcn/ui,
   mevcut tema). Gelen dosyanın Bricolage Grotesque + Source Serif 4 + açık "kağıt"
   paleti KULLANILMAZ.
2. **İlan verisi:** ayrı statik `src/lib/careers/` modülü (17 ilan). Mevcut dahili
   `KADRO_ROLES` (52 rol) ile **birleştirilmez**.
3. **Kapsam:** public sayfa + form · admin ekranı · e-posta bildirimi · spam koruması —
   dördü de dahil.
4. **Veri yolu:** yeni `career_applications` tablosu, **security-definer RPC arkasında**
   (anon'a doğrudan INSERT yetkisi verilmez), ayrı `career-applications` private kovası.
5. **Eski 4 ilan korunur** — silinmez, yeni 17'nin altında ayrı bölümde, yanlarında
   "önceki dönem" ibaresiyle durur. Kaldırma kararı sonraya bırakıldı.

## Gelen dosyalardaki üç hata — düzeltilmeden kullanılamaz

1. **`kariyer_supabase_setup.sql` `public.has_role(auth.uid(), 'admin')` çağırıyor —
   bu projede `has_role` ARTIK YOK.** Yalnız `supabase/migrations/archive/` (baseline
   öncesi) dosyalarında geçiyor; canlı şemanın dökümü olan
   `supabase/baseline/2026-08-04-public-schema.sql` içinde **hiç yok**.
   Doğrusu **`public.is_admin(auth.uid())`** — ve dikkat, fonksiyon **`uid uuid`
   argümanı alır**, argümansız değildir (`baseline:10185`; kullanım:
   `src/lib/admin/admin-access-api.ts:13` → `rpc("is_admin", { uid })`).
   SQL olduğu gibi çalıştırılırsa `function has_role does not exist` ile düşer.
2. **BENIOKU'nun "`public/kariyer.html` koy" önerisi canlıda ÇALIŞMAZ.** Dosya
   `<script src="https://cdn.jsdelivr.net/...supabase-js">` yüklüyor;
   `nginx.conf.template` içindeki CSP `script-src` listesinde jsdelivr YOK → tarayıcı
   script'i bloklar, form sessizce ölür. Ayrıca `/kariyer` zaten bir SPA rotası.
   Sayfa React'e taşınmak zorundadır.
3. **Anon doğrudan INSERT + anon storage upload** açık uçtur (hız sınırı yok).
   RPC arkasına alınır.

## Yeniden kullanılacak mevcut kod — yeniden yazma

| Ne | Nerede |
| --- | --- |
| CV / sunum dosya doğrulama | `src/lib/security.ts:56-68` — `validateCvFile`, `validatePresentationFile`, `validateFile(file, {allowedExtensions, maxSize})` |
| Depolama anahtarı güvenliği | `src/lib/security.ts:104` — `safeStorageFileName` (path traversal + görünmez karakter koruması) |
| Dosya eki sözleşme testi | `src/lib/service-attachment-security.test.ts` — `accept=` ↔ doğrulama hizası, ham `file.name` yasağı |
| SEO | `useSeo(PAGE_SEO.career, deps)` — `PAGE_SEO.career` zaten tanımlı |
| API katmanı deseni | `src/lib/muhasebe-api.ts` + `muhasebe-schemas.ts` · daha yakın örnek: `src/lib/interest-registrations-api.ts` |
| Türkçe metin | `src/lib/text-normalization.ts` — `trIncludes`, `trUpper`/`trLower` |
| Admin rota modülü | `src/pages/admin/kadro/routes.tsx` |
| Hız sınırlı anon RPC deseni | `report_client_error` RPC'si |

## İki ilan sistemi bilinçli olarak ayrıdır — birleştirme

| | `src/lib/kadro/` (mevcut) | `src/lib/careers/` (yeni) |
| --- | --- | --- |
| Kitle | Yalnız admin | Herkese açık |
| Kapsam | 52 dahili rol (`pz-ig`, `tk-frontend`, `cg-dach` …) | 17 pazarlama ilanı + staj |
| Amaç | Durum/öncelik/aday takibi, ilan metni kopyalama | Başvuru toplama |
| Ekran | `/admin/kadro/*` | `/kariyer` |

Aynı rolü iki yerde temsil ediyor olmaları **beklenen** durumdur. `KADRO_ROLES`'a
İngilizce başlık/rozet/pazarlama intro'su eklemek 52 rolün tipini kirletir;
`careers-data.ts`'i 52'ye çıkarmak public sayfayı dahili operasyon diliyle doldurur.
**Bu ayrım `careers-data.ts` başına yorum olarak yazılır** ki sonraki oturum "kopya veri"
sanıp birleştirmeye kalkmasın.

## Tablo seçiminin gerekçesi

Repoda `job_listings` / `job_applications` tabloları var ama bunlar **işletmelerin ücretli
ilan satın aldığı** ayrı bir ürün (`package`, `total_price`, `currency`, zorunlu
`applicant_id` = giriş yapmış kullanıcı). Anonim kariyer başvurusu için uygun değil;
ayrıca `job_posting_details` canlıda 0 satır — ürün uykuda.

`interest_registrations`'ı genişletmek de elendi: tablo iki farklı işi (genel ilgi kaydı +
iş başvurusu) taşır, eklenen sütunların çoğu bir tarafta hep boş kalırdı.

## Faz özeti

| Faz | Batch | Çıktı |
| --- | --- | --- |
| 0 — veri | KR01 | 17 ilan + staj TS modülü, sözleşme testi. UI değişmez. |
| 1 — altyapı | KR02, KR03 | Tablo + kova + RPC + API/şema katmanı |
| 2 — public sayfa | KR04, KR05, KR06 | Hero/mektup/saat · ilan listesi · başvuru formu |
| 3 — geçiş | KR07 | Eski 4 ilanın korunması |
| 4 — yönetim | KR08, KR09 | Admin ekranı + bildirim maili |
| 5 — kapanış | KR10 | SEO/sitemap/doküman/araç kataloğu |

Ayrıntı ve kabul kriterleri master'ın KR bölümünde.

## Kaynak dosyaların akıbeti

Depo kökünde duran `EKİP WEB SAYFASI 28 EYLÜL VERS.-*` klasörü ve zip'i **kökte
bırakılmaz** (kökte yalnız `CLAUDE.md` ve `README.md` durur). KR10'da ya
`docs/archive/` altına taşınır ya silinir; base64 görseller KR04'te
`public/career/` altına gerçek dosya olarak çıkarılmış olacağı için kaynak HTML'in
saklanması zorunlu değildir.
