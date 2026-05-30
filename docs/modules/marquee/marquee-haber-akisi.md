# Marquee Haber Akisi

Bu dokuman, ana sayfadaki `CorteQS Radar` marquee/haber bandinda yer alan kartlarin nereden geldigini, veritabaninda nasil tutuldugunu ve admin panelden nasil yonetildigini aciklar.

## Kisa Ozet

- Marquee icerikleri su anda harici bir haber API'sinden cekilmiyor.
- Tum kayitlar manuel olarak admin panelden olusturuluyor veya Supabase veritabaninda tutuluyor.
- Public tarafta gorunen kartlar `public.marquee_items` tablosundan okunuyor.
- Kart gorselleri Supabase Storage icindeki `newsimage` bucket'inda tutuluyor.
- Public tarafta sadece `is_active = true` olan kayitlar gosteriliyor.
- Detay sayfasina gitmesi istenen kartlarda `link_enabled = true` ve gecerli bir `slug` bulunmasi gerekiyor.

## Kullanilan Dosyalar

Ana teknik referanslar:

- [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts)
- [src/components/DiasporaMarqueeSection.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/DiasporaMarqueeSection.tsx)
- [src/components/MarqueeItemCard.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/MarqueeItemCard.tsx)
- [src/pages/DiasporaDetailPage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/DiasporaDetailPage.tsx)
- [src/pages/RadarPage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/RadarPage.tsx)
- [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx)
- [src/components/admin/AdminLayout.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/admin/AdminLayout.tsx)
- [src/lib/admin.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/admin.ts)
- [supabase/migrations/20260424110000_add_marquee_items.sql](/c:/temp_private/corteqs/corteqs_landing/supabase/migrations/20260424110000_add_marquee_items.sql)
- [src/integrations/supabase/types.ts](/c:/temp_private/corteqs/corteqs_landing/src/integrations/supabase/types.ts)

## Veri Kaynagi

Marquee haberleri `public.marquee_items` tablosunda tutulur.

Tablonun amaci:

- `news`: haber kartlari
- `stat`: sayi/istatistik kartlari
- `announcement`: duyuru kartlari

Tabloda kullanilan temel alanlar:

- `id`: kaydin UUID anahtari
- `type`: `news | stat | announcement`
- `slug`: detay sayfasi aciksa kullanilan URL parcasi
- `title`: kart basligi
- `summary`: kart uzerindeki kisa aciklama
- `detail_content`: detay sayfasinda gosterilecek uzun metin
- `image_url`: kart gorseli
- `image_alt`: gorsel alt metni
- `metric_value`: kart ustundeki buyuk sayi/deger rozeti
- `link_enabled`: kart tiklaninca detay sayfasina gidilsin mi
- `sort_order`: public listede oncelik sirasi
- `is_active`: kayit yayinda mi
- `published_at`: yayin tarihi
- `created_at`, `updated_at`: zaman damgalari

Tip tanimlari frontend tarafinda da uretilmis durumda:

- `MarqueeItemType`, `MarqueeItemRow`, `MarqueeItemInsert`, `MarqueeItemUpdate`
- Kaynak: [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts:4)

## Veritabani Kurulumu

Marquee altyapisi migration ile kuruluyor:

- [supabase/migrations/20260424110000_add_marquee_items.sql](/c:/temp_private/corteqs/corteqs_landing/supabase/migrations/20260424110000_add_marquee_items.sql:3)

Bu migration su isleri yapiyor:

- `public.marquee_items` tablosunu olusturuyor
- `slug` icin format kontrolu koyuyor
- `link_enabled = true` ise `slug` zorunlu hale getiriyor
- `slug` alanina unique index ekliyor
- public listeleme icin `(is_active, sort_order, published_at DESC)` index'i ekliyor
- `updated_at` alanini otomatik guncelleyen trigger kuruyor
- ilk ornek/fallback kayitlarini insert ediyor
- `newsimage` storage bucket'ini olusturuyor
- bucket icin public okuma ve admin yazma/silme policy'lerini tanimliyor

## RLS ve Yetkilendirme

`marquee_items` tablosunda Row Level Security acik:

- Public okuma: `anon` ve `authenticated` roller `is_active = true` olan kayitlari okuyabilir
- Admin okuma/yazma/silme: sadece `public.admin_users` tablosunda kaydi olan kullanicilar

Yetki kontrolu frontend tarafinda da yapiliyor:

- [src/lib/admin.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/admin.ts:10)
- `userIsAdmin(userId)` fonksiyonu `admin_users` tablosunu sorguluyor

Admin layout giris akisi:

- Supabase auth session kontrol ediliyor
- Kullanici giris yaptiysa `userIsAdmin` ile admin olup olmadigi dogrulaniyor
- Admin navigasyonunda `Haber Bandi` sayfasi `/admin/marquee` olarak aciliyor

Kaynak:

- [src/components/admin/AdminLayout.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/admin/AdminLayout.tsx:22)

## Gorsel Kaynagi

Marquee kart gorselleri `newsimage` isimli Supabase Storage bucket'inda tutulur.

Frontend upload akisi:

- Dosya once `validateNewsImageFile(file)` ile kontrol edilir
- Sadece `jpg`, `jpeg`, `png`, `webp`, `gif` kabul edilir
- Maksimum boyut `5 MB`
- Gecerli dosya `uploadNewsImage(file)` ile `newsimage/marquee/...` yoluna yuklenir
- Yukleme sonrasi public URL uretilir ve `image_url` alanina yazilir

Kaynak:

- [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts:9)
- [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx:105)

## Public Tarafta Haberler Nasil Cekiliyor

Public listeleme icin kullanilan ana fonksiyon:

- `listPublicMarqueeItems()`
- Kaynak: [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts:140)

Bu fonksiyonun yaptigi:

- `marquee_items` tablosundan `select("*")`
- `is_active = true` filtresi
- once `sort_order ASC`
- sonra `published_at DESC`

Bu veri 3 farkli yerde kullaniliyor:

### 1. Ana sayfa marquee bandi

- Bilesen: [src/components/DiasporaMarqueeSection.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/DiasporaMarqueeSection.tsx:8)
- Sayfa ilk acildiginda `listPublicMarqueeItems()` cagriliyor
- Veri gelmezse ya da hata olursa baslangicta `fallbackMarqueeItems` gorunuyor
- Sonsuz kayan efekt icin liste `[..., ...]` seklinde iki kez cogaltiliyor

### 2. Tum Radar sayfasi

- Sayfa: [src/pages/RadarPage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/RadarPage.tsx:8)
- Yine `listPublicMarqueeItems()` kullaniliyor
- Burada kayitlar ek olarak `published_at DESC` ile yeniden siralaniyor
- Hata olursa `fallbackMarqueeItems` kullaniliyor

### 3. Tekil detay sayfasi

- Sayfa: [src/pages/DiasporaDetailPage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/DiasporaDetailPage.tsx:8)
- `getPublicMarqueeItemBySlug(slug)` kullaniliyor
- Sadece `is_active = true` ve `link_enabled = true` olan kayitlar detay sayfasinda bulunabiliyor
- Kayit bulunamazsa ayni slug'e sahip fallback kaydi aranıyor

## Kartin Tiklanma Davranisi

Kart bileseni:

- [src/components/MarqueeItemCard.tsx](/c:/temp_private/corteqs/corteqs_landing/src/components/MarqueeItemCard.tsx:28)

Davranis:

- `item.link_enabled && item.slug` ise kart `/diaspora/:slug` rotasina `Link` olur
- Aksi halde kart sadece gorunur, tiklanabilir detay sayfasina gitmez
- `metric_value` varsa kart gorseli uzerinde buyuk bir sayi/deger rozeti gosterilir

## Fallback Icerikler

Sistem Supabase verisi yuklenemezse bos kalmamak icin sabit fallback kartlar kullaniyor.

Kaynak:

- [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts:18)

Su anda 3 fallback kaydi var:

- `Türk diasporası 164 ülkede görünür`
- `8.8 milyon kişilik küresel topluluk`
- `Erken kayıt ve şehir elçisi başvuruları açık`

Not:

- Fallback icerikler sadece UI'nin bos kalmamasi icin var
- Asil kaynak Supabase `marquee_items` tablosu

## Admin Panel Akisi

Admin yonetim ekrani:

- Route: `/admin/marquee`
- Sayfa: [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx:83)

Sayfanin amaci:

- Hero altinda donen haber, istatistik ve duyuru kartlarini yonetmek

### Admin form alanlari

Formda su alanlar duzenlenebilir:

- `type`
- `published_at`
- `sort_order`
- `title`
- `slug`
- `summary`
- `detail_content`
- `image_url`
- `image_alt`
- `metric_value`
- `link_enabled`
- `is_active`

Slug davranisi:

- Kullanici slug girerse `slugifyMarqueeTitle()` ile normalize edilir
- `link_enabled = true` ise slug zorunludur
- Kaynak: [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx:142)

### Admin tarafindaki temel operasyonlar

- `listAdminMarqueeItems()`: tum kayitlari listeler
- `createMarqueeItem(payload)`: yeni kayit ekler
- `updateMarqueeItem(id, payload)`: kayit gunceller
- `deleteMarqueeItem(id)`: kayit siler
- `toggleActive(item)`: aktif/pasif durumunu hizlica cevirir

Kaynak:

- [src/lib/marquee.ts](/c:/temp_private/corteqs/corteqs_landing/src/lib/marquee.ts:164)
- [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx:205)

### Admin tablo gorunumu

Liste tarafinda asagidaki kolonlar gosterilir:

- Gorsel
- Baslik
- Tip
- Durum
- Detay
- Sira
- Islem

Her satirda su aksiyonlar vardir:

- `Aktif/Pasif` toggle
- `Duzenle`
- `Sil`

Kaynak:

- [src/pages/admin/AdminMarqueePage.tsx](/c:/temp_private/corteqs/corteqs_landing/src/pages/admin/AdminMarqueePage.tsx:378)

## Veri Akisi Uctan Uca

Marquee iceriginin sistemdeki tam akisi su sekilde:

1. Admin kullanicisi `/admin/marquee` ekranina girer.
2. Gerekirse gorseli `newsimage` bucket'ina yukler.
3. Form verisini doldurup kaydi olusturur veya gunceller.
4. Kayit `public.marquee_items` tablosuna yazilir.
5. Public tarafta `DiasporaMarqueeSection` ve `RadarPage` sadece aktif kayitlari Supabase'ten ceker.
6. `link_enabled = true` olan kartlar `/diaspora/:slug` detay sayfasina acilir.

## Onemli Notlar

- Su an sistemde otomatik RSS, haber API'si, cron veya scraping akisi yok.
- "Haber" kelimesi UI'da kullanilsa da teknik olarak icerikler editor/admin kontrollu kayitlardan olusuyor.
- `sort_order` public listede birinci siralama kriteridir.
- `published_at` ayni sira grubunda ikinci siralama kriteridir.
- `is_active = false` olan kayitlar public tarafta hic gorunmez.
- `link_enabled = false` olan kayitlar detay sayfasina acilmaz.

## Olası Gelistirme Alanlari

- Otomatik icerik kaynagi eklemek istenirse `marquee_items` tablosu korunup ustune import katmani kurulabilir
- Admin ekranda filtreleme ve arama eklenebilir
- Gorsel silme/guncelleme ile storage cleanup mekanizmasi eklenebilir
- `type` bazli ayri public sekmeler olusturulabilir
- Admin tarafinda preview linki eklenebilir
