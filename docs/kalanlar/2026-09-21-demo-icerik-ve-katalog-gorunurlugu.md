# Demo İçerik ve Katalog Görünürlüğü — Kalanlar

**Tarih:** 21 Eylül 2026
**Kaynak:** `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` (4 batch, **tamamlandı** — `df6236d`)
**Durum:** PLANLANDI — başlanmadı.

> Bütün rakamlar **canlı veritabanında ölçüldü** (pooler üzerinden `psql`, 21 Eylül 2026
> akşamı). Ezberleme — dokunmadan önce her maddenin altındaki sorguyu yeniden çalıştır.
> Sorgular hafiftir; CLAUDE.md'deki "1 GB RAM" uyarısına uygun olarak `geo_cities`
> (76.990 satır) üzerinde satır-başına fonksiyon çalıştıran sorgu yoktur.

## Bu dosya neyi kapsamaz

Kapanan planın **kod** artıkları ayrı bir dosyada duruyor ve burada tekrarlanmaz:
`docs/plans/2026-09-21-public-rotalar-kalan-isler.md` (PR1 hareketsiz düğmeler ·
PR2 iç bağlantı sözleşme testi · PR3 Playwright portu · PR4 sitemap veri durumu ·
PR5 paralel oturum artıkları).

61 bekleyen uzman + 241 konsolosluk kaydının **yayın kararı** da burada değil:
[2026-09-21-dizin-veri-ve-kapsam-plani.md](2026-09-21-dizin-veri-ve-kapsam-plani.md).

Buradaki üç madde o iki dosyada **yok**; public rotalar planı doğrulanırken ölçülerek
çıktı.

---

## K1 — Arama ile liste sayfaları aynı veriyi FARKLI gösteriyor

**Sınıf:** kod kusuru + ürün kararı. **Öncelik: en yüksek madde budur.**

### Ölçülen durum

Katalogda `published` + `public` olan **249** kaydın **77'si** `is_placeholder = true`
— yani rol iskeletini doldurmak için üretilmiş, gerçek olmayan kayıtlar.

İki okuma yolu bunlara **zıt** davranıyor:

| Yol | Kod | Placeholder | Sonuç |
|---|---|---|---|
| Liste sayfaları (`/consultants`, `/businesses`, `/city-ambassadors`) | `src/lib/public-catalog-api.ts:120` → `.eq("is_placeholder", false)` | **eler** | 172 kayıt |
| `/directory` araması | `search_directory_catalog` — filtre **yok** | **elemiyor** | 237 kayıt, **69'u placeholder** |

Ölçüm komutu:

```sql
-- yayında + public placeholder sayısı
select count(*) from catalog_items
where status='published' and visibility='public' and is_placeholder=true;   -- 77

-- aramanın döndürdükleri içinde kaç placeholder var (3 sayfa, tavan 100)
select sum(cnt) from (
  select count(*) filter (where ci.is_placeholder) as cnt
    from search_directory_catalog(p_limit => 100, p_offset => 0) s
    join catalog_items ci on ci.id = s.item_id
  union all select count(*) filter (where ci.is_placeholder)
    from search_directory_catalog(p_limit => 100, p_offset => 100) s
    join catalog_items ci on ci.id = s.item_id
  union all select count(*) filter (where ci.is_placeholder)
    from search_directory_catalog(p_limit => 100, p_offset => 200) s
    join catalog_items ci on ci.id = s.item_id
) t;                                                                         -- 69
```

### Neden şimdi önemli

`/directory` **21 Eylül'de anonime açıldı** (`20260921090000_directory_search_anon_normalized.sql`).
Bu kayıtlar artık giriş yapmış üyelere değil, **tüm internete ve tarayıcı botlarına**
görünüyor. Aramanın döndürdüğü her dört kayıttan biri (69/237, **%29**) gerçek değil.

Kusurun sinsiliği şurada: kullanıcı `/consultants` sayfasında temiz bir liste görüyor,
aynı ismi aramaya yazdığında sahte kayıtlarla karşılaşıyor. Hiçbir test bunu yakalamaz
— iki yol ayrı kod, ayrı sözleşme; ikisi de kendi içinde tutarlı.

⚠️ Bu **rozet eksikliği değil**. `DemoBadge` yalnız `PublicListingPage`'in `demoRows`
listesine bakar (`PublicListingPage.tsx:140`); DB'den gelen `is_placeholder` kayıtlar
için hiçbir yerde rozet çizilmiyor — çünkü liste yolunda o kayıtlar zaten hiç gelmiyor.
Arama yolunda geliyorlar ve **rozetsiz** görünüyorlar.

### Karar gereken nokta

Üç seçenek var; ikisi kod, biri veri:

1. **Aramadan da ele** (bir satır: RPC'ye `and ci.is_placeholder = false`).
   İki yol tutarlı olur, arama 237 → 168 kayda düşer.
2. **Aramada göster ama işaretle** — `is_placeholder`'ı RPC'nin dönüş sütunlarına
   ekle, kartta rozet çiz. Sonuç sayısı korunur, dürüstlük sağlanır.
3. **Placeholder'ları yayından kaldır** — `status='draft'`. En temiz ama dizini
   172 kayda düşürür.

**Öneri: (1).** Sebep: `/businesses` sayfası zaten "gerçek kayıt gelince demo satırı
silinecek" desenine bağlı ve placeholder'lar orada **ürün vitrini** olarak duruyor,
arama sonucu olarak değil. Arama "kim var" sorusunu cevaplar; sahte kayıt bu soruyu
kirletir. (2) daha çok iş, (3) geri alması zor.

### Yapılacaklar

1. Kararı ver. (1) seçilirse yeni migration: RPC gövdesine `is_placeholder` filtresi.
   **Parent dizine bırakma** — yaz, uygula, `applied/` altına taşı (CLAUDE.md kör noktası).
2. `src/lib/catalog-directory.test.ts`'e sözleşme testi: arama yolu ile liste yolunun
   placeholder davranışı **aynı** olmalı.
3. `npm run check:migrations` ile doğrula.

**Doğrulama:** yukarıdaki ikinci sorgu **0** dönmeli; `/consultants` sayfasındaki
kayıt sayısı ile aynı role için arama sonucu tutarlı olmalı.

---

## K2 — `p_featured_only` üç değerli mantık tuzağı

**Sınıf:** kod. **Bugün canlıda kırık DEĞİL** — savunmacı düzeltme.

### Ölçülen durum

```sql
select count(*) from search_directory_catalog(p_limit => 100);                  -- 100 (total 237)
select count(*) from search_directory_catalog(p_featured_only => null,
                                              p_limit => 100);                  --   0
```

`null` gönderildiğinde arama **hata vermeden, sessizce sıfır sonuç** döner.

**Bugün tetiklenmiyor**, çünkü çağrı yolu boolean'ı garanti ediyor:
`DirectoryPage.tsx:59` → `searchParams.get("featured") === "1"` her zaman `true`/`false`
üretir, `catalog-directory.ts:253` tipi `featuredOnly: boolean` (opsiyonel değil).
Yani bu bir hata raporu değil, **açık duran bir kapı**.

Kapı şuradan açılır: alan opsiyonel yapılır, bir çağrı yolu `undefined` yerine `null`
geçer, ya da RPC başka bir istemciden (mobil, ajan, `/api`) çağrılır. Sonuç sessizdir —
kullanıcı "arama çalışmıyor" der, log'da hata yoktur.

### Yapılacaklar

RPC gövdesinde parametreyi normalleştir:

```sql
v_featured_only boolean := coalesce(p_featured_only, false);
```

K1 migration'ı yazılıyorsa **aynı migration içinde** yapılır, ayrı iş açma.

**Doğrulama:** `select count(*) from search_directory_catalog(p_featured_only => null, p_limit => 100);`
→ 100 dönmeli (0 değil).

---

## K3 — `/businesses` ve `/isletme/:slug` gerçek veriye geçiş

**Sınıf:** veri / ürün kararı. Kod hazır, bekleyen şey **kayıt**.

### Ölçülen durum (21 Eylül)

| Grup | Yayında + public | Bunların placeholder'ı | Gerçek |
|---|---|---|---|
| `Business_*` | 25 | **25** | **0** |
| `User_CityAmbassador` | 10 | 1 | 9 |
| `Consultant_*` | 21 | 11 | 10 |
| `Healthcare_*` | 17 | 7 | 10 |
| `Organization_*` | 21 | 8 | 13 |

`/businesses` bu yüzden `DEMO_ROUTES` içinde ve sitemap'in **dışında** — ikisi de doğru
ve **şimdilik böyle kalmalı**. `/isletme/:slug` ise `src/lib/business-demo-rows.ts`
(2 kayıt) üzerinden çalışıyor ve `DemoPageBanner` taşıyor.

`/consultants` ve `/city-ambassadors` gerçek veriye sahip olduğu için sitemap'te —
bu da doğru. Ama dikkat: `/consultants`'ın yayındaki 38 kaydının **18'i placeholder**
(%47). Liste yolu bunları elediği için sayfada 20 gerçek uzman görünüyor; kullanıcı
doğru şeyi görüyor. K1 çözülmezse arama aynı sayfa için farklı bir gerçeklik gösterir.

### Yapılacaklar — gerçek işletme kaydı geldiğinde

Sıra önemli, üçü birlikte yapılır:

1. `src/lib/demo-pages.ts` → `/businesses` satırını **sil** (bant ve rozet kendiliğinden kalkar).
2. `src/lib/business-demo-rows.ts` → `BUSINESS_DEMO_ROWS`'u boşalt veya dosyayı sil,
   `BusinessesPage.tsx`'teki `demoRows` prop'unu kaldır.
3. `scripts/generate-sitemap.mjs` → `STATIC_ROUTES`'a `/businesses` ekle. **Önce üç
   kriteri doğrula** (public mi · `useSeo` + `canonicalPath` var mı · thin content değil mi
   — CLAUDE.md "Değişmez sözleşmeler" md.4). (a) ve (b) bugün zaten sağlanıyor;
   bekleyen tek kriter (c), yani **gerçek içerik**.
4. `/isletme/:slug`'ı `mock`/demo satırlardan katalog verisine bağla, `DemoPageBanner`'ı kaldır.
5. `src/lib/demo-pages.test.ts` ve `scripts/generate-sitemap.test.mjs` yeşil kalmalı.

⚠️ **Kayıt sayısı sıfırken sitemap'e ekleme.** Boş/ince sayfa GSC'de
"Crawled – currently not indexed" üretir ve crawl bütçesini gerçek içerikten çalar —
bu depoda `/cadde` ile bir kez yaşandı.

### Kaynak nereden gelecek

`BusinessesPage.tsx` zaten kayıt **toplayan** yüzey: `InterestForm` + `#kayit-form`
çapası var, `DemoPageBanner`'ın "Kayıt Ol" düğmesi oraya iniyor. Yani akış kurulu;
eksik olan başvuruların gelmesi ve onaylanması.

---

## Çıkış kriterleri

| # | Kriter | Sınıf |
|---|---|---|
| K1 | Arama ile liste sayfalarının placeholder davranışı aynı; sözleşme testi kilitliyor | Kod + karar |
| K2 | `p_featured_only => null` sıfır sonuç döndürmüyor | Kod |
| K3 | Gerçek işletme kaydı var; `DEMO_ROUTES` satırı silinmiş, sitemap'e eklenmiş, demo satırlar kaldırılmış | Veri |

Üçü bitince bu dosya **silinir** (README'nin kuralı: karar verilip iş bitince dosya
buradan kalkar, öylece durmaz).
