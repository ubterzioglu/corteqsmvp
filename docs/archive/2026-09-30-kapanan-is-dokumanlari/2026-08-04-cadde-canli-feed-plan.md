# Cadde canlı feed planı — 2026-08-04

Bu plan `/cadde` sayfasını "canlı bir akış" haline getirme işinin kalanını **küçük, tek
başına commit edilebilir batch'ler** halinde tutar. Her batch bağımsızdır; sıradan sapmak
serbesttir, bağımlılıklar açıkça yazılıdır.

---

## 0. Neden bu plan böyle kuruldu — ölçüm

İş bir tasarım isteği olarak başladı ("burası canlı bir feed olmalı"). Canlı DB ölçümü
teşhisi değiştirdi: **sayfa ölü görünmüyor, sayfa ölü.**

| Ölçüm (2026-08-04, canlı) | Değer |
|---|---|
| `cadde_posts` | 24 — 3'ü seed, 21'i **3 hesaptan** (hepsi iç ekip) |
| Post gövdeleri | 3 seed gerçekçi · 10 klavye zıbırtısı · 11 sohbet kırıntısı (≤44 karakter) |
| Herkese açık akışta görünen | **9 post** (15'i `visibility=cafe`) |
| `cadde_cafes` | 7 — **gerçek kafe 0** (3 zıbırtı, 2 test, 2 seed) |
| hashtag / mention / share | 0 / 0 / 0 |
| moderasyon (report/queue/ban) | 0 / 0 / 0 |
| `diaspora_key` | %100 `tr` |
| 26 `cadde_*` tablosundan boş olan | 10 |

**Sonuç:** Cadde aylarca düşük içerikle yaşayacak. Doğru iş "içerik dolu bir sosyal ağ"
tasarlamak değil, **soğuk başlangıç için tasarlamak** — boşluğun bozukluk değil davet gibi
okunması. Bu, `ui-ux-pro-max` skill'inin verdiği "Vibrant & Block-based, 48px+ blok,
32px+ tipografi" reçetesinin neden olduğu gibi uygulanmadığını da açıklar: o reçete içerik
bolluğu varsayar ve 9 postluk bir akışta sayfayı **daha** boş gösterir.

### Değişmez kısıtlar (batch yazarken bunlara uy)

1. **Cadde light-only.** 17 cadde dosyasında 0 adet `dark:` sınıfı, `.cadde-shell`
   bloklarının `.dark` karşılığı yok.
2. **Yüzey stili sözleşmeye bağlı.** `src/lib/cadde-style-contract.test.ts`: inline
   hex/gradient/shadow YASAK; kart yüzeyi `.cadde-panel` / `.cadde-card` utility'lerinden gelir.
3. **framer-motion Cadde'de kullanılmıyor.** Animasyon dili saf CSS transition (`0.25s ease`)
   + `tailwindcss-animate`. Yeni hareket de bu dilde olmalı.
4. **Tipografi bilinçli küçük.** `text-xs` (69) > `text-sm` (63) > `text-base` (14).
   `font-display` yalnız `CardTitle`'da.
5. **Tek breakpoint `lg` (1024px).** Altında tek kolon, `order` sınıfları akışı en üste alır.
   Ara bir 2 kolon aşaması yok.

---

## 1. Tamamlanan (referans)

| Commit | İş |
|---|---|
| `63b12f0` | Feed hata görünürlüğü · optimistic reaksiyon · feed `staleTime` · cafe sorgusuna açık tavan |
| `26f7f8e` | Eylemli boş akış kartı · sağ kolonda tanıtım konsolidasyonu (7 kart → 5, 3 CTA → 1) |
| _(05.08)_ | **B1 · B2 · B10** — soğuk başlangıç davranışı (aşağıda) |
| _(05.08)_ | **B4** — tazelik bütünlüğü: 8 sorguya `staleTime`, sözleşme testi |
| _(05.08)_ | **B5** — unhandled rejection'ın kök nedeni bulundu ve düzeltildi |

Süit: 209 dosya / 1495 test yeşil, 0 unhandled rejection. `tsc` 98 hata — taban ile aynı.
Dokunulan dosyalarda `eslint` 0 problem.

⚠️ **13 commit deploy bekliyor.** Ekrandaki çift başlık / çift rozet / cafe panelinin yeri
zaten kodda düzeltilmiş; canlıda görünmesi için Coolify deploy'u gerekiyor.

### ⚠️ Soğuk başlangıç işi K1 yapılmadan CANLIDA GÖRÜNMEZ

`isColdStart` yalnız **akış boş VE kafe yok VE daraltan filtre yok** iken true olur.
Canlıda herkese açık akışta **9 post** duruyor → bugün `isColdStart = false` → B1/B2/B10
canlıda hiçbir şeyi değiştirmez. Bu iş **K1 (çöp veri silme) sonrası** görünür hale gelir.
Bugün canlıya yansıyan tek değişiklik B4 (daha az yeniden çekim) ve B5'tir.

### B1'in tanımı plandan bilinçli olarak DAR tutuldu

Plan `feedItems.length === 0 && activeCafes.length === 0` diyordu. Uygulanan koşula
`&& !hasGeoSelection && !filters.bridge && !filters.hashtag` eklendi. Gerekçe: boşluğun
sebebi kullanıcının kendi filtresiyse, o filtreyi gizlemek kullanıcıyı **akışın neden boş
olduğunu göremez** hale getirir. Ham koşul bu durumu da soğuk başlangıç sayardı.
İki sınır da testle kilitli (`CaddePage.test.tsx`).

---

## 2. Kullanıcıda bekleyen kararlar

### K1 — Çöp veri silme (komut hazır, yedek alınmış)

Canlı DB'ye `DELETE` ajan tarafından çalıştırılamıyor (izin sınıflandırıcısı engelliyor;
`SELECT` geçiyor). Script tek transaction, `ON_ERROR_STOP` ile geri sarar, seed
fixture'lara dokunmaz.

- Script: `<scratchpad>/cadde_cleanup.sql`
- Yedek: `C:\tmp\cadde-yedek-2026-08-04\*.csv` (10 tablo, silme öncesi tam anlık görüntü)
- Geri yükleme: `\copy <tablo> FROM <dosya> WITH CSV HEADER`

### K2 — Seed fixture kararı (B7'yi bloke eder)

Kalan 3 post (Berlin / Amsterdam / Londra) ve 2 kafe (Berlin Sabah Kahvesi,
TR-Kopru Mentor Cafe) migration seed'i — uydurma içerik. Silinirse **public akış sıfıra iner.**

- **Kalsın:** akışta gerçekçi metin bulunur, ama canlıda sahte topluluk içeriği gibi okunur.
- **Gitsin:** dürüst ama tamamen boş akış; B7 metinleri "sıfır post" durumuna göre yazılır.

---

## 3. Batch'ler

Büyüklük: **XS** ≈ tek dosya/tek test · **S** ≈ 1–2 dosya · **M** ≈ karar + çok dosya.

### B1 — Sol kolonun soğuk başlangıç davranışı · ✅ **TAMAM (05.08)**

Yapılan: `isColdStart` türetildi (yukarıdaki daraltmayla). Konum kartındaki ülke/şehir
bölümü ve kafe akordeonu soğuk başlangıçta kapalı açılır; **birincil eylem "Caddeye Çık"
ve "+ Cafe Aç" görünür kalır** — kapanan yalnız ayar/boş-kutu kısmı. Açık/kapalı durumu
`null = kullanıcı dokunmadı` override deseniyle türetilir (effect ile senkron YOK), bir kez
tıklandığında kullanıcının kararı kalıcı kazanır. Yükleme sırasında ikisi de kapalı durur;
bu ayrıca kafe panelinin veri beklerken yanlış "henüz cafe yok" mesajını göstermesini de
kapattı. Filtre sıfırlanmadığı testle kanıtlı.

<details><summary>Özgün madde</summary>

**Sorun:** İçerik yokken sol kolon üç kutu gösteriyor (Konum filtresi, Cafeler, İnsanları
Keşfet) — hepsi *filtrelenecek bir şey yokken* filtre/ayar. Akıştan çok yer kaplıyorlar ve
"sistem büyük ama içerik saklanıyor" izlenimi veriyorlar.

**Yapılacak:** İçerik eşiğinin altında (`feedItems.length === 0 && activeCafes.length === 0`)
Konum kartını varsayılan **kapalı/kompakt** hale getir; "Caddeye Çık" birincil eylemi öne al.
Eşik üstünde bugünkü davranış aynen kalır.

- Dosya: `src/pages/cadde/CaddePage.tsx:499-624`
- Test: soğuk başlangıçta filtre kutusu kapalı, içerik varken açık
- Dikkat: `CaddeGeoFilter` URL search-param'a yazıyor — gizlemek filtreyi **sıfırlamamalı**
</details>

### B2 — Boş kart yoğunluğu ve dikey ritim · ✅ **TAMAM (05.08)**

Yapılan: teşhis padding'den daha derindi — soğuk başlangıçta sağ kolon sırayla
"Çarşı yakında / … / yakında gelecek özellikler / bu tanıtım alanı boş" diyordu, yani
kullanıcı üst üste **üç yokluk** okuyordu. Tekrar eden yüzey düştü: `PromotionRail`
soğuk başlangıçta hiç çizilmez (`hideWhenEmpty`) — kampanya yokken tek içeriği kendi boş
kutusu ve iki kart aşağıdaki koyu davet kartı aynı şeyi ÜSTELİK çalışan bir butonla
söylüyor. Aynı kural billboard yüzeyinde (`hasAnyBillboard`) zaten vardı, tutarlı hale
getirildi. Ayrıca iki yan kolonun ritmi soğuk başlangıçta `space-y-5 → space-y-3`.

**Orta kolondaki boş akış kartının `p-8`'i bilinçli olarak KORUNDU** — soğuk başlangıçta
alan harcadığımız tek yer orası olmalı, çünkü sayfanın o durumdaki tek işi ilk paylaşımı
aldırmak. Bu da testle kilitli.

<details><summary>Özgün madde</summary>

**Sorun:** Sağ kolon `space-y-5` (20px) ile ayrılmış kartlardan oluşuyor; soğuk başlangıçta
kartların çoğu boş. Boş kart dolu kartla aynı iç boşluğu (`p-6`, `p-8`) kullanınca sayfa
uzun bir hiçlik şeridine dönüyor.

**Yapılacak:** `.cadde-empty` için kompakt bir varyant (daha az dikey padding), ve boş
kartlar arasında daha dar `space-y`. Dolu kartların ritmi değişmez.

- Dosya: `src/index.css:313-446` (`.cadde-empty`), `CaddePage.tsx` aside
- Test: `cadde-style-contract.test.ts` hâlâ geçmeli (inline değer yok)
</details>

### B3 — İkincil okuma yollarında hata görünürlüğü · **M** · bağımsız

**Sorun:** `63b12f0` yalnız `listCaddeFeed`'i düzeltti. Aynı yutma deseni duruyor:
`listCaddeCafes`, `listCaddeCafeFeed`, `listCaddePostComments`, `listCaddeBillboardCards`,
`getCaddeSponsoredPlacement`, `searchCaddePeople` — hepsi hatayı `reportCaddeApiError`'a
verip boş sonuç dönüyor.

**Karar gerekiyor:** hangileri "birincil yüzey"? Kural (`caddeReadError` docstring'inde
yazılı): sayfanın TAMAMINI besleyen yüzey fırlatır, yan panel/rozet boş döner.
- `listCaddeCafeFeed` → `/cadde/cafe/:id` sayfasının TEK içeriği. Büyük ihtimalle birincil.
- `listCaddePostComments` → açık yorum paneli. Sınırda.
- Diğerleri → ikincil, bugünkü kalıpta kalmalı.

- Dosya: `src/lib/cadde-api.ts`, `src/pages/cadde/CaddeCafePage.tsx`
- Test: `cadde-feed-error-visibility.test.ts` kalıbı çoğaltılır

### B4 — Cadde sorgularında `staleTime` bütünlüğü · ✅ **TAMAM (05.08)**

Yapılan: planın saydığı 4 sorgu değil, **/cadde ile mount olan 8 sorgunun tamamı**
kapsandı ("bütünlük" batch'in adıydı) — `CaddePage` (countries, cities, allCities,
peopleSearch, cafes, billboards, sponsor, feedPromotions) + `PromotionRail`,
`CarsiGlobalTicker`, `CaddeTrendingHashtags`, `NotificationsBell`. Pencereler tek
kaynakta: `src/lib/cadde-query-cache.ts` (referans 1sa / liste 1dk / tanıtım 5dk).
Global `defaultOptions` planın dediği gibi VERİLMEDİ.

Yeni sözleşme testi `src/lib/cadde-query-cache.test.ts`: **her Cadde sorgusu ya
`staleTime` ya `refetchInterval` taşımalı** — ikisi de yoksa sorgu "kazara canlı"dır.
Bilerek canlı olan ikisi (yorum paneli, yeni-post sayacı) `refetchInterval` ile geçer.
Bildirim zili `staleTime` aldı: realtime `invalidateQueries` staleTime'ı zaten ezer,
pencere yalnız odak-yenilemesini keser.

<details><summary>Özgün madde</summary>

**Sorun:** `src/App.tsx:81` → `new QueryClient()`, `defaultOptions` YOK. React Query v5
varsayılanları geçerli: `staleTime: 0`, `refetchOnWindowFocus: true`. `63b12f0` yalnız
feed'i düzeltti; `cafesQuery`, `billboardsQuery`, `sponsorQuery`, `feedPromotionsQuery`
hâlâ her sekme odağında yeniden çekiliyor.

**Yapılacak:** Bu dört sorguya `staleTime` ver. **Global default VERME** — `queryClient`
209 sayfa tarafından paylaşılıyor, global değişiklik kapsam dışı bir risk.

- Dosya: `src/pages/cadde/CaddePage.tsx:160-178`
- Test: sözleşme testi — cadde sayfasındaki her `useQuery` `staleTime` taşımalı
</details>

### B5 — `DirectoryPage` unhandled rejection · ✅ **TAMAM (05.08) — kök neden bulundu**

**Önceden vardı, `63b12f0` ile ilgisi yok.** Kanıt: `git show --stat 63b12f0` yalnız 8
cadde dosyası değiştiriyor; `DirectoryPage.tsx`/`.test.tsx` ikisi de o commit'ten çok
önce yazılmış ve o tarihten beri dokunulmamış.

**Kök neden** — `DirectoryPage.tsx:121-123`, temizleyicisi olmayan bir effect:
```tsx
useEffect(() => { void getTotalDirectoryCount().then(setTotalCount); }, []);
```
Üç şey üst üste bindi: (a) `isMounted` koruması yok — hemen üstündeki kardeş effect'te
var, (b) `getTotalDirectoryCount` testte **mock'lanmamıştı**, dolayısıyla her render
GERÇEK bir Supabase isteği deniyor ve `ENOTFOUND` ile ağ zaman aşımına kadar sürüyordu,
(c) süit paralel koşarken bu istek dosya teardown'ından SONRA çözülüyor, `setTotalCount`
sökülmüş ağaca yazıyor, React `window`'a dokunuyor → `ReferenceError`. Yalın koşuda
zamanlama tutmadığı için görünmüyordu.

**Düzeltme iki taraflı:** ürün kodunda `isMounted` koruması (bu gerçek bir kusurdu —
kullanıcı sayım dönmeden /directory'den ayrılırsa aynı setState oluyordu), testte
`getTotalDirectoryCount` mock'u (dosya artık ağa hiç çıkmıyor: 3 test 238ms).
Son tam süit: 209 dosya / 1495 test, **0 unhandled rejection**.

### B6 — Çöp veri sonrası canlı doğrulama · **XS** · **K1'e bağlı**

K1 çalıştıktan sonra silinenleri ve kalanları doğrula: `cadde_posts` / `cadde_cafes` /
`cadde_cafe_members` / `cadde_post_comments` sayıları, `notifications` cadde tipleri,
ve public akışta kaç post kaldığı (`visibility='public'`).

### B7 — Boş durum metinlerinin finali · **S** · **K2'ye bağlı**

Seed kalırsa metinler "içerik az" dilinde kalır. Seed giderse akış **tamamen** boş olur ve
metin bunu dürüstçe söylemeli ("Cadde yeni açıldı, ilk paylaşım senin olabilir") — bugünkü
"içerik azsa global akış devreye girer" cümlesi o durumda yanlış olur (`sparseContentHint`,
`CaddePage.tsx:473-475`).

### B8 — İçerik stratejisi karar dokümanı · **M** · **3. adım, K2'den sonra**

Kod değil, karar. Kapsam: ilk 100 gerçek postun nereden geleceği, davet/onboarding akışı,
seed politikası (bir daha sahte içerik girilecek mi), çoklu-diaspora ne zaman açılır
(bugün %100 `tr`, ikinci bir değer olmadığı için ayrım üretimde doğrulanamıyor).

### B9 — Sonsuz kaydırma · **ERTELENDİ** · tetik koşullu

`63b12f0`'da bilinçli olarak yapılmadı: 9 postluk akışta IntersectionObserver hiçbir şey
kazandırmaz, sadece karmaşıklık ekler. **Tetik:** herkese açık akışta post sayısı düzenli
olarak 40'ı (2 sayfa) geçtiğinde yeniden değerlendir.

### B10 — Mobil soğuk başlangıç · ✅ **TAMAM (05.08)**

Yapılan: soğuk başlangıçta sağ kolon `lg` altında tek bir tetiğin ("Yakında gelenler ve
tanıtım") arkasına katlanır.

**Viewport bilerek JS ile ölçülmedi.** `useIsMobile` 768px'te (Cadde'nin eşiği 1024) ve
ilk render'da `undefined` döndüğü için mobilde kolon önce açık çizilip sonra göz önünde
katlanırdı — B1'de kaçındığımız jank'in aynısı. Bunun yerine tetik `lg:hidden`, içerik
`lg:block`: masaüstünde React durumu ne olursa olsun CSS kazanır, kolon her zaman
açıktır. İçerik hiçbir durumda DOM'dan sökülmez. Sıfır yeni bağımlılık, sıfır hook.

---

## 4. Önerilen sıra

```
K1 (kullanıcı) ──> B6          ← SIRADAKİ, ve B1/B2/B10'u görünür kılan adım
K2 (kullanıcı) ──> B7 ──> B8
B3 (bağımsız, karar gerektirir)
B9 (ertelendi — tetik: herkese açık akış düzenli olarak 40 postu geçince)

✅ B1 ──> B2 ──> B10   (05.08)
✅ B4                  (05.08)
✅ B5                  (05.08)
```

**Kalan iş artık kod değil, karar.** B1/B2/B10 soğuk başlangıç yüzeyini bitirdi ama
canlıda 9 post durduğu için o yüzey henüz hiç çizilmiyor — sıradaki hamle **K1**.
Kod tarafında kalan tek bağımsız madde **B3** (ikincil okuma yollarında hata
görünürlüğü) ve o da "hangileri birincil yüzey" kararını bekliyor.

---

## 5. Kaynaklar

- Canlı DB denetimi ve şema tuzakları: agent hafızası
  `project_cadde_live_feed_audit_2026_08_04.md`
- Şema notu: yazar sütunu `author_user_id` (`author_id` DEĞİL), kafe isim sütunu `title`
  (`name` DEĞİL) — sorgu yazmadan önce buna bak
- Cadde mimarisi: `docs/ARCHITECTURE.md` §4 · `docs/cadde-300/change-report.md`
- Sözleşme testleri: `cadde-style-contract` · `cadde-write-diagnostics` ·
  `cadde-feed-error-visibility` · `cadde-query-limits`
