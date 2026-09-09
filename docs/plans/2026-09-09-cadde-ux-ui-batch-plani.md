# Cadde & Cafe UX/UI denetimi — tek tek yapılabilir batch listesi

> **Nasıl kullanılır:** yeni bir oturumda yalnız batch numarasını söyle (ör. `H1`).
> Ajan bu dosyayı açar, o batch'i okur ve **başka belge okumadan** yapar.
> Bu dosya `2026-09-07-kalan-isler-batch-listesi.md`'nin yerine geçmez — **onun yanında**
> durur: o plan genel teknik borcu, bu plan 27.08 Cadde/Cafe denetimini kapatır.

## Context

7 Eylül'de iki denetim dokümanının her maddesi koda karşı tek tek doğrulandı.
Kaynak dokümanlar (9 Eylül'de kökten `docs/` altına taşındı — kökte yalnız `CLAUDE.md`
ve `README.md` durur):
`docs/cadde-300/2026-08-27-ux-degerlendirme.md` · `docs/cadde-300/2026-08-27-ui-kritigi.md`. **Yapılmış olanlar dışarıda bırakıldı**, açık kalanlar iki panoya işlendi
(commit `12303e1`):

- **Cadde Workshop WS3** → 31 madde, `m137`–`m167` (`/admin/workshop/cadde`)
- **Komuta Merkezi** → 14 gruplanmış todo (`sort_order` 13101–13114)

Panoda hepsi **0/0** — hiçbiri başlamadı. Bu plan o 31 maddeyi tek tek yapılabilir
batch'lere böler: her batch **ne** yapılacağını, **hangi dosyayı**, **kabul kriterini**,
**tuzağını** ve **bağımlılığını** birlikte taşır. Batch'ler arasında bilgi taşınmaz.

**Zaten yapılmış olduğu için plana ALINMAYANLAR** (tekrar açmayın):
yorum kutusu placeholder'ı (`CaddePage.tsx:1103`) · tepkilerin tek tetik arkasına
alınması (commit `9af6727`) · sağ raydaki kapasite paydası (`CaddeCafesPanel.tsx:163`) ·
**fotoğraf yüklenince akışın yenilenmemesi** (WS2 `m63`/`m64` ile kapandı — medya
submit'ten ÖNCE yükleniyor `CaddeComposer.tsx:138`, feedRoot invalidate ediliyor
`CaddePage.tsx:277`; kod yolunda kusur yok, yalnız gözle QA'da doğrulanmalı).

**Kullanıcı kararları (bu planı şekillendirdi):**
- **Hızlı kod kazanımları önce** — H grubu en başta koşar.
- **Görsel işler doğrudan yapılır**, ayrı bir tasarım onay kapısı yok (T grubu kesintisiz).

**Ölçülen taban (9 Eylül 2026):** test **256 dosya / 1.768** yeşil · `tsc` **7** hata ·
ESLint 0 · migration **386/386** sapmasız · `HEAD` = `12303e1`.

> 7 Eylül planındaki 259/1.816 ve `tsc` 9 artık geçerli değil — arada silinen ajan
> katmanının testleri de gitti. Rakamı ezberleme, batch'e başlarken tekrar ölç.

---

## ⚠️ Ön kontrol — ilk batch'ten ÖNCE, bir kez

Çalışma ağacı **kirli** ve bu sessizce zarar verebilir:

- **33 silinmiş dosya** commit'lenmemiş duruyor (önceki oturumun S1/S2 batch'leri: ajan
  yürütme katmanı + kullanılmayan shadcn primitifleri), ayrıca 8 değişik + 7 takipsiz dosya.
- `12303e1` **push edilmemiş** (`origin/main` = `77e166a`).

Bunlar bu planın işi değil, ama **pathspec'siz `git commit` hepsini içine alır.** Her
batch'te commit'i `git commit -- <yalnız dokunduğun dosyalar>` biçiminde ver. Silmelerin
kasıtlı olduğunu kullanıcıya doğrulat; ayrı commit'le ya da olduğu gibi bırak —
**ama asla kendi batch commit'ine karıştırma.**

---

## Yeni oturum böyle başlar

1. Bu dosyayı aç, batch'i oku. **Başka belge okumana gerek yok.**
2. Çalışma dizininin **BÜYÜK harfli** olduğunu doğrula (`C:\temp_private\...`).
   Küçük harfli `c:` ile vitest testlerin çoğunu **sahte** kırar — Node `file:///c:/` ile
   `file:///C:/` adreslerini farklı modül sayar. Bağımlılık düşürme.
3. Batch'i yap, kabul kriterini kontrol et, kapanış turunu koş.
4. Taban bozulduysa **commit etme** — batch'i böl ya da geri al.
5. Batch bitince `/admin/workshop/cadde` WS3 sekmesinde ilgili maddeyi işaretle.

### Her batch'in kapanış turu (değişmez)

```
npm run test        # taban 256 dosya / 1.768 — DÜŞERSE DUR
npm run lint        # taban 0 problem
npx tsc -p tsconfig.app.json --noEmit   # taban 7 — ARTMAMALI
```

⚠️ `src/lib` altına **yeni bir export** eklediysen `npm run ingest:tools` çalıştır; yoksa
`scripts/agent/tools-catalog.test.mjs` kırılır ve `npm run check:drift` bunu **görmez**
(ayrı mekanizmalar).

⚠️ Migration yazan batch'te: dosya `supabase/migrations/` **parent** dizinine yazılır,
`npm run migrate:apply -- <yol> --dry-run` ile prova edilir, sonra `--dry-run` olmadan
uygulanır. Script dosyayı `applied/` altına **kendisi taşır**. Parent'ta bırakılan dosyayı
`check:migrations` görmez.

---

## Batch grupları

| Harf | Grup | Batch | Madde | Toplam süre |
|---|---|---|---|---|
| **H** | Hızlı kazanımlar — küçük, düşük riskli, hemen görünür | H1–H5 | m146-148, m150, m152, m154, m155 | ~55 dk |
| **B** | Boş durumlar — soğuk başlangıcın kod tarafı | B1–B2 | m157, m158 | ~40 dk |
| **Y** | Yerleşim — header konsolidasyonu | Y1–Y2 | m151, m153 | ~35 dk |
| **C** | Cafe — bir karar + üç arayüz işi | C0–C3 | m159-m162 | ~45 dk |
| **T** | Tasarım sistemi — token dokümanı + hizalama | T1–T8 | m137-m145, m149 | ~2,5 sa |
| **K** | Karar — kod yok, cevap gerekiyor | K1 | m156 | ~5 dk |
| **İ** | İçerik / soğuk başlangıç — **insan işi** | İ1–İ5 | m163-m167 | günler |

**Önerilen sıra:** H1 → H2 → H3 → H4 → H5 → B1 → B2 → Y1 → Y2 → C0 → C1 → C2 → C3 →
T1 *(deseni kurar)* → T2…T8 → K1 · **İ grubu paralel yürür** (kod işi değil).

### Tüm batch'ler tek bakışta *(kopyalanabilir kontrol listesi)*

```
H1  sıfır sayıları gizle           m155      ⚠ aria-label DEĞİŞMEMELİ
H2  "Caddeye Çık" kaldır/adlandır  m154      ⚠ test kilidi
H3  Türkçeleştirme (3 etiket)      m146-148  ⚠ admin-updates'e DOKUNMA
H4  slogan girişliye gösterilmesin m152      ⚠ test kilidi
H5  beta bandı kapatılabilir       m150

B1  boş şehirde otomatik fallback  m157      ⚠ test kilidi · en büyük mantık işi
B2  boş durum dolu alternatif      m158      B1'den SONRA

Y1  logo bandı + başlık birleşsin  m151
Y2  scroll'da header daralsın      m153      Y1'den SONRA

C0  KARAR: cafe formatı            m159      ⚠ C1-C3'ü KİLİTLER
C1  "2/100" paydası                m160
C2  Arşivle → kebab menü           m161
C3  süre sonu metni                m162      C0'dan SONRA

T1  design-token dokümanı          m137      DESENİ BURADA KUR
T2  altın primary                  m138      ⚠ style-contract testi
T3  buton hiyerarşisi 3 seviye     m139
T4  üst nav tek nötr renk          m140
T5  gökkuşağı şerit → pillar       m141
T6  rozet sistemi 3 tip            m142
T7  köşe + gölge + gri alt sınırı  m143-145
T8  cafe kartı çelişen sinyal      m149

K1  tepki seti 5 → 3 mü?           m156      ⚠ sözleşme testini kırar

İ1  test içeriğini temizle         m163      insan işi
İ2  admin-görünür seviye/staging   m164
İ3  4 şehir × 8-10 gönderi         m165      Burak + içerik
İ4  resmî hesaptan yayınla         m166      İ3'ten sonra
İ5  blog ↔ Cadde döngüsü           m167
```

---

## H — Hızlı kazanımlar ✅ *(H1–H5 TAMAMLANDI 09.09.2026)*

> **Durum:** beşi de yapıldı ve ayrı ayrı commit'lendi — `cdfa100` (H1) · `60d1df8` (H2) ·
> `765fb7c` (H3) · `08225f7` (H4) · `9021507` (H5). Kapanış: 256 dosya / **1.776** test
> (8 yeni regresyon testi), lint 0, `tsc` 6, build yeşil.
>
> **Uygulama sırasında plandaki üç reçete ölçülerek YANLIŞ çıktı** — aşağıda düzeltildi.
> Ders: batch metnindeki satır numarası ve "şunu da sil" talimatı, dosya açılmadan
> doğru varsayılmamalı.

### H1 — Sıfır tepki/yorum sayılarını gizle · ~10 dk · `m155`

Boş bir ağda her kartta yazan `0`'lar boşluğu bağırıyor. `CaddePage.tsx:974` (`{count}`)
ve `:1003` (`{item.post.commentCount}`) sayıyı **koşulsuz** basıyor.

**Adımlar:** görsel `<span>`'leri `> 0` ile koşulla.
⚠️ **Plandaki adres EKSİKTİ (09.09'da ölçüldü):** `:974` yalnız tepki paneli AÇIKKEN
çiziliyor; kapalı kartta görünen sayaç ayrı bir yerdeki `{totalReactions}`. Paylaş sayacı
(`{shareCount}`) da aynı desende — dördü birden koşullanmalı, yoksa kartta tek başına
"0" kalır.
**Dosya:** `src/pages/cadde/CaddePage.tsx`
**Kabul:** sıfırken yalnız ikon görünür; sayı 1 olunca sayı çıkar; test tabanı düşmez.
**Tuzak (bu planın en önemlisi):** `:955`'teki
``aria-label={`${reaction.label} (${count})`}`` **AYNEN KALMALI.** Koddaki yorum bunu
açıkça söylüyor ve `CaddePage.test.tsx`'in 763/778/787/805/808/813. satırları
`"Beğendim (1)"` / `"Beğendim (2)"` erişilebilir adlarını arıyor. Yalnız **görsel** sayıyı
gizle — `aria-label`'a dokunursan hem 6 test kırılır hem ekran okuyucu davranışı geriler.

### H2 — "Caddeye Çık" butonunu kaldır ya da yeniden adlandır · ~10 dk · `m154`

Kullanıcı zaten Cadde'de. `CaddePage.tsx:1249-1255`'teki siyah pill yalnız
`scrollToComposer` çağırıyor — composer zaten sayfada, yani buton hiçbir yere götürmüyor.

**Adımlar:** tercih edilen çözüm **kaldırmak** (kritiğin birinci önerisi). Kalacaksa
gerçek işleve göre adlandır ("Paylaşımını Öne Çıkar" gibi) — ama bugünkü işlevi
"aşağı kaydır" olduğu için kaldırmak dürüst olan.
**Dosya:** `src/pages/cadde/CaddePage.tsx`
**Kabul:** sağ kolonda anlamsız CTA yok.
**Tuzak (bu reçete YANLIŞTI, 09.09'da ölçülerek düzeltildi):** plan "testi de kaldır"
diyordu. O satır **ayrı bir test değil** — adı `collapses the location filter when the
street is empty` olan testin içindeki üç iddiadan yalnız biri; testi silmek B1 soğuk
başlangıç kapsamını da götürürdü. Yalnız ilgili iddia kaldırıldı.
Ayrıca `scrollToComposer` ve `Megaphone` **ölü kod değildi** (boş akış kartı ikisini de
kullanıyor) — silinseydi derleme kırılırdı.
⚠️ Kaldırılan `await findByRole(...)` yerine bir **veri bariyeri** konmalı
(`await findByTestId("cadde-feed-empty-state")`): `geoFilterOpen` veri çözülmemişken de
`false`, o yüzden bariyersiz `aria-expanded` iddiası yüklenme anında bedavaya geçer.

### H3 — Arayüzdeki üç İngilizce etiketi Türkçeleştir · ~10 dk · `m146` `m147` `m148`

| Şu an | Olacak | Yer |
|---|---|---|
| `Pinned` | `Sabit` | `CaddePage.tsx:742`, `AdminCaddePage.tsx:360` |
| `Feedback Ver` | `Geri Bildirim` | `SiteHeader.tsx:54`, `FeedbackPage.tsx:74` |
| `Host:` | `Ev Sahibi:` | `CaddeCafePage.tsx:206` |

**Kabul:** bu üç dize kullanıcıya görünen hiçbir yerde İngilizce kalmaz.
⚠️ **Tablo EKSİKTİ (09.09'da ölçüldü): beş değil SEKİZ yer var.** Ek üçü:
`AdminFeedbackPage.tsx` ×2 (sayfa + boş durum açıklaması) ve `admin-navigation-registry.ts`
— bunlar **şimdiki zaman** cümleler, ad değişince olgusal olarak yanlış olurlar; geçmiş
kayıt değiller. Ayrıca `AdminCaddePage.tsx` `placeholder="Host görünen adı"`.
**Tuzak 1:** `src/lib/admin-shell/admin-updates.ts` içinde "Feedback Ver" geçen satırlar
(1354, 1356 vb.) **geçmiş duyuru kayıtlarıdır** — tarihsel metin, DEĞİŞTİRME. Yalnız
kullanıcıya bugün görünen etiketleri değiştir.
**Tuzak 2:** `admin-navigation-registry.ts:454`'teki açıklama da geçmişe atıf yapıyor;
menü etiketi zaten "Üye Geri Bildirimleri" — orayı kurcalama.
**Not:** bu üç dize için **test kilidi yok** (arandı, bulunamadı) — batch düşük riskli.
"Ev Sahibi" Cafe metaforunun doğal uzantısı, kritik özellikle bunu öneriyor.

### H4 — Girişli kullanıcıya pazarlama sloganını gösterme · ~10 dk · `m152`

`SiteHeader.tsx:130-131` sloganı **koşulsuz** basıyor; giriş yapmış üyeye pazarlama
sloganı göstermek dikey alanı boşa harcıyor.

**Adımlar:** slogan `<p>`'sini `{!user && (...)}` ile koşulla — nav linkleri zaten
`:39`'da `user ?` ile ayrılıyor, aynı `user` değişkeni elde.
**Dosya:** `src/components/SiteHeader.tsx`
**Kabul:** çıkış yapmış ziyaretçi sloganı görür, girişli üye görmez.
**Tuzak:** `SiteHeader.test.tsx:21` sloganı **koşulsuz** arıyor
(`getByText("Dünyadaki Türkleri Bir Araya Getiren Platform")`). Testi **ikiye böl**:
girişsiz → görünür, girişli → görünmez. Testi silme, çoğalt.
`HeroSection.test.tsx:16` farklı bir metin (ana sayfa hero'su) — ona dokunma.

### H5 — Beta bandını kapatılabilir yap · ~15 dk · `m150`

`SiteHeader.tsx:19-35`'teki bant her sayfada ~40px yiyor ve kapatılamıyor — dosyada
`localStorage` da `useState` de yok.

**Adımlar:** banda kapatma (×) düğmesi ekle, tercihi `localStorage`'da tut, ilk render'da
oku. Depoda hazır desen var: admin tarafındaki `updates-seen` aynı yaklaşımı kullanıyor.
**Dosya:** `src/components/SiteHeader.tsx`
**Kabul:** kapatınca bant gider; sayfa yenilenince geri gelmez; yeni sekmede de gelmez.
**Tuzak:** `localStorage` okuması prerender yolunda patlayabilir — `try/catch` ile sar ve
değer okunamıyorsa **bandı göster** (varsayılan açık). Prerender bu projede canlı
(`__prerender_internal`), sessizce boş sayfa üretmesin.

---

## B — Boş durumlar *(soğuk başlangıcın kod tarafı)*

### B1 — Boş şehirde otomatik olarak ülke akışına düş · ~25 dk · `m157`

Bu planın en büyük mantık işi. Bugün `CaddePage.tsx:1283` yalnız metin gösteriyor:
"Şehrini göremiyorsan ülke geneli akışı keşfedebilir veya **ilk paylaşımı sen
yapabilirsin**." Kritiğin cevabı net: **kullanıcı ilk paylaşımı yapmaz.**

**Adımlar:** seçili şehir akışı boş dönerse otomatik olarak ülke akışına (yoksa global)
düş ve ne olduğunu tek satırla söyle ("Şehrinde henüz paylaşım yok — ülke akışını
gösteriyoruz"). Filtreyi **sıfırlama**; yalnız gösterilen akışı genişlet.
**Dosya:** `src/pages/cadde/CaddePage.tsx` (+ gerekirse `CaddeFeedScopeBar.tsx`)
**Kabul:** boş şehirli bir hesapla `/cadde` açıldığında ekranda gönderi **var**.
**Tuzak:** `CaddePage.test.tsx:1214`'te `COLD_START_HINT` regex'i eski metni kilitliyor —
davranış değişince o testi de güncelle.
**Bağımlılık:** B2 bunun üstüne biner, **B1 önce**.

### B2 — Boş durum metni dolu bir alternatif sunsun · ~15 dk · `m158`

"Bu şehirde henüz kimse yok" yerine "Berlin'deki 12 paylaşımı gör" gibi **tıklanabilir ve
gerçek sayı taşıyan** bir alternatif.

**Dosya:** `src/pages/cadde/CaddePage.tsx`
**Kabul:** boş durumda en az bir dolu hedef, gerçek sayısıyla ve tıklanabilir görünür.
**Tuzak:** sayıyı uydurma — B1'de zaten çekilen veriden türet, **ayrı sorgu açma.** Canlı
örnek 904 MB RAM'de çalışıyor; gereksiz sorgudan kaçın.
**Bağımlılık:** B1.

---

## Y — Yerleşim *(header konsolidasyonu; H4/H5 yığını zaten inceltti)*

### Y1 — Logo bandı ile sayfa başlığını tek satırda birleştir · ~20 dk · `m151`

İçerik başlamadan önceki ~300px yığının kalan iki katmanı. Sol logo + sağ sayfa adı tek
satıra iner.
**Dosya:** `src/components/SiteHeader.tsx` (+ `CaddePage.tsx` başlık bloğu)
**Kabul:** dar viewport'ta da tek satır; ilk gönderi fold'un üstünde.
**Tuzak:** `SiteHeader` **her public sayfada** kullanılıyor — Cadde için yaptığın
değişiklik ana sayfayı da etkiler. En az iki başka sayfada kırılma var mı diye bak.

### Y2 — Scroll'da header'ı daralt · ~15 dk · `m153`

Sticky kalsın, yüksekliği yarıya insin.
**Dosya:** `src/components/SiteHeader.tsx`
**Kabul:** aşağı kaydırınca header incelir, yukarı dönünce eski haline gelir; zıplama yok.
**Tuzak:** scroll dinleyicisini `passive` ver ve throttle et; her pixel'de state
güncellemek akışta gözle görülür takılma yapar.
**Bağımlılık:** Y1.

---

## C — Cafe *(C0 bir karardır ve C3'ü kilitler)*

### C0 — KARAR: Cafe formatı async-first mi, programlı canlı slotlar mı? · ~10 dk · `m159`

Mevcut model 2 saatlik canlı pencere. Kritiğin tespiti: **boş bir akış kötüdür, boş bir
CANLI oda çok daha kötüdür** — kullanıcı girer, kimse yoktur, süre akmaktadır, çıkar ve
bir daha denemez. Zaman baskısı dolu odada aciliyet yaratır, boş odada başarısızlığı
hızlandırır. İki seçenek:

- **(a) async-first:** odalar 24 saat – 7 gün yaşar, "Canlı" ayrı bir etkinlik modu olur.
  Küçük kullanıcı tabanında insanların aynı 2 saate denk gelme ihtimali düşük; asenkron
  oda en azından içerik biriktirir.
- **(b) programlı canlı slotlar:** ad-hoc "Cafe Aç" yerine platformun duyurduğu sabit
  saatler ("Berlin Oturum İzni Saati — her perşembe 20:00"), Reel takvimiyle senkron.

İkisi birlikte de kurulabilir: async varsayılan, canlı slotlar haftalık ritüel.
**Neden karar batch'i:** cevap C3'ün metnini baştan değiştirir.
**Not:** oda süresi ve limitleri `cadde_settings` tablosunda — ürün kararı **SQL
güncellemesi**, kod değişikliği değil.

### C1 — Oda sayfasındaki "2/100 üye" paydasını gizle · ~10 dk · `m160`

Payda boşluğu vurguluyor. **İki yüzey bugün ayrışmış:** sağ raydaki kart zaten düzeltilmiş
(`CaddeCafesPanel.tsx:163` yalnız `{cafe.memberCount} üye`), oda sayfası hâlâ paydayı
basıyor (`CaddeCafePage.tsx:206`).
**Adımlar:** oda sayfasını rayla aynı hizaya getir — ya paydayı tamamen gizle ya da
doluluk %20'yi geçince göster.
**Kabul:** iki yüzey aynı şeyi söylüyor.

### C2 — "Cafe'yi Arşivle"yi kebab (⋯) menüsüne taşı · ~15 dk · `m161`

`CaddeCafePage.tsx:212`'de oda canlıyken **en görünür aksiyon odayı kapatmak.** Ana
pozisyonda "Davet Et" / "Paylaş" durmalı.
**Kabul:** Arşivle ⋯ menüsünde; ana pozisyonda davet/paylaş var; arşivleme hâlâ çalışıyor.
**Tuzak:** Arşivle host'a özel — yetki kontrolünü menüye taşırken düşürme.

### C3 — Süre dolunca ne olduğunu oda kartında yaz · ~10 dk · `m162`

Bilgi bugün **yalnız kod yorumunda** (`CaddeCafePage.tsx:4`: "Arşivlenen veya süresi biten
cafe read-only görünür"). Kullanıcı bunu bilmeden yazmaz.
**Adımlar:** oda kartına tek satır ekle — **gerçek davranışı** yaz, kritiğin örnek
cümlesini kopyalama.
**Bağımlılık:** C0 (davranış kararla değişebilir).

---

## T — Tasarım sistemi *(T1 deseni kurar; sonraki 7 batch onun uygulaması)*

⚠️ **Bu grubun tamamı `src/lib/cadde-style-contract.test.ts` ile çevrili.** Test, 7 Cadde
yüzey dosyasında `bg-[#...]`, `text-[#...]`, `border-[#...]`, `bg-[linear-gradient...]` ve
`shadow-[...rgba...]` kullanımını **yasaklıyor** — renkler CSS yardımcılarından/token'dan
gelmek zorunda. **Testi gevşetme, token ekle.** (`SiteHeader.tsx` bu listede *değil*, ama
T4'te yine de token kullan.)

### T1 — Design-token dokümanını yaz ve token'ları tanımla · ~30 dk · `m137`

Kritiğin kök teşhisi: sorunların hiçbiri tek başına büyük değil, hepsinin ortak kökü
**tanımlı bir token sistemi olmaması.** Bu batch tek tek düzeltme yapmaz, **kuralı yazar.**

**Adımlar:** (1) `docs/modules/` altına token dokümanını yaz: renk (primary altın
`#aa8c42`, pillar renkleri, nötr skala, metin alt sınırı `#6b7280`), buton (3 seviye),
rozet (3 tip), yüzey (tek radius, 2 gölge), dil kuralı. (2) `src/index.css` `.cadde-shell`
bloğuna karşılık gelen CSS değişkenlerini ekle.
**Dosya:** `src/index.css`, `docs/modules/<yeni>.md`
**Kabul:** sonraki her T batch'i "hangi değeri kullanayım?" diye sormadan ilerleyebiliyor.
**Tuzak:** bugünkü `--cadde-accent` **turuncu** (`24 92% 48%`), altın değil. Altını
eklerken turuncuyu bir anda söküp atma — T2/T3 onu adım adım devralacak.

### T2 — Altın primary · ~20 dk · `m138`

Ölçüldü (07.09): `#aa8c42` `src/` ağacında **hiç geçmiyor** — yalnız `index.html`
theme-color etiketinde ve `docs/` HTML'lerinde. Markanın en değerli görsel varlığı boşta
duruyor; logo kaldırılsa arayüzün CorteQS'e ait olduğu anlaşılmıyor.
**Adımlar:** primary buton, aktif sekme, seçili filtre ve link hover'ını altına bağla —
"her yerde" değil, **"birincil eylem neredeyse orada"**; böylece hem kimlik hem
yönlendirme işlevi görür.
**Bağımlılık:** T1.

### T3 — Buton hiyerarşisini üçe indir · ~25 dk · `m139`

Aynı ekran setinde dört ayrı stil var (siyah pill, turkuaz dolu, gri dolu, beyaz outline);
kullanıcı birincil eylemi renkten okuyamıyor. Tek hiyerarşi: **primary** altın dolu (sayfa
başına en fazla bir tane), **secondary** nötr outline, **tertiary** metin link.
**Kabul:** her Cadde ekranında en fazla bir primary.
**Bağımlılık:** T1, T2.

### T4 — Üst navigasyonu tek nötr renge indir · ~10 dk · `m140`

Ölçüldü — dört link, dört renk: Araçlar `#1E3A8A` mavi, Feedback Ver `#ee652b` turuncu,
Profilim `#34A853` yeşil, Çıkış `slate-600`. Stillenmemiş gibi okunuyor.
**Dosya:** `src/components/SiteHeader.tsx`
**Kabul:** tüm nav linkleri tek koyu gri; vurgu gerekiyorsa **yalnız bir** öğede — beta
döneminde muhtemelen "Geri Bildirim".
**Not:** H3 aynı satırlardan birinin metnini değiştiriyor; çakışırsa **H3'ü önce bitir.**

### T5 — Gökkuşağı şeridi pillar renk koduna çevir · ~25 dk · `m141`

`src/index.css:367-385`'te `.cadde-panel::before` / `.cadde-card::before` her kartta
5 duraklı gradient çiziyor (`--cadde-logo-red/amber/green/blue/pink`, opacity 0.5).
Niyet anlaşılıyor ama her kartta tekrarlanınca gürültüye dönüşüyor ve kartlar arası
hiyerarşiyi siliyor — dekorasyon, bilgi taşımıyor.
**Adımlar:** gökkuşağı **logoda kalsın**; şerit pillar rengine dönüşsün — Cadde altın,
Cafe yeşil, Çarşı terracotta. Kartın hangi pillar'a ait olduğu bir sınıf/prop ile gelsin.
**Kabul:** karışık akışta ve bildirimlerde kullanıcı bağlamı renkten anlıyor.
**Tuzak:** `.cadde-panel` yalnız gönderi kartlarında değil, **yan kolon panellerinde de**
kullanılıyor (toplam 7 yerde). Şeridi pillar'a bağlarken panellerin ne olacağına karar
ver — büyük ihtimalle panelde şerit hiç olmamalı.
**Bağımlılık:** T1.

### T6 — Rozetleri üç tipe indir · ~25 dk · `m142`

Altı stil dolaşımda: Canlı (yeşil `bg-emerald-500`), Onaylı, Resmî hesap (gri), Pinned
(siyah `bg-slate-900`), Startup, AÇIK BETA (altın çerçeve). Her rozet kendi kuralını icat
etmiş; hiçbirinin görsel ağırlığı anlamsal önemiyle örtüşmüyor.

| Tip | Örnek | Stil kuralı |
|---|---|---|
| Durum | Canlı, Sabit | dolu renk, dinamik anlam |
| Kimlik | Onaylı, Resmî hesap | tek ikon + nötr renk, güven anlamı |
| Kategori | Startup, Hukuk, Emlak | outline, nötr, bilgi anlamı |

**Adımlar:** paylaşılan bir rozet bileşeni üzerinden geçir.
**Bağımlılık:** T1. **Not:** H3 "Pinned"i "Sabit" yapıyor; T6 onun stilini değiştiriyor.

### T7 — Yüzey sistemini sabitle · ~20 dk · `m143` `m144` `m145`

Üçü aynı kavram, tek batch. Çok yumuşak gölge + çok yuvarlak köşe + açık gri zemin
yüzünden her kart aynı seviyede yüzüyor:
- **köşe yarıçapı** tek değere insin (öneri 12px, pill butonlar hariç — bugün
  `rounded-md/xl/2xl/[24px]` karışık),
- **gölge** iki seviyeye insin (kart / yükseltilmiş kart-modal),
- **gövde metni grisi** `#6b7280`'in altına inmesin (AA kontrast sınırı).

**Kabul:** kartlar arasında görünür bir derinlik farkı var.
**Bağımlılık:** T1.

### T8 — Cafe kartındaki çelişen sinyali gider · ~10 dk · `m149`

Oda kartında turuncu/amber çerçeve, içinde yeşil "Canlı" rozeti
(`CaddeCafePage.tsx:188` `bg-emerald-500`; `CaddeCafesPanel.tsx` boyunca turuncu aksanlar).
Çerçevenin anlamı belirsiz ve rozetin rengiyle çelişiyor.
**Adımlar:** çerçeveyi ya kaldır ya duruma bağla — oda canlıyken yeşil çerçeve + yeşil
rozet, arşivlenince nötr. **Tek sinyal, tek renk.**
**Bağımlılık:** T1, T6.

---

## K — Karar *(kod yok; cevap gelmeden arkasındaki iş başlayamaz)*

### K1 — Tepki seti 5'ten 3'e insin mi? · ~5 dk · `m156`

Bugün 5 tip: beğeni, kalp, gülme, destek, **emin olamadım**. Kritik üçe indirmeyi öneriyor
(beğeni + soru + yorum) ve "soru" sinyalinin diaspora akışında beğeniden daha değerli
olduğunu söylüyor — o sinyal `unsure` ("Emin olamadım") olarak **zaten var**.

⚠️ **Neden karar batch'i:** `CaddePage.test.tsx:708-762` "beş tepki tek tetiğin arkasında"
sözleşmesini **kilitliyor** ve bu sözleşme 2 Eylül'de bilerek yazıldı (commit `9af6727`).
Tip sayısını düşürmek o sözleşmeyi kırar — testi gevşetmeden önce ürün kararı gerekir.
Ayrıca tepkiler artık tek tetiğin arkasında olduğu için **kritiğin şikâyet ettiği görsel
yığılma zaten çözülmüş**; kalan tek soru "5 tip fazla mı?".

---

## İ — İçerik / soğuk başlangıç *(kod işi DEĞİL; kod batch'leriyle paralel yürür)*

> Kaynak dokümanın en kritik başlığı: **"Header'ı düzeltmek 1 saatlik iş; boş akış ürünü
> öldürür."** Doha'dan giren bir beta kullanıcısı akışta test gönderisi, bug raporu ve tek
> resmî duyuru görüyor. Bu grup ajanın tek başına bitirebileceği bir iş değil — içerik
> üretimi ve Burak'ın zamanı gerekiyor. Kod batch'lerini beklemeye alma, paralel koşsun.

| Batch | Madde | İş | Kim |
|---|---|---|---|
| **İ1** | `m163` | Test gönderilerini ve test cafe'lerini canlı akıştan temizle. "agwdhjsajkkjsddfgsegdsfsdg" açıklamalı oda sağ rayda **Onaylı rozetiyle** listeleniyor — onaylı rozetin ilk göründüğü yer bir test odası olmamalı | UBT (DB) |
| **İ2** | `m164` | Test içeriği için staging ya da yalnız admin'e görünür bir görünürlük seviyesi kur; bug raporları feedback kanalına taşınsın | UBT (kod+DB) |
| **İ3** | `m165` | Berlin, Londra, Sydney, Dubai için 8-10 **gerçek** soru/not hazırla. İçerik zaten elde: blog ve Reel serilerindeki oturum izni, çalışma vizesi, vatandaşlık, okul kaydı/denklik, kira-ev-kefil, yaşam maliyeti konuları doğrudan Cadde gönderisine dönüşür | Burak + içerik |
| **İ4** | `m166` | Tohum gönderileri CorteQS resmî hesabı veya şehir elçisi hesaplarından yayınla, **tarihleri geriye yay** — hepsi aynı gün görünmesin | Burak · İ3'ten sonra |
| **İ5** | `m167` | Blog ↔ Cadde döngüsünü kur: blog yazısı Cadde'de soru olarak açılsın, gelen yanıtlar sonraki blog içeriğini beslesin | Burak |

**İ1/İ2 için tuzaklar:**
- Canlı DB'ye Türkçe içerikli SQL'i **UTF-8 dosya olarak `psql -f` ile** gönder; PowerShell
  komut satırından geçen Türkçe karakter bozulur (`invalid byte sequence 0xc7 0x69`).
- `geo_cities` **76.990** satır. Satır başına fonksiyon çağıran keşif sorgusu **canlıyı
  düşürür** — 5 Ağustos'ta tam olarak bu oldu, 50 dakika kesinti. Önce `select distinct`
  ile küçült, sonra join'le.

---

## Doğrulama (planın tamamı için)

Bir batch dizisi bittiğinde:

```
npm run test                              # 256 dosya / 1.768 taban
npm run lint                              # 0
npx tsc -p tsconfig.app.json --noEmit     # 7 taban, ARTMAMALI
npm run build                             # yeşil
npm run check:migrations                  # 386/386, sapma yok
```

**Gözle QA (tarayıcıda, girişli):** `/cadde` → ilk gönderi fold'un üstünde mi · sıfır
sayılar gizli mi · nav tek renk mi · kart şeritleri pillar rengi mi · boş şehirli hesapla
akış dolu mu · `/cadde/cafe/:id` → payda, kebab menü, süre sonu metni.
Ayrıca **foto yükleyip akışın yenilendiğini** doğrula (kodda kusur yok ama gözle
görülmedi).

**Canlı doğrulama** (deploy webhook'u `main` push'unda çalışır):
`curl -I https://corteqs.net/` → `Last-Modified` push saatinden sonra olmalı.

**Pano güncellemesi:** her batch bitince `/admin/workshop/cadde` WS3 sekmesinde ilgili
maddeyi işaretle. 31 maddenin tamamı işaretlenince Komuta Merkezi'ndeki 14 gruplanmış todo
da (`sort_order` 13101–13114) `Tamamlandi`ya çekilebilir.
