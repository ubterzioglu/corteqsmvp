# Cadde Redesign Çalışma Haritası

> Üretim: 31 Temmuz 2026 · 7 paralel keşif ajanı, kod satır satır okunarak (tahmin yok)
> Kaynak madde listesi: `/admin/workshop/cadde` panosu (48 madde) + `caddeworkshdp.md` transkripti
> m47-m48 süreç maddeleridir (pano formatı + sonraki workshop) — kod haritası gerektirmez.

## Nasıl kullanılır

Her maddede: **hedef dosyalar (satır numaralı)** · **Mevcut** (bugünkü davranış, kanıtlı) · **Yapılacak** (değişikliğin somut yönü) · varsa **Bağımlılık** · **Efor** (S <1 sa · M ~yarım gün · L 1+ gün).
Satır numaraları bu tarihin `main`'ine göredir — kod değiştikçe kayar, dosya adları kalıcı çıpadır.

**Efor dağılımı:** 28 × S · 15 × M · 3 × L (toplam 46 madde)

## Önerilen ilk sprint (kararı verilmiş, çakışmasız hızlı kazanımlar)

1. **Composer sadeleşmesi** — m5 + m6 + m13 tek PR (type-türetme mantığı ortak; WhatsApp sadeliği kararı net).
2. **Kafe kartı paketi** — m2 + m4 (+ ikon seçilince m3) tek PR: aynı kart başlığına dokunuyorlar.
3. **Akış temizliği** — m15 (Yakında blokları) + m17 (tip etiketi) — ikisi de silme işi.
4. **Çarşı gizleme** — m39 + m40 birlikte (link gizle + 'yakında' bloğu).
5. **Tepki seti** — m19 + m20 tek PR (karar verildi: doğrudan açık + negatifsiz; SQL tarafı bağımlılığına dikkat).

---

## Özet tablo

| m | Özet | Efor | Bağımlılık |
|---|---|---|---|
| 1 | Dünya saatleri analog yuvarlak saate dönüşecek | M | — |
| 2 | Aktif Cafeler kart layoutu hizalanacak | S | — |
| 3 | Seçilen Corteqs kafe ikonu kartlara entegre | S | 5 öneriden hangisinin seçildiği workshop kararı (kafe-ikon-o… |
| 4 | Kafe kartı: ad bold, oda/tema normal yan yana | S | m2 kart yeniden düzeni ve m3 ikon entegrasyonu aynı kart baş… |
| 5 | Composer'daki katlanan Detaylar paneli tamamen kaldırılacak | S | m13 (panel içindeki Etiketler bölümü m13'ün veto kararıyla b… |
| 6 | Etkinlik çipi composer'dan silinecek | S | m5 ile aynı PR'da yapılmalı (type türetme mantığı ortak) |
| 7 | Foto+video yükleme kalacak, uçtan uca test yazılacak | M | — |
| 8 | Konum çipi 'Konum ekle'; default kayıtlı konum | S | m11 (filtre-fallback'i kalkınca serbest global yol da kapanı… |
| 9 | Konum drill-down: +1 ülke VEYA +1 şehir | L | m8 (default konum zinciri önce oturmalı); ayna sözleşmesi: S… |
| 10 | Çoklu ülke/şehir premium'a kilitli (kapalı) | S | m9 (ek hedef altyapısı olmadan gösterilecek bir üst sınır yo… |
| 11 | Serbest global yok; globale çıkış performans eşiği | L | m8 (composer default'u) ve m12 (paylaşım sayacı yoksa '10 pa… |
| 12 | Feed kartına 'Paylaş' (share) butonu eklenecek | M | m11 eşiği paylaşım sayacına ihtiyaç duyarsa DB kısmı m11 ile… |
| 13 | Konu/etiket seçimi VETO — UI kalkar, altyapı rezervde | S | m5 (aynı panelin parçası — birlikte uygulanmalı) |
| 14 | Akış filtre çiplerine kısa açıklama ekle | S | — |
| 15 | Takip Ettiklerim ve İş Fırsatları çipleri kaldır | S | — |
| 16 | Yeni paylaşım çipi yenileme sonrası sıfırlanmıyor | S | — |
| 17 | Post başlığındaki tip rozetini kaldır | S | Madde 18 ile aynı başlık bloğu (CaddePage.tsx:541-556) — tek… |
| 18 | Post başlığı forum hiyerarşisine geçsin | S | Madde 17 (tip rozeti silme) aynı blokta; başlıksız post fall… |
| 19 | Tepki popover'ı kalksın, emojiler doğrudan açık | S | m20 ile aynı JSX bloğu — birlikte yapılmalı (emoji seti deği… |
| 20 | Negatifsiz 5'li emoji seti: +kalp/gülme/emin-olamadım | M | m19 ile aynı blok; 'idea' verisinin akıbeti (gizle mi say mı… |
| 21 | Yorum sayısı + tıkla-aç + load-more sayfalama | M | m23 hedefli yorum auto-refresh'i bu ayrıma dayanır |
| 22 | Yorum kutusunda Enter ile gönderme | S | — |
| 23 | Yeni yorum/paylaşım için otomatik yenileme | M | m21 (yorumların ayrı query olması hedefli refresh'in önkoşul… |
| 24 | Yorum layout'u jilet gibi sıkıştırılacak | S | m21/m22 aynı panel JSX'ine dokunuyor — çakışmayı önlemek içi… |
| 25 | WhatsApp tarzı emoji seçici (yorum+composer) | M | Kütüphane vs custom set kararı; m22 ile aynı yorum kutusu JS… |
| 26 | Cadde genelinde buton inceltme ve boşluk azaltma | M | m27 palet ve m30 yerleşim değişikliğiyle aynı dosyalarda — t… |
| 27 | Logo koyu renklerinden yüksek kontrastlı palet | M | m26 ile aynı dosyalar/satırlar — birlikte tek geçişte uygula… |
| 28 | Footer tüm sayfalarda sadeleştirilip inceltilecek | M | — |
| 29 | Cadde içindeki tekrar eden ana menü kaldırılacak | S | Karar: bu linklerin SiteHeader'a taşınıp taşınmayacağı works… |
| 30 | Sol kolon yeniden sıralama, sağ kolon yalnız reklam | M | m31 (Cafeler tekrarı) ve m29 (üst şerit) aynı dosyada — birl… |
| 31 | Kafeler bloğunun iki yerdeki tekrarı giderilecek | S | m30 yerleşim kararı |
| 32 | Cadde login zorunluluğu — fiilen tamamlanmış | S | — |
| 33 | +90 kullanıcı caddede yalnız Köprü görsün | L | m34 ile ortak kimlik kararı: yetkili kaynak telefon ülke kod… |
| 34 | Doğrulanmış diaspora tam görünürlük garantisi | M | m33 ile aynı migration ve kimlik kararı; ayrıca 'doğrulanmış… |
| 35 | Köprü switch'ine hover bilgi baloncuğu | S | — |
| 36 | Geo filtre kafe+paylaşım süzme — doğrulandı | S | m33 uygulanırken koruma altına alınmalı. |
| 37 | Ülke/şehir seçim bölümü layout düzeltmesi | S | — |
| 38 | İnsanları keşfet tüm kayıtlı kullanıcıları arasın | M | Gizlilik/KVKK kararı: visibility_status='open' olmayan profi… |
| 39 | Çarşı'ya giden görünür linkleri gizle/inaktifleştir | S | — |
| 40 | Yerine 'Çarşı yakında' teaser bloğu | S | m39 ile aynı slot — birlikte uygulanmalı |
| 41 | CorteQS Panosu iptal, featured içerik gelsin | M | m42 (manuel featured seçim mekanizması) |
| 42 | Featured etkinlik manuel admin seçimi nereye | S | — |
| 43 | Tanıtım boş durumuna billboard placeholder | S | — |
| 44 | Şehrinden Öne Çıkanlar: featured kayıt, tıkla-profile | M | m42 (featured işaretleme) — muhtemelen yeni migration (profi… |
| 45 | 'Talep bırak' yerine 'profilinden ilk tanıtımını yap' | S | — |
| 46 | Profil menüsüne 'Caddeye reklam ver' linki | S | m45 ile aynı hedef akış (CaddeTanitimPanel anchor'ı ortak ya… |

---

## Üst Alan (m1-m4)

### m1 · Dünya saatleri analog yuvarlak saate dönüşecek — **M (~yarım gün)**

- `src/components/cadde/CaddeWorldClocks.tsx:10`
- `src/components/cadde/CaddeWorldClocks.tsx:30`
- `src/components/cadde/CaddeWorldClocks.tsx:34`
- `src/components/cadde/CaddeWorldClocks.tsx:54`
- `src/components/cadde/CaddeWorldClocks.tsx:137`
- `src/pages/cadde/CaddePage.tsx:405`

**Mevcut:** Saatler yuvarlak hap (pill) çip olarak dijital gösteriliyor: satır 137-161'de rounded-full çip içinde gün-evresi ikonu (satır 54-59 dayPartIcon → Sun/Moon/Sunrise/Sunset, import satır 10), şehir adı ve Intl ile HH:mm dijital saat (satır 30-31 timeFormatter, satır 150). Saat/gündüz tonu satır 62-65, dakika-hizalı canlı tick satır 77-96 (useMinuteTick). CaddePage:405-409'dan viewerCity/filterCity/cities ile çağrılıyor.

**Yapılacak:** Çip yerine SVG analog kadran (akrep+yelkovan, otel/havaalanı tarzı) çizilecek; altına şehir adı. dayPartIcon ve lucide Sun/Sunrise/Sunset/Moon importları kalkacak. İbre açısı için hourInTimezone (satır 34-38) dakika da döndürecek şekilde genişletilmeli; useMinuteTick ve 3-saat/dedupe mantığı (satır 101-135) aynen korunur. data-testid=cadde-world-clocks korunmalı.

### m2 · Aktif Cafeler kart layoutu hizalanacak — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:425`
- `src/pages/cadde/CaddePage.tsx:427`
- `src/pages/cadde/CaddePage.tsx:433`
- `src/pages/cadde/CaddePage.tsx:439`
- `src/pages/cadde/CaddePage.tsx:379`

**Mevcut:** Kartlar satır 425'te 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' içinde; kart (427-447) flex-col/h-full DEĞİL — değişken uzunluktaki summary (438) yüzünden alt satır ('Host: ... • N üye' + 'İncele & Katıl' butonu, 439-446) kartlar arasında farklı yüksekliklerde kalıyor. Rozetler (Köprü + Onaylı/Davetli, 433-436) sağda flex-col ile DİKEY yığılıyor ve başlığı sıkıştırıyor; dar kolonda host metni + buton satırı kırılıyor. Sidebar'daki küçük 'Cafeler' listesi (379-390) ayrı ve daha sade bir tekrar.

**Yapılacak:** Kart 'flex h-full flex-col' yapılıp footer'a mt-auto verilecek; rozetler tek yatay satıra alınacak; summary'ye line-clamp-2/3; host metni truncate + buton shrink-0 ile aynı hizada sabitlenecek. Böylece Davetli/İncele&Katıl öğeleri her kartta aynı konumda durur. Boş-durum bloğu (451-464) ve testte kullanılan cadde-cafes-empty-state testid'i (452) değişmez.

### m3 · Seçilen Corteqs kafe ikonu kartlara entegre — **S (<1 saat)**

- `docs/cadde-300/kafe-ikon-onerileri.html:56`
- `src/pages/cadde/CaddePage.tsx:430`
- `src/pages/cadde/CaddePage.tsx:383`
- `src/pages/cadde/CaddeCafePage.tsx:165`
- `src/components/cadde/CreateCafeForm.tsx:123`
- `src/components/cadde/CaddeMyContentCard.tsx:55`
- `src/components/cadde/MentionTextarea.tsx:20`

**Mevcut:** 5 öneri hazır: kafe-ikon-onerileri.html satır 56-60'ta '1·CC', '2·C-Kupa', '3·Çay', '4·Sohbet', '5·Tabela' — hepsi lucide sözleşmesinde (24×24 viewBox, stroke 2, currentColor) inline SVG; doküman notu 'seçilen doğrudan components/cadde'ye kopyalanabilir' (satır 171). Bugün kafe kartlarında HİÇ ikon yok (CaddePage:430 ve :383 sadece başlık); generic lucide Coffee yalnız CreateCafeForm:123 (dialog başlığı), CaddeMyContentCard:55 (içeriklerim listesi) ve MentionTextarea:20 (cafe mention tipi) kullanılıyor.

**Yapılacak:** Seçilen SVG, yeni src/components/cadde/CaddeCafeIcon.tsx bileşenine (LucideProps benzeri size/className prop'lu) kopyalanacak; kafe kartlarına eklenecek (CaddePage:430 Aktif Cafeler kartı, :383 sidebar listesi, CaddeCafePage:165 başlık) ve 3 lucide Coffee kullanımı bununla değiştirilecek — kartlar 'sadece o küçük ikondan' tanınır olacak.

**Bağımlılık:** 5 öneriden hangisinin seçildiği workshop kararı (kafe-ikon-onerileri.html üzerinden seçim bekleniyor)

### m4 · Kafe kartı: ad bold, oda/tema normal yan yana — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:430`
- `src/pages/cadde/CaddePage.tsx:383`
- `src/pages/cadde/CaddeCafePage.tsx:163`
- `src/lib/cadde-types.ts:308`
- `src/components/cadde/CreateCafeForm.tsx:159`

**Mevcut:** Kartlarda tek satır var: cafe.title bold (CaddePage:430 ve :383 'font-semibold'); oda/tema adı kartlarda HİÇ gösterilmiyor. Tema yalnız CaddeCafePage:163'te başlığın ÜSTÜNDE ayrı bir outline Badge olarak ve HAM anahtar halinde basılıyor (cafe.themeKey, ör. 'Genel'/'IT' — cadde-api.ts:356 row.theme_key'i aynen geçirir). Türkçe tema etiketi (labelTr) sadece CreateCafeForm:159-160'taki listCaddeCafeThemes seçiminde kullanılıyor.

**Yapılacak:** Kart başlığı tek satırda iki parçalı olacak: kafe adı font-semibold + yanında oda/tema adı font-normal (ör. muted renk) — CaddePage:430, :383 ve CaddeCafePage:163-165 (Badge kaldırılıp başlık yanına normal metin). themeKey ham anahtar olduğundan labelTr eşlemesi için listCaddeCafeThemes sonucundan key→labelTr map'i karta indirilmeli.

**Bağımlılık:** m2 kart yeniden düzeni ve m3 ikon entegrasyonu aynı kart başlığına dokunuyor — birlikte uygulanmalı


## Paylaşım Kutusu (m5-m13)

### m5 · Composer'daki katlanan Detaylar paneli tamamen kaldırılacak — **S (<1 saat)**

- `src/components/cadde/CaddeComposer.tsx:56`
- `src/components/cadde/CaddeComposer.tsx:152-161`
- `src/components/cadde/CaddeComposer.tsx:215-269`
- `src/lib/cadde-composer.ts:11-16`
- `src/components/cadde/CaddeComposer.test.tsx:57-66`
- `src/pages/cadde/CaddePage.tsx:548`

**Mevcut:** Composer'da 'Detaylar' düğmesi (satır 152-161) katlanan panel açıyor: Tür seçici (Paylaşım/Soru/İlan-Teklif/Etkinlik, POST_TYPE_LABELS cadde-composer.ts:11-16), isteğe bağlı Başlık ve Etiketler (satır 215-269). Feed kartı tür rozetini aynı etiketlerden basıyor (CaddePage.tsx:548).

**Yapılacak:** detailsOpen state'i (satır 56), Detaylar düğmesi ve panel silinecek; type her zaman 'text' kalacak (veri sözleşmesi — caddePostCreateSchema enum'u ve RPC parametresi DOKUNULMADAN korunur, eski postların rozeti bozulmaz). CaddeComposer.test.tsx:57-66'daki 'keeps type and title hidden until Detaylar is opened' testi güncellenecek. Başlık alanı UI'dan kalkar, CaddeComposerValue.title alanı sözleşmede kalır.

**Bağımlılık:** m13 (panel içindeki Etiketler bölümü m13'ün veto kararıyla birlikte kalkar), m6 (event türetme mantığı)

### m6 · Etkinlik çipi composer'dan silinecek — **S (<1 saat)**

- `src/components/cadde/CaddeComposer.tsx:145-150`
- `src/components/cadde/CaddeComposer.test.tsx:54`
- `src/components/cadde/CaddeComposer.test.tsx:68-73`
- `src/components/cadde/CaddeFeedScopeBar.tsx:24`

**Mevcut:** Ek şeridinde 'Etkinlik' AttachmentChip'i var (satır 145-150); tıklanınca type 'event'↔'text' arasında değişiyor — post tipi bu ekten türetiliyor (dosya başı yorum, satır 5-6). İki test bunu doğruluyor (test:54 varlık, test:68-73 türetme).

**Yapılacak:** Etkinlik çipi ve type-türetme onClick'i silinecek; m5 ile birlikte type kalıcı 'text' olur. İlgili 2 test kaldırılacak/güncellenecek. NOT: CaddeFeedScopeBar'daki 'Etkinlikler' kapsamı (satır 24) kalıyor ama yeni event üretilemeyeceği için ölü kapsam olur — karar notu düşülmeli (kaldır ya da 'Yakında' yap).

**Bağımlılık:** m5 ile aynı PR'da yapılmalı (type türetme mantığı ortak)

### m7 · Foto+video yükleme kalacak, uçtan uca test yazılacak — **M (~yarım gün)**

- `src/components/cadde/CaddeComposer.tsx:64-87`
- `src/components/cadde/CaddeComposer.tsx:121-138`
- `src/lib/cadde-media.ts:21-26`
- `src/lib/cadde-media.ts:79-104`
- `src/lib/cadde-media.ts:118-145`
- `e2e/cadde-mobile-audit.spec.ts:1`

**Mevcut:** Yükleme zinciri tam: handleFiles sıralı validate+upload yapıyor (CaddeComposer.tsx:64-87), gizli file input'lar + Fotoğraf/Video çipleri (121-138), limitler SQL cadde_validate_media ile ayna sözleşmesi (cadde-media.ts:21-26, max 4 görsel/1 video, 5MB/50MB), upload cadde-media bucket'ına {uid}/{scope}/{uuid} yoluyla (118-145). ANCAK cadde-media.ts:8'in referans verdiği cadde-media.test.ts dosyası YOK ve mevcut e2e/cadde-mobile-audit.spec.ts hiç upload/composer senaryosu içermiyor (grep 0 sonuç).

**Yapılacak:** Kod değişikliği yok; eksik testler eklenecek: (1) cadde-media.test.ts — validateCaddeMediaFile limit/mime birim testleri + SQL ayna sözleşmesi sabitleri, (2) yeni Playwright e2e: login → foto+video ekle → Paylaş → feed kartında CaddeMediaGallery render doğrulaması (canlı login-gated olduğu için test kullanıcısı gerekir).

### m8 · Konum çipi 'Konum ekle'; default kayıtlı konum — **S (<1 saat)**

- `src/components/cadde/CaddeComposer.tsx:139-144`
- `src/components/cadde/CaddeComposer.tsx:177-213`
- `src/pages/cadde/CaddePage.tsx:161-167`
- `src/pages/cadde/CaddePage.tsx:478`
- `src/lib/cadde-rules.ts:14-15`
- `src/pages/cadde/CaddePage.tsx:93`

**Mevcut:** Çip etiketi 'Konum' (CaddeComposer.tsx:141). Hedef boş bırakılırsa AKTİF FİLTRE kullanılıyor: panelde 'boş = {filterCountryLabel}' seçeneği (satır 181-189), submit'te fallback 'composer.country || filters.countries[0] || ""' (CaddePage.tsx:166-167). Kullanıcının kayıtlı konumu hiç devrede değil — oysa get_cadde_actor_context zaten country/city döndürüyor (cadde-rules.ts:14-15) ve CaddePage.tsx:93'te yükleniyor (line 406'da viewerCity olarak kullanılıyor).

**Yapılacak:** Çip etiketi 'Konum ekle' olacak; CaddeComposer'a actorContext country/city prop geçilecek; default hedef zinciri 'composer seçimi → kullanıcının kayıtlı ülke/şehri' olarak değişecek (filtre fallback'i kalkar), paneldeki '__filter__' seçeneği 'Kayıtlı konumum (X)' olur. postMutation'daki fallback (166-167) aynı zincire çekilecek.

**Bağımlılık:** m11 (filtre-fallback'i kalkınca serbest global yol da kapanır — birlikte kararlaştırılmalı)

### m9 · Konum drill-down: +1 ülke VEYA +1 şehir — **L (1+ gün)**

- `src/lib/cadde-composer.ts:24-25`
- `src/components/cadde/CaddeComposer.tsx:177-213`
- `src/lib/cadde-api.ts:575-588`
- `supabase/migrations/applied/20260730120000_cadde_v1_002_hashtags_mentions.sql:378`
- `supabase/migrations/applied/20260730170000_cadde_v1_007_geo_matching.sql:394-395`
- `src/lib/cadde-ranking.ts:56-63`

**Mevcut:** Veri modeli TEK hedef: CaddeComposerValue'da tekil country/city string (cadde-composer.ts:24-25), panelde tek Ülke+Şehir select çifti (CaddeComposer.tsx:177-213), RPC tekil p_country/p_city alıyor (cadde-api.ts:579-580; SQL create_cadde_post_v1 20260730120000:378), feed eşleşmesi post başına tek country_id/city_id üzerinden (geo_matching:394-395 same_city/same_country).

**Yapılacak:** Composer modeline ikinci hedef eklenecek (extraCountry XOR extraCity, max 1). DB tarafı gerekiyor: posts'a ek hedef kolonu ya da cadde_post_targets tablosu + create_cadde_post_v1 yeni parametre + list_cadde_feed_v1 same_city/same_country eşleşmesinin ek hedefi de kapsaması + cadde-ranking.ts TS aynası ve testlerinin güncellenmesi (ayna sözleşmesi zorunlu).

**Bağımlılık:** m8 (default konum zinciri önce oturmalı); ayna sözleşmesi: SQL↔cadde-ranking.ts birlikte değişmeli

### m10 · Çoklu ülke/şehir premium'a kilitli (kapalı) — **S (<1 saat)**

- `src/components/cadde/CaddeComposer.tsx:177-213`
- `src/lib/cadde-carsi-api.ts:38`
- `src/lib/cadde-rules.ts:117-128`

**Mevcut:** Premium kavramı cadde'de yok; birden fazla hedef zaten teknik olarak mümkün değil (m9'daki tekil model). Ürün limitleri cadde_settings'te tutuluyor (örnek okuma: cadde-carsi-api.ts:38; CLAUDE.md kuralı: product limits/flags = cadde_settings).

**Yapılacak:** m9'un +1 hedef sınırı UI'da sabitlenecek: ikinci ekleme denemesinde disabled 'Premium ile' rozeti/tooltip gösterilecek, işlev BAĞLANMAYACAK (kapalı). Limit cadde_settings'e anahtar olarak yazılacak (ör. composer_max_extra_targets=1) ki açılış günü kod değişikliği gerektirmesin. Yeni RPC hata kodu gerekmez (yazma yolu açılmıyor).

**Bağımlılık:** m9 (ek hedef altyapısı olmadan gösterilecek bir üst sınır yok)

### m11 · Serbest global yok; globale çıkış performans eşiği — **L (1+ gün)**

- `src/pages/cadde/CaddePage.tsx:166-167`
- `src/pages/cadde/CaddePage.tsx:478`
- `src/components/cadde/CaddeComposer.tsx:180-189`
- `supabase/migrations/applied/20260730170000_cadde_v1_007_geo_matching.sql:365-371`
- `src/lib/cadde-ranking.ts:56-63`
- `src/lib/cadde-ranking.test.ts:1`

**Mevcut:** Bugün serbest global FİİLEN VAR: hedef ve filtre boşsa countryId '' gidiyor (CaddePage.tsx:166-167) ve panel 'boş = Global' gösteriyor (filterCountryLabel='Global', CaddePage.tsx:478 + CaddeComposer.tsx:181). Feed'de geo-dışı postlar eşiksiz herkese görünüyor: band case'inde F (else 6) tüm global postları kapsıyor (geo_matching:365-371; TS aynası computeCaddeBand cadde-ranking.ts:56-63) — D/E bandları yalnız sıralamayı etkiliyor, görünürlüğü kısıtlamıyor.

**Yapılacak:** (1) Composer'dan global hedef yolu kapanır — m8 ile default kayıtlı konum olur, '' fallback silinir. (2) list_cadde_feed_v1'e görünürlük eşiği eklenir: izleyicinin ülkesi dışındaki postlar yalnız beğeni>=10 VEYA paylaşım>=10 ise akışa girer; eşik değerleri cadde_settings'e yazılır. (3) cadde-ranking.ts + cadde-ranking.test.ts TS aynası aynı kuralla güncellenir. Paylaşım sayacı m12'ye bağlı — m12'siz eşik yalnız beğeniyle başlar.

**Bağımlılık:** m8 (composer default'u) ve m12 (paylaşım sayacı yoksa '10 paylaşım' ölçülemez); SQL↔cadde-ranking.ts ayna sözleşmesi

### m12 · Feed kartına 'Paylaş' (share) butonu eklenecek — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:582-658`
- `src/components/directory/public-profile/PublicProfileQuickActions.tsx:16-23`
- `src/components/MapShareButtons.tsx:35-42`
- `src/App.tsx:197-231`
- `src/lib/cadde-api.ts:571-591`

**Mevcut:** Feed kartı aksiyon satırında yalnız 3 aksiyon var: Tepki Ver popover'ı (CaddePage.tsx:590-631), yorum toggle (633-645), şikayet bayrağı (646-657). Cadde dosyalarında hiç navigator.share/clipboard kullanımı yok (grep 0 sonuç); mevcut paylaşım desenleri başka modüllerde (PublicProfileQuickActions.tsx:16-23 share+clipboard fallback, MapShareButtons.tsx:35-42). Post detay route'u da yok — cadde route'ları yalnız /cadde, /cadde/cafe/:cafeId, /cadde/carsi[/:itemId] (App.tsx:197-231).

**Yapılacak:** Aksiyon satırına 'Paylaş' butonu: PublicProfileQuickActions deseniyle navigator.share + clipboard fallback. Paylaşılabilir URL için en hafif çözüm /cadde?post=<id> query param'ı + sayfada ilgili karta scroll/highlight (SEO-locked route eklemeden). m11'in '10 paylaşım' eşiği isteniyorsa ayrıca share sayacı: yeni security-definer RPC (ban kill-switch'li has_cadde_feature kapsamında) + posts'ta share_count — RPC hata kodları cadde-rules.ts Türkçe haritasına eklenmeli.

**Bağımlılık:** m11 eşiği paylaşım sayacına ihtiyaç duyarsa DB kısmı m11 ile koordine edilmeli; /cadde canlıda login-gated — paylaşılan link anonimde login'e düşer (kabul edilmiş durum)

### m13 · Konu/etiket seçimi VETO — UI kalkar, altyapı rezervde — **S (<1 saat)**

- `src/components/cadde/CaddeComposer.tsx:241-267`
- `src/components/cadde/CaddeComposer.tsx:27`
- `src/lib/cadde-targeting.ts:35`
- `src/lib/cadde-api.ts:573-574`
- `src/lib/cadde-ranking.ts:27-29`
- `src/pages/cadde/CaddePage.tsx:563-580`

**Mevcut:** Etiket seçimi Detaylar panelinin içinde: interestCatalog chip'leri max 3 seçim, ilki birincil ihtiyaç (CaddeComposer.tsx:241-267, toggleInterestSelection cadde-targeting.ts:35). createCaddePost interests'i doğrulayıp needCategory türetiyor (cadde-api.ts:573-574), ranking perInterest/interestCap/needMatch ağırlıkları kullanıyor (cadde-ranking.ts:27-29), feed kartı interest rozetlerini basıyor (CaddePage.tsx:563-580 — serbest #hashtag'ler AYRI sistem, veto kapsamı dışında).

**Yapılacak:** Yalnız composer girişi kaldırılır (m5'in panel silme işiyle otomatik gider): interestCatalog/interests prop'ları ve toggleInterestSelection import'u CaddeComposer'dan çıkar. REZERVDE tutulacaklar — SİLİNMEZ: caddePostCreateSchema.interests, RPC p_interests/p_need_category, ranking ağırlıkları, feed rozetleri (eski postlar için) ve cadde-targeting.ts. Karar notu koda yorum olarak düşülür.

**Bağımlılık:** m5 (aynı panelin parçası — birlikte uygulanmalı)


## Akış (m14-m18)

### m14 · Akış filtre çiplerine kısa açıklama ekle — **S (<1 saat)**

- `src/components/cadde/CaddeFeedScopeBar.tsx:13`
- `src/components/cadde/CaddeFeedScopeBar.tsx:20`
- `src/components/cadde/CaddeFeedScopeBar.tsx:38`
- `src/pages/cadde/CaddePage.tsx:494`

**Mevcut:** Kapsam çipleri (Tümü/Şehrim/Ülkem/Etkinlikler/Cafelerim...) CaddeFeedScopeBar.tsx:20-29'daki SCOPES dizisinden yalnız label ile render ediliyor (satır 41-61); hiçbir çipin ne işe yaradığını anlatan metin/tooltip yok — tek title niteliği comingSoon çiplerdeki "Yakında" (satır 50). Sol kolondaki Konum filtresinin ise zaten açıklaması var (CaddePage.tsx:312, 336-338).

**Yapılacak:** ScopeOption tipine (satır 13-18) `description` alanı ekle, SCOPES'a her kapsam için 1 cümlelik Türkçe açıklama yaz; aktif çipin açıklamasını çip barının altında küçük metin olarak göster (ve/veya her çipe title tooltip ver). Filtrelerin kendisi aynen korunur.

### m15 · Takip Ettiklerim ve İş Fırsatları çipleri kaldır — **S (<1 saat)**

- `src/components/cadde/CaddeFeedScopeBar.tsx:27`
- `src/components/cadde/CaddeFeedScopeBar.tsx:28`
- `src/lib/cadde-format.ts:26`
- `src/lib/cadde-types.ts:220`

**Mevcut:** SCOPES dizisinde `{ key: "following", label: "Takip Ettiklerim", comingSoon: true }` (satır 27) ve `{ key: "jobs", label: "İş Fırsatları", comingSoon: true }` (satır 28) var; comingSoon olduğu için disabled + "Yakında" rozetiyle görünüyorlar (satır 47, 58). URL parse whitelist'i cadde-format.ts:26 FEED_SCOPES ve tip birliği cadde-types.ts:220 CaddeFeedScope bu iki anahtarı içeriyor.

**Yapılacak:** 27-28. satırlardaki iki girdiyi SCOPES'tan sil (çipler kaybolur). İsteğe bağlı temizlik: "following" ve "jobs"u CaddeFeedScope tipinden ve FEED_SCOPES parse listesinden de çıkar (?akis=following artık 'all'a düşer). Not: tip, list_cadde_feed_v1 SQL sözleşmesinin aynasıdır (cadde-types.ts:217 yorumu) — SQL tarafı dokunulmadan sadece TS daraltılabilir. "Yakınımda" (satır 26) bu maddede anılmadığı için kalıyor.

### m16 · Yeni paylaşım çipi yenileme sonrası sıfırlanmıyor — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:240`
- `src/pages/cadde/CaddePage.tsx:241`
- `src/pages/cadde/CaddePage.tsx:508`
- `src/lib/cadde-api.ts:713`

**Mevcut:** Baseline `newestLoadedAt = feedQuery.data?.pages[0]?.items[0]?.createdAt` (satır 240) — ama feed CKS skoruyla sıralı (pinned/yüksek skorlu eski post en üstte kalabilir), yani items[0] EN YENİ post değil. countCaddePostsSince (cadde-api.ts:713-730) bu tarihten yenileri `gt(created_at)` ile sayar; yenileme sonrası üstteki post değişmezse sayı >0 kalır. Ayrıca butonun onClick'i (satır 508-511) invalidate sonrası `newPostsQuery.refetch()` ile ESKİ queryKey'i (eski timestamp) tekrar çalıştırıp bayat sayıyı yeniden üretiyor.

**Yapılacak:** Baseline'ı yüklü tüm feed item'larının max(createdAt) değeriyle hesapla (items[0] değil) ve buton tıklandığında sıfırlamayı garanti et: eski anahtarla refetch etme, bunun yerine invalidate sonrası sayacı 0'a çek (setQueryData) veya `lastRefreshedAt` state'i tutup sayım baseline'ında max(newestLoadedAt, lastRefreshedAt) kullan.

### m17 · Post başlığındaki tip rozetini kaldır — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:548`
- `src/pages/cadde/CaddePage.tsx:47`
- `src/lib/cadde-composer.ts:11`

**Mevcut:** Feed kartı başlık satırında isim + rol rozetinin yanında `<Badge variant="outline">{POST_TYPE_LABELS[item.post.type] ?? item.post.type}</Badge>` (satır 548) tip etiketi ("Soru", "Paylaşım", "İlan / Teklif", "Etkinlik" — kaynak: cadde-composer.ts:11-16) gösteriliyor.

**Yapılacak:** 548. satırdaki Badge'i sil. POST_TYPE_LABELS importu (satır 47) ve 62-63'teki yorum artık feed'de kullanılmıyorsa temizle (composer seçicisi CaddeComposer.tsx:223-224'te kullanmaya devam eder, oraya dokunma). Madde 18 ile aynı JSX bloğu — birlikte yapılmalı.

**Bağımlılık:** Madde 18 ile aynı başlık bloğu (CaddePage.tsx:541-556) — tek PR'da birlikte ele alınmalı

### m18 · Post başlığı forum hiyerarşisine geçsin — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:541`
- `src/pages/cadde/CaddePage.tsx:544`
- `src/pages/cadde/CaddePage.tsx:550`
- `src/pages/cadde/CaddePage.tsx:556`

**Mevcut:** Mevcut sıra: en üstte yazar adı bold (satır 544 `font-semibold`), yanında rol/Pinned/Köprü/tip rozetleri (545-548), altında ülke•şehir•tarih meta satırı (550-552), konu başlığı ise EN ALTTA ve opsiyonel (satır 556: `{item.post.title ? <h3 className="text-lg font-semibold">...}` — başlıksız postta hiç görünmez).

**Yapılacak:** 541-556 bloğunu yeniden sırala: konu (title) büyük h3 olarak en üste, yazar adı küçük (text-xs/sm) altına, onun altına ülke/şehir/tarih meta satırı. Başlıksız postlar için karar gerekir (gövdenin ilk satırı mı, başlıksız düzen mi). Pinned/Köprü rozetlerinin yeni konumu da bu düzende belirlenmeli.

**Bağımlılık:** Madde 17 (tip rozeti silme) aynı blokta; başlıksız post fallback kararı gerekli


## Tepkiler ve Yorumlar (m19-m25)

### m19 · Tepki popover'ı kalksın, emojiler doğrudan açık — **S (<1 saat)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:582-632`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:595`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:599`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:27`

**Mevcut:** Tepkiler bir IIFE içinde Popover'a gizli: PopoverTrigger butonu aria-label="Tepki ver" (satır 595) ve 'Tepki Ver (N)' metni (599) taşıyor; 3 tepki butonu (REACTION_META map'i, satır 604-627) yalnız PopoverContent (602-629) açılınca görünüyor.

**Yapılacak:** Popover/PopoverTrigger/PopoverContent sarmalayıcısı kaldırılıp REACTION_META butonları aksiyon satırına (582'deki flex div) LinkedIn tarzı doğrudan render edilecek; 'Tepki Ver' metni ve tetik butonu silinecek, sayaçlar butonların üstünde kalacak; Popover importu (satır 27) başka kullanıcı yoksa temizlenecek.

**Bağımlılık:** m20 ile aynı JSX bloğu — birlikte yapılmalı (emoji seti değişince buton içeriği de değişiyor)

### m20 · Negatifsiz 5'li emoji seti: +kalp/gülme/emin-olamadım — **M (~yarım gün)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:56-60`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-types.ts:6`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-schemas.ts:211`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-api.ts:72`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-api.ts:272`
- `c:/temp_private/corteqs/corteqs_fin/supabase/migrations/applied/20260529213000_create_cadde_mvp.sql:58`
- `c:/temp_private/corteqs/corteqs_fin/supabase/migrations/applied/20260611130000_cadde300_011_bildirim_moderasyon.sql:294`
- `c:/temp_private/corteqs/corteqs_fin/supabase/migrations/applied/20260611130000_cadde300_011_bildirim_moderasyon.sql:327`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-schemas.test.ts:96-98`

**Mevcut:** Set 3'lü: like/support/idea (Beğendim/Destek/Fikir, lucide ikonlu — REACTION_META satır 56-60); 'beğenmedim' zaten yok. Kısıt 4 katmanda kilitli: CaddeReactionType union (types:6), zod enum (schemas:211), emptyReactions+totalReactionCount toplamı (api:72,272), DB CHECK constraint (mvp.sql:58) ve toggle_cadde_reaction_v1 içi validasyon+bildirim etiketi CASE'i (011.sql:294,327).

**Yapılacak:** Final set beğendim/kalp/gülme/destek/emin-olamadım: TS union+zod enum+REACTION_META'ya 'love','laugh','unsure' eklenecek (ikon yerine emoji karakteri), 'idea' UI'dan çıkacak (mevcut idea satırları DB'de kalır, sayımda karar gerek); emptyReactions ve totalReactionCount yeni anahtarları kapsayacak. YENİ migration: cadde_post_reactions CHECK genişletme + toggle_cadde_reaction_v1 validasyon ve bildirim CASE güncelleme (SQL↔TS ayna sözleşmesi kuralı geçerli); schemas.test güncellenecek.

**Bağımlılık:** m19 ile aynı blok; 'idea' verisinin akıbeti (gizle mi say mı) ürün kararı

### m21 · Yorum sayısı + tıkla-aç + load-more sayfalama — **M (~yarım gün)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:644`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:667-678`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-api.ts:160-166`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-api.ts:204-211`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-api.ts:273-281`
- `c:/temp_private/corteqs/corteqs_fin/src/lib/cadde-query-keys.ts:11`

**Mevcut:** 'N yorum' etiketi butonda ZATEN var (satır 644). Asıl sorun DB yükü: feed yüklenirken TÜM yorumlar eager çekiliyor — fetchPostComments sayfadaki her postun bütün yorumlarını limitsiz select ediyor (api:204-211), commentCount istemcide length ile türetiliyor (273), ilk 2 yorum hep render (667), 'aç' yalnız istemci tarafında kalanını gösteriyor; sunucu taraflı load-more yok.

**Yapılacak:** Yorumlar feed sorgusundan ayrılacak: sayı aggregate ile gelecek (list_cadde_feed_v1'e comment_count eklemek veya head:true count sorgusu), yorumlar ancak panel açılınca yeni listCaddeComments(postId, cursor, limit) API'si + caddeQueryKeys'e comments anahtarı ile sayfalı çekilecek; panel altına 'daha fazla yorum' butonu.

**Bağımlılık:** m23 hedefli yorum auto-refresh'i bu ayrıma dayanır

### m22 · Yorum kutusunda Enter ile gönderme — **S (<1 saat)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:687-693`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:694-701`
- `c:/temp_private/corteqs/corteqs_fin/src/components/cadde/MentionTextarea.tsx:91-93`

**Mevcut:** Yorum Textarea'sında (687-693) onKeyDown yok; gönderim yalnız 'Gönder' butonuyla (694-701) commentMutation.mutate çağrısı. MentionTextarea'da Enter+!shiftKey deseni zaten mevcut (91-93) ama o mention seçimi için.

**Yapılacak:** Textarea'ya onKeyDown eklenecek: Enter (shiftsiz) → preventDefault + commentMutation.mutate({postId, body}), Shift+Enter satır atlar; boş gövdede no-op ve isPending'de tekrar göndermeyi engelle.

### m23 · Yeni yorum/paylaşım için otomatik yenileme — **M (~yarım gün)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:120-125`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:239-247`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:502-515`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:147-152`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:206-209`

**Mevcut:** feedQuery'de (120-125) refetchInterval yok. Tek otomatik mekanizma: 60 sn'de bir yalnız YENİ POST SAYISINI sayan newPostsQuery (239-247, refetchInterval:60_000) + elle tıklanan 'N yeni paylaşım — yenile' çipi (502-515). Yorumlar sadece kullanıcının KENDİ mutasyonundan sonra invalidateCadde ile tazeleniyor (147-152, 206-209) — karşı tarafın yorumu kendiliğinden görünmüyor.

**Yapılacak:** Açık yorum paneline hedefli refetchInterval (~30 sn, m21'deki ayrı yorum query'si üzerinde) + feedQuery'ye refetchOnWindowFocus; alternatif/ek olarak cadde_post_comments ve cadde_posts üzerinde Supabase Realtime kanalı ile caddeQueryKeys.feedRoot invalidation. Mevcut 'yeni paylaşım' çipi korunur (spec §17.3 stream-yok kararına dokunmadan hafif polling).

**Bağımlılık:** m21 (yorumların ayrı query olması hedefli refresh'in önkoşulu)

### m24 · Yorum layout'u jilet gibi sıkıştırılacak — **S (<1 saat)**

- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:662-665`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:666`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:668-671`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:692`

**Mevcut:** Her yorum kendi kartında: rounded-2xl border bg-white px-4 py-3 (668), yazar adı ayrı satır (669), gövde mt-1 (670); panel rounded-[24px] p-4 (662-665), liste space-y-3 (666); yorum girişi min-h-[88px] Textarea (692) — dikeyde çok yer yiyor.

**Yapılacak:** Sıkı düzen: kart padding'i px-3 py-1.5-2'ye, liste space-y-1.5'e, 'yazar · saat' tek satır inline + gövde hemen altında (mt-0), panel p-2-3 ve küçük radius; giriş alanı tek satır yüksekliğine (min-h kaldır, rows=1 auto-grow). Zaman damgası eklemek için comment.createdAt zaten mapleniyor (cadde-api.ts:280).

**Bağımlılık:** m21/m22 aynı panel JSX'ine dokunuyor — çakışmayı önlemek için sırayla

### m25 · WhatsApp tarzı emoji seçici (yorum+composer) — **M (~yarım gün)**

- `c:/temp_private/corteqs/corteqs_fin/src/components/cadde/CaddeComposer.tsx:99-115`
- `c:/temp_private/corteqs/corteqs_fin/src/components/cadde/CaddeComposer.tsx:137-150`
- `c:/temp_private/corteqs/corteqs_fin/src/components/cadde/MentionTextarea.tsx:99-121`
- `c:/temp_private/corteqs/corteqs_fin/src/pages/cadde/CaddePage.tsx:686-702`
- `c:/temp_private/corteqs/corteqs_fin/package.json:84`

**Mevcut:** Hiçbir yerde emoji seçici yok: package.json'da emoji bağımlılığı yok (tek 'picker' react-day-picker, satır 84). Composer MentionTextarea + AttachmentChip şeridi kullanıyor (Fotoğraf/Video/Konum/Etkinlik, 137-150); yorum kutusu düz shadcn Textarea (CaddePage 687-693). Emoji ancak OS klavyesinden girilebiliyor.

**Yapılacak:** Kategorili emoji grid'i shadcn Popover içinde ortak bir CaddeEmojiPicker bileşeni olarak: composer'da chip şeridine Smile chip'i (137-150 arasına), yorumda Textarea yanına ikon buton (686-702). Caret pozisyonuna ekleme için MentionTextarea zaten caret state tutuyor (99-121) — insertAtCaret yardımcısı expose edilmeli; yorum Textarea'sı için selectionStart ile ekleme. Kütüphane kararı: hafif custom set vs emoji-mart (yeni bağımlılık).

**Bağımlılık:** Kütüphane vs custom set kararı; m22 ile aynı yorum kutusu JSX'i


## Tasarım ve Layout (m26-m31)

### m26 · Cadde genelinde buton inceltme ve boşluk azaltma — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:303`
- `src/pages/cadde/CaddePage.tsx:316`
- `src/pages/cadde/CaddePage.tsx:362`
- `src/pages/cadde/CaddePage.tsx:540`
- `src/pages/cadde/CaddePage.tsx:787`
- `src/pages/cadde/CaddePage.tsx:820`
- `src/pages/cadde/CaddeCarsiPage.tsx:261`
- `src/pages/cadde/CaddeCarsiPage.tsx:266`
- `src/components/cadde/CaddeComposer.tsx:162`

**Mevcut:** Ana aksiyon butonları tam genişlik + hap formunda: 'Caddeye Çık' (CaddePage:316-324) ve 'Kişileri Keşfet' (362-367) w-full rounded-2xl, billboard CTA (787) ve 'Başvuru Gönder' (820) yine w-full rounded-2xl; Çarşı boş-durum butonları da rounded-2xl (CaddeCarsiPage:261,266). Boşluklar geniş: grid gap-6 py-6 (CaddePage:303), aside/orta kolon space-y-5 (304,395), feed kartı içi space-y-4 p-5 sm:p-6 (540).

**Yapılacak:** Butonları size="sm"/h-9'a indir, w-full olanları içerik genişliğine daralt, rounded-2xl → rounded-lg; dikey ritmi gap-6→gap-4, space-y-5→space-y-3, p-5/p-6→p-4 seviyesine çek. Değişiklik 4 cadde sayfası + CaddeComposer'da tutarlı uygulanacak (rounded-2xl/rounded-[2x] toplam ~55 kullanım, 14 cadde dosyası).

**Bağımlılık:** m27 palet ve m30 yerleşim değişikliğiyle aynı dosyalarda — tek görsel geçişte birlikte yapılmalı

### m27 · Logo koyu renklerinden yüksek kontrastlı palet — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:279`
- `src/pages/cadde/CaddePage.tsx:283`
- `src/pages/cadde/CaddeCarsiPage.tsx:130`
- `src/pages/cadde/CaddeCafePage.tsx:152`
- `src/pages/cadde/CaddeCarsiItemPage.tsx:76`
- `src/pages/cadde/CaddePage.tsx:522`
- `src/pages/cadde/CaddePage.tsx:744`
- `src/components/SiteHeader.tsx:43`

**Mevcut:** 4 cadde sayfasının zemini aynı pastel krem gradyan inline hex'i: bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)] (CaddePage:279, CaddeCarsiPage:130, CaddeCafePage:152, CaddeCarsiItemPage:76); kartlar bg-white/90 + border-orange-100, rozet #ffefe0/#9a4b18 (283), sponsor/pano kartları da açık amber gradyanlar (522, 744) — 'silik' görünümün kaynağı bu. Logonun koyu marka renkleri (SiteHeader'da kullanılan #1E3A8A lacivert, #ee652b turuncu, #34A853 yeşil — SiteHeader.tsx:43,52,59) cadde'de hiç yok; 'cadde-shell' sınıfı CaddePage:279'da duruyor ama index.css'te tanımı yok (grep: 0 eşleşme).

**Yapılacak:** cadde-shell sınıfını index.css'te CSS değişkenleriyle tanımlayıp koyu logo paletini (lacivert/turuncu/yeşil) tek kaynaktan ver; 4 sayfadaki inline pastel gradyan hex'lerini ve orange-100/amber-200 tonlarını bu değişkenlerle, metin/zemin kontrastı WCAG AA olacak şekilde değiştir.

**Bağımlılık:** m26 ile aynı dosyalar/satırlar — birlikte tek geçişte uygulanmalı

### m28 · Footer tüm sayfalarda sadeleştirilip inceltilecek — **M (~yarım gün)**

- `src/components/Footer.tsx:68`
- `src/components/Footer.tsx:71`
- `src/components/Footer.tsx:93`
- `src/components/Footer.tsx:135`
- `src/components/FooterSection.tsx:4`
- `src/components/PublicLayout.tsx:10`
- `src/components/footerLinks.ts:38`

**Mevcut:** Footer.tsx tek footer'dır ve PublicLayout:10 → FooterSection:4 üzerinden cadde dahil tüm public sayfalarda render olur (cadde rotaları PublicLayout içinde, App.tsx:109+197). Ağır yapı: py-8…lg:py-20 dikey dolgu (Footer:68), dekoratif aurora+grid+DiasporaNetworkLayer katmanları (71-77), 8 sosyal ikon sm:h-20 sm:w-20 dev boyutta (93), glass kart rounded-[2rem] (80), 13 düz link (footerLinks.ts:38) + uzun SEO backlink paragrafı (135-206).

**Yapılacak:** Dekoratif katmanları (aurora/grid/DiasporaNetworkLayer, 71-77) kaldır, ikonları h-9 civarına küçült, py-20'yi py-6-8'e indir, glass kartı düz ince bir bar'a çevir; link satırı + telif satırı kompaktlaşacak (SEO backlink bloğunun kalıp kalmayacağı ayrı ürün kararı — görsel ağırlığı her durumda düşürülecek). Tek dosya değişikliği tüm sayfalara yansır.

### m29 · Cadde içindeki tekrar eden ana menü kaldırılacak — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:65`
- `src/pages/cadde/CaddePage.tsx:286`
- `src/pages/cadde/CaddePage.tsx:287`
- `src/components/SiteHeader.tsx:39`
- `src/App.tsx:197`

**Mevcut:** SECONDARY_NAV sabiti (CaddePage:65-72: Cadde/İş/Sosyal/Harita/Giriş Yap/Kayıt Ol) 286-299'da hap-link satırı olarak render ediliyor; repo genelinde tek kullanım yeri burası. Sayfa PublicLayout içinde olduğundan üstte sticky SiteHeader zaten var; /cadde RequireAuth arkasında (App.tsx:197-204) olduğundan Giriş/Kayıt linkleri ayrıca işlevsiz. DİKKAT: SiteHeader'da Cadde/İş/Sosyal/Harita linkleri aslında YOK (yalnız Araçlar/Feedback/Profilim/Çıkış, SiteHeader.tsx:39-96) — 'üst menüde zaten var' varsayımı kodda doğrulanamadı.

**Yapılacak:** CaddePage:65-72 sabitini ve 286-299 render bloğunu sil; aynı satırdaki NotificationsBell (287) korunup 282-285'teki başlık şeridine taşınacak; kullanılmayan Link importları temizlenecek. Cadde/İş/Sosyal/Harita erişimi gerekiyorsa SiteHeader'a eklenmesi ayrı karar olarak nota düşülmeli.

**Bağımlılık:** Karar: bu linklerin SiteHeader'a taşınıp taşınmayacağı workshop'ta netleşmeli

### m30 · Sol kolon yeniden sıralama, sağ kolon yalnız reklam — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:304`
- `src/pages/cadde/CaddePage.tsx:305`
- `src/pages/cadde/CaddePage.tsx:307`
- `src/pages/cadde/CaddePage.tsx:353`
- `src/pages/cadde/CaddePage.tsx:371`
- `src/pages/cadde/CaddePage.tsx:396`
- `src/pages/cadde/CaddePage.tsx:413`
- `src/pages/cadde/CaddePage.tsx:742`
- `src/components/ui/accordion.tsx:1`

**Mevcut:** Sol aside (304-393) sırası bugün: CarsiGlobalTicker (305), Konum kartı (Caddeye Çık + geo filtre + Köprü switch, 307-351), İnsanları Keşfet (353-369), Cafeler özet kartı (371-392). Orta kolonda akış hemen başlamıyor: önce 'Diaspora Cadde' başlık kartı + dünya saatleri (396-411) ve 'Aktif Cafeler' tam bloğu (413-467), composer (469-492) ve akış sonra geliyor. Sağ aside (742-825) reklam dışı içerik de taşıyor: CorteQS Panosu (744-766), trend hashtag (768), PromotionRail (770), billboard (772-803), 'Görünür Ol' (805-824).

**Yapılacak:** Sol kolonu Konum+Köprü+İnsanları Keşfet tepede kalacak, altında başka blok olmayacak şekilde ayıkla (Çarşı ticker'ı ve Cafeler özetini sol'dan çıkar); orta kolonda 396-411 ve 413-467 bloklarını akışın üstünden kaldırıp feed'i yukarı çek; sağ kolonu yalnız reklam/tanıtım (PromotionRail + billboard + sponsor) bırak. Konum/Köprü/Keşfet üçlüsünü mevcut shadcn Accordion primitifiyle (src/components/ui/accordion.tsx) tek akordeon kartta birleştirme denemesi yapılacak.

**Bağımlılık:** m31 (Cafeler tekrarı) ve m29 (üst şerit) aynı dosyada — birlikte tek refactor'da yapılmalı

### m31 · Kafeler bloğunun iki yerdeki tekrarı giderilecek — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:371`
- `src/pages/cadde/CaddePage.tsx:413`
- `src/pages/cadde/CaddePage.tsx:127`

**Mevcut:** Aynı cafesQuery verisi (CaddePage:127-130) iki blokta gösteriliyor: (1) sol kolonda 'Cafeler' özet kartı — activeCafes.slice(0,3) (371-392), (2) orta kolonda 'Aktif Cafeler' tam grid'i — activeCafes.map + '+ Cafe Aç' butonu ve boş-durum kartı (413-467).

**Yapılacak:** Sol kolondaki özet kartı (371-392) sil, tek kaynak olarak 413-467'deki 'Aktif Cafeler' bloğu kalsın; bu bloğun yeni konumu (feed altı / sağ kolon) m30'daki yerleşim kararına göre belirlenecek.

**Bağımlılık:** m30 yerleşim kararı


## Erişim ve Köprü (m32-m38)

### m32 · Cadde login zorunluluğu — fiilen tamamlanmış — **S (<1 saat)**

- `src/App.tsx:196-235`
- `src/components/auth/RequireAuth.tsx:13-18`
- `src/pages/cadde/CaddePage.tsx:481-492`
- `src/pages/cadde/CaddePage.tsx:704-708`

**Mevcut:** /cadde ve 3 alt rotanın tümü App.tsx'te RequireAuth + RequireFeature(caddeAccess) ile sarılı (App.tsx:196-235); RequireAuth.tsx:13-18 session yoksa /login?next=... yönlendiriyor. Canlıdaki 'login-gated' ölçümüyle birebir uyumlu — madde FİİLEN BİTMİŞ.

**Yapılacak:** Kod değişikliği gerekmez. Opsiyonel temizlik: CaddePage içinde artık hiç render olamayan anonim dalları kaldır — 'Ziyaretçiler akışı görebilir... giriş yap' kartı (481-492) ve yorum panelindeki anon 'giriş yap' dalı (704-708) ölü kod ve yanıltıcı metin.

### m33 · +90 kullanıcı caddede yalnız Köprü görsün — **L (1+ gün)**

- `supabase/migrations/applied/20260610182000_cadde300_003_actor_context.sql:63-72`
- `supabase/migrations/applied/20260610183000_cadde300_004_post_rpc_rls.sql:80-87`
- `supabase/migrations/applied/20260611100000_cadde300_008_cafe.sql:167-171`
- `src/lib/cadde-rules.ts:70-78`
- `src/lib/cadde-rules.ts:306-325`
- `src/pages/cadde/CaddePage.tsx:120-130`
- `src/pages/cadde/CaddePage.tsx:326-349`
- `src/lib/cadde-api.ts:133-155`
- `src/hooks/cadde/useCaddeActorContext.ts:11-22`

**Mevcut:** 'TR kullanıcı' kimliği bugün TELEFONDAN DEĞİL profil ülke attribute'undan geliyor (is_tr_resident: country ∈ türkiye/turkiye/tr — actor_context.sql:63-72). TR yerleşik kullanıcı caddede HER ülke/şehir akışını serbestçe görüyor; kısıt yalnız yazmada (bridge dışı postta cadde_tr_scope_restricted, 004_post_rpc_rls.sql:80-87) ve TR-cafe katılımında (+90 kontrolü sadece can_join_cadde_cafe'de, 008_cafe.sql:167-171). Actor context'te hasTRPhone alanı yok (cadde-rules.ts:306-325).

**Yapılacak:** Kimliği doğrulanmış +90 numaraya bağla: SQL'e is_tr_phone (user_verifications.phone_e164 like '+90%' + phone_verified_at) ekle, get_cadde_actor_context'e hasTRPhone alanı ekle ve mapActorContext'i genişlet. Bu kullanıcılar için GÖRÜNTÜLEMEYİ kısıtla: CaddePage'de geo filtre + scope barı gizlenip bridge=true'ya sabitlenir (326-349, 494-499), list_cadde_feed_v1 ve listCaddeCafes'e viewer-scope enforce eklenir. SQL↔TS ayna sözleşmesi + truth-table testleri güncellenmeli.

**Bağımlılık:** m34 ile ortak kimlik kararı: yetkili kaynak telefon ülke kodu mu, profil ülkesi mi? Yeni migration gerekir; mevcut cadde_tr_scope_restricted davranışıyla çelişki çözülmeli.

### m34 · Doğrulanmış diaspora tam görünürlük garantisi — **M (~yarım gün)**

- `supabase/migrations/applied/20260610182000_cadde300_003_actor_context.sql:74-83`
- `supabase/migrations/applied/20260610182000_cadde300_003_actor_context.sql:55-59`
- `src/lib/cadde-rules.ts:50-56`
- `src/lib/cadde-rules.ts:74`
- `src/components/cadde/CaddeGeoFilter.tsx:31-206`
- `src/components/cadde/CaddeProfileGate.tsx:21-57`

**Mevcut:** Diaspora kimliği profil ülkesinden türetiliyor (country dolu VE TR değil — actor_context.sql:74-83); telefon doğrulaması yalnız cadde_settings 'cadde.phone_verification_required' bayrağı açıksa kapı koşulu (55-59, cadde-rules.ts:50-56). Bugün ZATEN tüm kullanıcılar tüm ülke+şehir filtrelerini ve Köprü switch'ini görüyor; diaspora yerleşik için canPostKopru true (cadde-rules.ts:74). Madde büyük ölçüde mevcut davranışın korunması.

**Yapılacak:** Diaspora kimliğini 'doğrulanmış +90 dışı numara'ya bağla (is_diaspora_resident'ı phone_e164 not like '+90%' + phone_verified_at üzerine taşı veya yeni fonksiyonla birleştir). m33 kısıtı devreye girerken bu grubun tam görünürlüğünün (tüm ülkeler + şehirler + Köprü) bozulmadığını cadde-rules truth-table testleriyle sabitle.

**Bağımlılık:** m33 ile aynı migration ve kimlik kararı; ayrıca 'doğrulanmış' tanımı için phone_verification_required bayrağının canlıda açılması kararı.

### m35 · Köprü switch'ine hover bilgi baloncuğu — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:341-349`
- `src/pages/cadde/CaddePage.tsx:547`
- `src/pages/cadde/CaddePage.tsx:434`

**Mevcut:** Köprü kartında yalnız sabit tek cümle var: 'TR-Diaspora arasında taşınma, iş ve mentorluk akışı' (CaddePage.tsx:345) + Switch (347). Hover tooltip/baloncuk yok; '4 hedef kitle' metni hiçbir yerde geçmiyor. Feed (547) ve cafe kartlarındaki (434) Köprü rozetleri de açıklamasız.

**Yapılacak:** Köprü kartına (341-349) shadcn Tooltip (mobil için Popover fallback) + Info ikonu ekle; içerik '4 hedef kitlenin buluşma köprüsü' metni. İstenirse aynı tooltip feed/cafe Köprü rozetlerine (547, 434) de uygulanır. Salt UI, DB değişikliği yok.

### m36 · Geo filtre kafe+paylaşım süzme — doğrulandı — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:120-130`
- `src/lib/cadde-api.ts:144-152`
- `src/lib/cadde-api.ts:295-307`
- `src/pages/cadde/CaddePage.tsx:235-237`
- `src/pages/cadde/CaddePage.tsx:329-335`

**Mevcut:** Davranış KANITLI şekilde mevcut: tek URL-tabanlı filters nesnesi hem feedQuery'ye (list_cadde_feed_v1 p_filters.countries/cities — cadde-api.ts:144-152) hem cafesQuery'ye (cadde_cafes üzerine .in('country_id')/.in('city_id') — cadde-api.ts:305-307) gidiyor; sidebar Cafeler kartı ve Aktif Cafeler bölümü aynı cafesQuery'den besleniyor (CaddePage.tsx:127-130).

**Yapılacak:** Davranış korunacak — kod değişikliği yok. m33 görüntüleme kısıtı eklenirken bu filtre zincirinin bozulmadığını sabitleyen bir regression testi (CaddePage.test.tsx: filtre değişimi → hem feed hem cafes query key değişimi) eklenmesi önerilir.

**Bağımlılık:** m33 uygulanırken koruma altına alınmalı.

### m37 · Ülke/şehir seçim bölümü layout düzeltmesi — **S (<1 saat)**

- `src/components/cadde/CaddeGeoFilter.tsx:86-94`
- `src/components/cadde/CaddeGeoFilter.tsx:96`
- `src/components/cadde/CaddeGeoFilter.tsx:144`
- `src/components/cadde/CaddeGeoFilter.tsx:185-204`
- `src/pages/cadde/CaddePage.tsx:303`
- `src/pages/cadde/CaddePage.tsx:326-339`

**Mevcut:** Konum kartı 290px sol kolonda yaşıyor (CaddePage.tsx:303 grid-cols-[290px_...]). Koddaki bozukluk adayları: iki filtre butonu flex-wrap ile düzensiz alt alta düşüyor (CaddeGeoFilter.tsx:87-94), PopoverContent w-72 (288px) dar kolon/mobilde kenara taşıyor (96, 144), seçilen ülke+şehir rozetleri sınırsız birikip kartı uzatıyor (185-204). Görsel repro bu oturumda yapılmadı — bozukluğun hangisi olduğu ekran görüntüsüyle teyit edilmeli.

**Yapılacak:** Ekran görüntüsüyle bozukluk sabitlenip CaddeGeoFilter düzeni onarılacak: popover genişliğini viewport'a uyarla (örn. w-[min(18rem,calc(100vw-2rem))] + collisionPadding), iki butonu grid-cols-2'ye al, rozet alanına max-height + taşma davranışı. Salt CSS/markup, davranış değişmez.

### m38 · İnsanları keşfet tüm kayıtlı kullanıcıları arasın — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:353-369`
- `src/pages/cadde/CaddePage.tsx:259-264`
- `src/lib/catalog-directory.ts:184-204`
- `supabase/migrations/applied/20260730220000_directory_exclude_admin_accounts.sql:28-36`
- `src/pages/DirectoryPage.tsx:80-84`

**Mevcut:** Kart /directory'ye seçili ülke/şehir query paramlarıyla link veriyor (CaddePage.tsx:259-264, 362-366). Dizin araması search_directory_catalog RPC'sinden geçiyor (catalog-directory.ts:191-197) ve bireysel üyelerde yalnız visibility_status='open' profilleri döndürüyor, admin hesapları hariç (20260730220000 mig:28-36). Yani bugün de telefon numarasına göre ayrım YOK; kapsam kısıtı profil görünürlük bayrağından geliyor — kapalı profiller aramada çıkmıyor.

**Yapılacak:** 'TÜM kayıtlı kullanıcılar' için search_directory_catalog'un bireysel üye kapsamı genişletilecek: ya visibility_status kısıtı gevşetilir ya da cadde'ye özel minimal alanlı (ad+şehir) numara-ayrımsız yeni arama RPC'si yazılır; CaddePage kartı bu hedefe bağlanır. Numara ayrımı zaten olmadığı için asıl iş görünürlük kapsamı kararı + SQL fonksiyon değişikliği.

**Bağımlılık:** Gizlilik/KVKK kararı: visibility_status='open' olmayan profiller hangi alanlarla listelenecek? m33 kimlik kararından bağımsız ilerleyebilir.


## Çarşı + Tanıtım / Sağ Kolon (m39-m46)

### m39 · Çarşı'ya giden görünür linkleri gizle/inaktifleştir — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:305`
- `src/components/cadde/CarsiGlobalTicker.tsx:35`
- `src/components/cadde/CarsiGlobalTicker.tsx:46`
- `src/components/cadde/CaddeMyContentCard.tsx:74`
- `src/components/cadde/CaddeMyContentCard.tsx:86`
- `src/components/cadde/CaddePostBody.tsx:19`
- `src/App.tsx:217`
- `src/App.tsx:227`

**Mevcut:** CaddePage sol kolonunun en üstünde CarsiGlobalTicker mount edilir (CaddePage.tsx:305); ticker 'Tüm Çarşı' CTA'sı (CarsiGlobalTicker.tsx:35) ve her ilan kartı /cadde/carsi'ye link verir. Profildeki CaddeMyContentCard 'Çarşı'da Yönet' butonu (satır 86) ve @mention deep-link'i (CaddePostBody.tsx:19) de Çarşı'ya götürür; /cadde/carsi rotaları App.tsx:217/227'de aktif.

**Yapılacak:** UI giriş noktaları kaldırılır/inaktifleştirilir: ticker'daki 'Tüm Çarşı' ve ilan linkleri, CaddeMyContentCard'daki Çarşı bölümü, CaddePostBody carsi mention linki düz metne düşürülür. Rotalar (App.tsx) DROP edilmez — yalnız görünür linkler gizlenir (SEO-locked URL kuralı).

### m40 · Yerine 'Çarşı yakında' teaser bloğu — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:305`
- `src/components/cadde/CarsiGlobalTicker.tsx:28`
- `src/components/cadde/CarsiGlobalTicker.tsx:56`

**Mevcut:** Aynı slotta CarsiGlobalTicker canlı carsi_items listeler; ilan yoksa 'İlk ilanı sen ver.' yazar (CarsiGlobalTicker.tsx:58). 'Yakında' konsepti hiçbir yerde yok.

**Yapılacak:** Ticker'ın yerine (component içi veya yeni küçük bileşenle) statik 'Diaspora'nın ikinci el pazarı Çarşı yakında' kartı konur — listCarsiItems sorgusu bu slotta artık çağrılmaz, linksiz teaser görünür.

**Bağımlılık:** m39 ile aynı slot — birlikte uygulanmalı

### m41 · CorteQS Panosu iptal, featured içerik gelsin — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:744`
- `src/pages/cadde/CaddePage.tsx:746`
- `src/pages/cadde/CaddePage.tsx:747`
- `src/pages/cadde/CaddePage.tsx:758`
- `src/lib/cadde-api.ts:493`

**Mevcut:** Sağ kolondaki kart 'CorteQS Panosu' başlığı + 'Bugün Caddede öne çıkanlar' açıklaması taşır (CaddePage.tsx:746-747) ama içeriği tamamen statik: maskot görseli + sabit metin + /feedback?kaynak=cadde linki (satır 758-764). Hiçbir 'öne çıkan' kayıt gösterilmez.

**Yapılacak:** Kart, m42'de manuel işaretlenen featured kayıtları (is_featured=true billboard/etkinlik) gösterecek şekilde yeniden yazılır; listCaddeBillboardCards'a isFeatured filtreli bir varyant eklenir. Beta feedback linki korunup kart altına alınabilir.

**Bağımlılık:** m42 (manuel featured seçim mekanizması)

### m42 · Featured etkinlik manuel admin seçimi nereye — **S (<1 saat)**

- `src/pages/admin/AdminCaddePage.tsx:514`
- `src/pages/admin/AdminCaddePage.tsx:209`
- `src/lib/cadde-admin-api.ts:77`
- `src/lib/cadde-api.ts:503`
- `src/pages/admin/cadde/routes.tsx:17`
- `src/lib/cadde-types.ts:155`

**Mevcut:** Mekanizmanın yarısı zaten var: /admin/cadde (routes.tsx:17) billboard sekmesinde 'Featured' switch'i mevcut (AdminCaddePage.tsx:514), is_featured payload ile DB'ye yazılıyor (satır 209, saveAdminCaddeBillboardCard cadde-admin-api.ts:77). Ancak public taraf is_featured'ı select edip (cadde-api.ts:503) HİÇ filtre/kullanım yapmıyor — alan bugün ölü.

**Yapılacak:** Karar gereği manuel seçim bu mevcut Featured switch üzerinden yürütülür: switch etiketi Türkçeleştirilir ('Öne çıkar'), card_type=event kartlar için seçim netleştirilir (gerekirse tek-featured uyarısı) ve CaddePage'in yeni featured sorguları is_featured=true filtresine bağlanır. Yeni ekran gerekmez.

### m43 · Tanıtım boş durumuna billboard placeholder — **S (<1 saat)**

- `src/components/cadde/PromotionRail.tsx:40`
- `src/components/cadde/PromotionRail.tsx:46`
- `src/components/cadde/PromotionRail.tsx:48`

**Mevcut:** PromotionRail ('Tanıtım / Sponsorlu keşif alanı', cadde-right-rail placement) kampanya yokken pasif boş durum basar: 'İlk tanıtım kartı burada yayınlanacak.' + açıklama (satır 46-49). CTA'sız, tıklanamaz.

**Yapılacak:** Boş durum 'Reklamınızı buraya verebilirsiniz' billboard placeholder'ına çevrilir; m45/46 ile uyumlu olarak profildeki CaddeTanitimPanel'e yönlendiren link/CTA eklenir.

### m44 · Şehrinden Öne Çıkanlar: featured kayıt, tıkla-profile — **M (~yarım gün)**

- `src/pages/cadde/CaddePage.tsx:774`
- `src/pages/cadde/CaddePage.tsx:778`
- `src/pages/cadde/CaddePage.tsx:788`
- `src/lib/cadde-api.ts:501`
- `src/pages/admin/AdminCaddePage.tsx:507`
- `src/App.tsx:236`
- `src/lib/cadde-types.ts:141`

**Mevcut:** 'Şehrinden Öne Çıkanlar' kartı (CaddePage.tsx:774) TÜM published billboard'ları listeler — listCaddeBillboardCards is_featured filtresi uygulamaz (cadde-api.ts:501-508, yalnız content_mode/status/geo). Tıklama card.ctaUrl'e gider (satır 788); bu URL admin'in serbest metin girdiği alan (AdminCaddePage.tsx:507), profil garantisi yok (demo'da /anket'e bile gidiyor).

**Yapılacak:** Sorgu is_featured=true ile sınırlanır; karta profil hedefi bağlanır — cadde_billboard_cards'a profil referansı (user_id/katalog slug) ekleyip Link'i /directory/profile/:userId (App.tsx:236) veya katalog profiline yönlendirmek, tüm kartı tıklanabilir yapmak. CaddeBillboardRow/Card tipleri (cadde-types.ts:141,349) ve admin formu yeni alanla güncellenir.

**Bağımlılık:** m42 (featured işaretleme) — muhtemelen yeni migration (profil referans kolonu)

### m45 · 'Talep bırak' yerine 'profilinden ilk tanıtımını yap' — **S (<1 saat)**

- `src/pages/cadde/CaddePage.tsx:812`
- `src/pages/cadde/CaddePage.tsx:821`
- `src/lib/cadde-demo-data.ts:209`
- `src/lib/cadde-demo-data.ts:210`
- `src/pages/ProfilePage.tsx:1683`
- `src/components/cadde/CaddeTanitimPanel.tsx:75`

**Mevcut:** Sağ alttaki koyu kart 'Billboard veya sponsorlu akışta yer almak için talep bırak.' der (CaddePage.tsx:812); 'Başvuru Gönder' butonu /login?mode=signup'a gider (satır 821) — giriş yapmış üye için anlamsız döngü. Demo sponsorlu yerleşim de 'Talep Bırak' CTA'sı taşır (cadde-demo-data.ts:209-210). Oysa kampanya oluşturma akışı zaten canlı: profildeki CaddeTanitimPanel createPromotionCampaign RPC'sini çağırıyor (CaddeTanitimPanel.tsx:75-84).

**Yapılacak:** Kart metni ve CTA 'profilinden ilk tanıtımını yap' olarak değiştirilir; hedef /profile'daki CaddeTanitimPanel (anchor/scroll). DEMO_SPONSORED ctaLabel/ctaUrl aynı yönde güncellenir.

### m46 · Profil menüsüne 'Caddeye reklam ver' linki — **S (<1 saat)**

- `src/components/profile/premium/PremiumProfileHero.tsx:173`
- `src/components/profile/premium/PremiumProfileHero.tsx:202`
- `src/components/profile/ProfileSwitcherMenu.tsx:131`
- `src/pages/ProfilePage.tsx:1675`
- `src/pages/ProfilePage.tsx:1683`
- `src/pages/ProfilePage.tsx:2184`

**Mevcut:** Profil menüsünde reklam linki yok: premium hero aksiyon kolonu yalnız Diğer Profiller / Profil Ayarları / Bildirimler / Yardım / Çıkış Yap içerir (PremiumProfileHero.tsx:173-211); ProfileSwitcherMenu dropdown'ı profiller + '+ Yeni Profil' ile biter (ProfileSwitcherMenu.tsx:131-135). CaddeTanitimPanel sayfanın ortasında kartlar arasında gömülü (ProfilePage.tsx:1683, legacy düzende 2184) ve menüden erişilemiyor.

**Yapılacak:** Hero aksiyon kolonuna (Çıkış Yap üstüne, ~satır 202) 'Caddeye reklam ver' butonu eklenir — onClick CaddeTanitimPanel'e scroll/anchor (panele id verilir) veya ilgili sekmeyi açar; istenirse ProfileSwitcherMenu dropdown'ının alt bölümüne de aynı madde eklenir. Legacy (premium olmayan) düzen için de aynı anchor çalışmalı.

**Bağımlılık:** m45 ile aynı hedef akış (CaddeTanitimPanel anchor'ı ortak yapılmalı)


---

*Bu doküman türetilmiş bir çalışma haritasıdır; karar kaynağı workshop panosudur. Bir madde tamamlanınca panodaki UBT/Burak kutuları işaretlenir — bu dosya güncellenmek zorunda değildir.*
