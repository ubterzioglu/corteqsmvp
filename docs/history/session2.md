# Oturum özeti — 2026-08-05 (Cadde)

> Kök dizine dosya eklenmiyor (CLAUDE.md kuralı), bu yüzden `docs/history/` altında.

Oturum "`/cadde`'yi premium yap" işinin yarım kalan planıyla başladı
(`docs/plans/2026-08-04-cadde-canli-feed-plan.md`), soğuk başlangıç batch'leriyle
devam etti ve bir görünürlük hatasının kök nedenine indi.

## Commit'ler (hepsi `main`'de, push'lu)

| Commit | İş |
|---|---|
| `93c67b7` | B5 — `DirectoryPage`'de sökülmüş bileşende `setState` |
| `7e3e3f7` | B1+B2+B10 soğuk başlangıç yüzeyi + B4 sorgu tazelik bütünlüğü |
| `ee4d41c` | Açılış içeriği taslağı (K2 kararı) |
| `80a952a` | Açılış script'i — K1+K2+editöryel içerik tek transaction |
| `5e9eb88` | Görünürlük düzeltmesi — geo köprüsü + kör izleyici emniyet supabı |

Süit: **209 dosya / 1498 test yeşil**, `tsc` 98 (taban ile aynı), dokunulan
dosyalarda lint 0 problem.

---

## 1. Plandan devralınan kod batch'leri

**B1 — soğuk başlangıçta sol kolon.** İçerik ve daraltan filtre yokken Konum filtresi
ve kafe akordeonu kapalı açılır; birincil eylemler ("Caddeye Çık", "+ Cafe Aç")
görünür kalır. Açık/kapalı durumu `null = kullanıcı dokunmadı` override deseniyle
türetiliyor — effect ile senkron yok, veri geç geldiğinde panel göz önünde kapanmıyor.

> **Plandan bilinçli sapma:** ham koşul (`feed=0 && cafes=0`) daraltıldı,
> `!hasGeoSelection && !bridge && !hashtag` eklendi. Boşluğun sebebi kullanıcının
> kendi filtresiyse o filtreyi gizlemek, kullanıcıyı akışın neden boş olduğunu
> göremez hâle getirirdi. İki sınır da testle kilitli.

**B2 — boş kart yoğunluğu.** Teşhis padding'den derindi: sağ kolon üst üste
"Çarşı yakında / yakında gelecek özellikler / bu tanıtım alanı boş" diyordu, yani
kullanıcı üç yokluk okuyordu. Tekrar eden yüzey düştü (`PromotionRail` soğuk
başlangıçta çizilmiyor), yan kolon ritmi `space-y-5 → space-y-3`. Orta kolondaki boş
akış kartının `p-8`'i **korundu** — soğuk başlangıçta alan harcanacak tek yer orası.

**B10 — mobil katlama.** Sağ kolon `lg` altında tek tetiğin arkasına katlanıyor.
Viewport JS ile ölçülmedi: `useIsMobile` 768px'te ve ilk render'da `undefined`
döndüğü için mobilde kolon önce açılıp göz önünde katlanırdı. Tetik `lg:hidden`,
içerik `lg:block` — masaüstünde CSS kazanır, içerik DOM'dan sökülmez.

**B4 — sorgu tazelik bütünlüğü.** Planın saydığı 4 değil, `/cadde` ile mount olan
**8 sorgunun tamamı**. Pencereler tek kaynakta: `src/lib/cadde-query-cache.ts`.
Yeni sözleşme testi: her Cadde sorgusu ya `staleTime` ya `refetchInterval` taşımalı —
ikisi de yoksa sorgu "kazara canlı"dır.

**B5 — unhandled rejection.** Kök neden bulundu ve `63b12f0` ile **ilgisi yokmuş**.
`DirectoryPage.tsx`'te `getTotalDirectoryCount` effect'inin temizleyicisi yoktu;
ayrıca fonksiyon testte mock'lanmamıştı, her render gerçek Supabase isteği deniyordu.
İkisi de düzeltildi (dosya 238ms'ye düştü, süitte 0 unhandled rejection).

---

## 2. Ölçüm iki kez tasarımı değiştirdi

**a) İçerik planı.** İlk taslak Almanya/Hollanda/İngiltere diasporasına yazılmıştı.
Canlı üye dağılımı bunu çürüttü: İstanbul 14, **Doha 12**, Ankara 7, Berlin 5+,
İzmir 5. Türkiye tarafı için 4 Köprü postu eklendi, Doha eklendi, Köln ve München
çıkarıldı (`cadde_cities`'te yoklar).

**b) "68 üye kör" iddiam yanlıştı.** Feed şehir çözümlemesini ülkeden **bağımsız**
yapıyor, o yüzden ülkesi çözülmeyen 19 üye şehri üzerinden kurtuluyordu. Doğru sayı
**49**'du. Dahası 49'un giriş yapmış 30'u zaten `CaddeProfileGate` görüyordu; sessiz
boşluk yaşayan 19 hesabın **hiçbiri hiç giriş yapmamıştı**.

---

## 3. K2 kararı: kimlik uydurulmadı

Kullanıcı "gerçek kullanıcı gibi placeholder ekleyemez misin" dedi. Uydurma kişi
kimliği üretmek yerine içerik **gerçek ekip hesabından** yayınlandı ve
`author_name_override = "CorteQS"` + `author_role = "Resmî hesap"` ile rozetlendi.
Gerekçe: gerçek bir üye "Ayşe K., Berlin"e cevap yazıp karşılık alamazsa zarar gören
platformun kendisi olur. İçerik ağırlıklı **soru** — akışın işi bilgi vermek değil
konuşma başlatmak, ayrıca ekip bilmediği mevzuatı bilir gibi yazmıyor.

---

## 4. Asıl bulgu: iki coğrafya kaynağı metinle eşleştiriliyordu

Kullanıcının ilk isteği "o üyelerden hesaplarını yeniden oluşturmalarını isteyelim"
idi. Ölçüm bunun **yanlış araç** olduğunu gösterdi:

- Profil dropdown'ı `geo_countries`'ten (251) besleniyor, feed `cadde_countries`'e
  (18) bakıyor. İki liste 2 yerde ayrışıyor: `İngiltere` ↔ `Birlesik Krallik`,
  `ABD` ↔ `Amerika Birlesik Devletleri`.
- Yani yeniden kayıt olan bir üye dropdown'dan "İngiltere" seçse **aynı duvara
  çarpardı**. Sorun üyelerin kaydında değil, mimaride.
- Köprü zaten kuruluydu ama kullanılmıyordu: `cadde_countries.geo_country_id` 18/18,
  `cadde_cities.geo_city_id` 50/51 dolu.
- Ayrıca `cadde_ensure_geo_city()` fonksiyonu tam bu zinciri zaten kuruyor ve
  `trg_cadde_profile_city_sync` trigger'ıyla **yeni kayıtlar için çalışıyor**. Kör
  hesaplar o trigger'dan önce yazılmış eski satırlardı.

**Migration `20260805120000`** üç şey yaptı: `cadde_resolve_viewer_location()`
(ad eşleşmesi → geo köprüsü), görünürlük kapısına "konumu çözülemeyen izleyici" dalı,
ve mevcut fonksiyonla backfill. Feed gövdesi elle kopyalanmadı — canlı
`pg_get_functiondef` çıktısı alındı, baseline ile birebir aynı olduğu doğrulandı,
sonra yalnız iki nokta düzenlendi. `src/lib/cadde-ranking.ts` ayna sözleşmesi
(`viewerLocationResolved`) aynı commit'te güncellendi, 3 test eklendi.

---

## 5. Uygulama sonrası doğrulama (canlı)

| Ölçüt | Önce | Sonra |
|---|---|---|
| Ülkesi çözülen üye | 88 | **110** |
| Şehri çözülen üye | 102 | **106** |
| En az biri çözülen | 107 | **112** |
| Tamamen kör | 49 | **44** |
| Aktif ülke / şehir | 18 / 51 | **22 / 55** |
| Akıştaki post | 9 (çoğu zıbırtı) | **14 editöryel** |

- Konumu çözülemeyen 44 üyenin **hepsi 14 post görüyor** → emniyet supabı çalışıyor.
- Konumu çözülen 112 üye ortalama 6.2 post görüyor.
- Açılış script'i tam başarılı: seed 0, kafe 0, çöp bildirim 0, 82 hedef satırı,
  Türkçe karakterler sağlam.

### Kalan iki eksik → `docs/operations/2026-08-05-cadde-acilis-duzeltme.sql`

1. **`schema_migrations` kaydı yazılmadı.** Migration çalıştı ama sürüm kaydı yok;
   `npm run check:migrations` sonsuza dek "uygulanmamış" der. (Bu repoda üçüncü kez:
   2026-07-18, 2026-07-20, şimdi.)
2. **6 üye hâlâ boş akış görüyor.** Sıra sorunu: açılış script'i çalıştığında 18
   ülke vardı ve global postlara 18'er hedef yazıldı; ardından backfill 4 ülke daha
   ekledi (Güney Afrika, İtalya, Moldova, Suudi Arabistan). O ülkelerdeki 5 üyenin
   konumu artık çözülüyor — yani emniyet supabı devreye girmiyor — ama hiçbir post
   onları hedeflemiyor. 6.'sı profil ülkesi "vancouver" olan kayıt.

---

## Sıradaki iş

1. **Düzeltme script'ini çalıştır** (yukarıdaki iki maddeyi kapatır).
2. **Coolify deploy** — soğuk başlangıç/UI değişiklikleri henüz canlı değil.
3. **Yapısal karar:** "global post" bugün N hedef satırıyla, yani bir *anlık
   görüntüyle* ifade ediliyor. Katalog trigger'la büyümeye devam edeceği için bu
   her yeni ülkede tekrar bayatlayacak. Kalıcı çözüm "global"i sayım yerine
   **özellik** olarak ifade etmek (ör. kapıya `p.country_id is null and hedefi yok`
   dalı). Riski: konumsuz bir kullanıcı postu da global olur — karar gerekiyor.
4. **Faz 2 — pilot aktivasyon:** ülke/şehri hiç girmemiş ama giriş yapmış 27 hesaptan
   10-15'ine "profilinde ülke ve şehir eksik" mesajı. Yeniden kayıt talebi YOK.

## Bu oturumda öğrenilenler

- Ajan canlı DB'ye **yazamıyor** (izin sınıflandırıcısı) ama **okuyabiliyor**. Yazma
  gerektiren her adımı baştan kullanıcıya devredilecek olarak planla.
- Bir fonksiyonun canlı tanımını `pg_get_functiondef` ile alıp düzenlemek, 300 satırı
  elle kopyalamaktan güvenli — baseline'ın bayat olma ihtimalini de kapatır.
- Migration dosyasına `\set ON_ERROR_STOP on` koymayı unutma; ilk denemede psql
  hatayı geçip devam etti ve kısmi uygulama izlenimi yarattı.
- Ölçüm yapmadan sayı söyleme: bu oturumda bir kez "68 kör" dedim, doğrusu 49'du.
