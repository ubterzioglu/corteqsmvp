# Public Rotalar / Sitemap — Kalan İşler

**Tarih:** 21 Eylül 2026
**Ön koşul:** `docs/plans/2026-09-20-public-rotalar-sitemap-plani.md` (4 batch) **tamamlandı**
— commit `df6236d`.

> Bu dosya, o planı uygularken **ölçülerek ortaya çıkan** işleri tutar. Hiçbiri tahmin
> değil; her maddenin altındaki rakam bu oturumda çalıştırılan bir komuttan gelir.
> Sıra bağlayıcı değil, maddeler birbirinden bağımsız. Rakamları **ezberleme** —
> dokunmadan önce ölçüm komutunu tekrar çalıştır.

## Kapanan plan neyi bıraktı

| Batch | Durum | Kanıt |
|---|---|---|
| 0 — Dört rota açılıyor | ✅ | Playwright 9/9 yeşil (`e2e/public-rotalar-smoke.spec.ts`) |
| 1 — Demo işaretleri | ✅ | Rozet + bant `DEMO_ROUTES` tek kaynağından türüyor, tarayıcıda doğrulandı |
| 2 — Sitemap | ✅ | 113 URL; `/city-ambassadors` + `/consultants` içeride, `/businesses` bilinçle dışarıda |
| 3 — Kırık bağlantı | ✅ | `/radio/:id/song-request` iki dosyadan kaldırıldı; repo genelinde 0 kırık iç bağlantı |

---

## PR1 — `AssociationDetail.tsx`'te 18 düğme hiçbir şey yapmıyor

**Neden bu plana taşındı:** kapanan planın Batch 3'ü *404'e düşen* düğmeyi kapattı.
Ölçünce aynı sayfada çok daha büyük bir sınıf çıktı — 404 bile vermeyen, tamamen
hareketsiz düğmeler.

**Ölçüm (2026-09-21):**

| Dosya | `<Button>` | `onClick` | `<Link>` |
|---|---|---|---|
| **`src/pages/AssociationDetail.tsx`** | **23** | **1** | **4** |
| `src/pages/Associations.tsx` | 6 | 6 | 4 |
| `src/pages/HospitalAppointment.tsx` | 7 | 6 | 1 |
| `src/pages/BusinessDetailPage.tsx` | 2 | 0 | 2 |

Yani sorun **tek dosyada**. Öbür üç sayfanın her düğmesinin ya `onClick`'i ya da
sarmalayan `<Link>`'i var; `AssociationDetail`'de ~18 düğme ikisine de sahip değil:
"Üye Ol", "Aidat Öde", "Bağış Yap", "Mesaj Gönder", "Randevu Al", "E-Konsolosluk",
"İletişim", "Paylaş", "Dinle".

**⚠️ Bu, 404'ten daha kötü bir kusur sınıfıdır.** 404 görünür bir hatadır ve
bildirilir. Hareketsiz düğme sessizdir: kullanıcı tıklar, hiçbir şey olmaz,
çoğu insan bunu kendi cihazının/bağlantısının sorunu sanıp bildirmez bile.

**⚠️ Sayfanın kendisi zaten DEMO'dur** — `DemoPageBanner` taşır, verisi
`src/data/mock.ts`'ten gelir. Yani doğru çözüm "hepsini çalıştır" değil.

### Yapılacaklar
1. 18 düğmenin her biri için üç karardan **birini** ver:
   - **Bağla** — gerçek bir hedefi varsa (`Paylaş` → `MapShareButtons` deseni zaten
     `Associations.tsx`'te var, kopyalanabilir).
   - **Kaldır** — karşılığı olmayan ve yakın planda da olmayacaklar.
   - **"Yakında" olarak işaretle** — `disabled` + ipucu; tıklanabilir görünmesin.
2. Kararları sayfa başına yorum olarak yaz (repodaki desen), yoksa bir sonraki
   oturum aynı soruyu baştan sorar.
3. `e2e/public-rotalar-smoke.spec.ts`'e bir test ekle: `/association/:id`'de
   `<Button>` sayısı ile "gerçekten bir şey yapan" düğme sayısı arasındaki fark
   kabul edilen sayıyı aşmasın.

**Doğrulama:** sayfadaki her görünür düğme ya gezinir, ya bir iş yapar, ya da
`disabled` görünür. Üçünden hiçbiri olmayan düğme kalmamalı.

**Tahmini iş:** ~2 saat, ama ağırlığı kodda değil **senin ürün kararında** — 18
düğmenin her biri ayrı bir karar.

---

## PR2 — Kırık iç bağlantı için sözleşme testi

**Neden gerekli:** bu oturumda repo genelinde tarama yaptım, **App.tsx + iç içe
`routes.tsx` tablolarındaki 162 rota parçasına karşı eşleşmeyen tek bir literal iç
bağlantı kalmadı**. Ama bunu koruyan hiçbir şey yok. `/radio/:id/song-request`
rotası **hiç yazılmamıştı** ve düğme aylarca fark edilmeden orada durdu — ne lint,
ne test, ne `tsc`, ne build yakaladı. CLAUDE.md'nin "sessizce bozulan sınıf"
tanımına tam oturur; kalıcı çözümü sözleşme testidir.

### Yapılacaklar
`src/lib/internal-links.test.ts` yaz. `redirects.test.ts`'in yanına oturur ve onun
gibi **kaynak metni** denetler:

1. `src/App.tsx` **ve** tüm iç içe `routes.tsx` dosyalarından `path="..."` değerlerini topla.
2. `src/**/*.tsx` içinden `to="/..."` literallerini topla.
3. Her bağlantının bir rotayla eşleştiğini doğrula.

**⚠️ Taramayı yazarken düşülen üç tuzak** (bu oturumda üçüne de düşüldü, düzeltildi):
1. **İç içe rota tabloları unutulursa** 40+ yanlış pozitif gelir. `/admin/*` yolları
   `src/App.tsx`'te **görünmez**; `src/pages/admin/routes.tsx` gibi dosyalarda yaşar.
   Tarama yalnız `App.tsx`'e bakarsa tüm admin bağlantıları "kırık" görünür.
2. **`?` ve `#` soyulmazsa** `/feedback?kaynak=cadde`, `/legal/privacy#rights`,
   `/login?next=%2Fcity-ambassadors` gibi geçerli yollar kırık sayılır.
3. **Nested tablo yolları görelidir** — `routes.tsx` içindeki `path="data"`, tam yol
   `/admin/data`'dır. Eşleştirme sonek (suffix) olarak yapılmalı, birebir değil.

**Doğrulama:** test bugün yeşil olmalı (0 kırık bağlantı var). Sonra `App.tsx`'ten
bir rotayı geçici olarak sil → test **düşmeli**. Düşmüyorsa test hiçbir şey ölçmüyordur.

**Tahmini iş:** ~1 saat. Küçük iş, yüksek getiri.

---

## PR3 — Playwright bu makinede hiç koşmuyor

**Ölçüm (2026-09-21):** `npm run test:e2e` bu makinede **her zaman** düşer. İki ayrı
ve kalıcı neden var:

1. **Port 8080 başka bir uygulamada.** `playwright.config.ts` `webServer.url`'ü
   `http://localhost:8080` bekliyor. O portu `wslrelay.exe` (WSL) ve
   `host-switch.exe` (Rancher Desktop) tutuyor. Nginx/vite değil — **HTTP 404
   döndürüyorlar.** Yani Playwright "sunucu ayakta" sanıp beklemeye devam ediyor ve
   `Timed out waiting 120000ms from config.webServer` ile düşüyor. Vite ise porta
   hiç bağlanamıyor.
2. **`predev` açılışı geciktiriyor.** `npm run dev` önce `verify:text` çalıştırır
   (tüm kaynak ağacını UTF-8/mojibake için tarar). Soğuk açılış Playwright'ın 120 sn
   penceresine sığmıyor.

**Geçici çözüm (bu oturumda kullanıldı):**
```bash
npx vite --port 8099 --strictPort          # ayrı terminalde
PLAYWRIGHT_BASE_URL=http://localhost:8099 npx playwright test
```

### Yapılacaklar
1. `playwright.config.ts` → `webServer.command`'ı `npx vite` yap. `predev` atlanır;
   `verify:text` zaten `prelint`/`pretest`/`prebuild`'de koşuyor, e2e'de tekrarı gereksiz.
2. Portu sabit yazma — env'den oku, varsayılanı 8080 dışında bir değer yap
   (ör. `PORT ?? 8099`). Aynısı `vite.config.ts`'in `server.port`'u için de geçerli.
3. `webServer.timeout`'u 180 sn'ye çıkar.

**⚠️ `reuseExistingServer` bu kusuru gizler**: config'de `!process.env.CI` olarak açık.
8080'de yanlış bir sunucu varken Playwright onu "mevcut sunucu" sanar. Port değişikliği
bunu da kapatır.

**Doğrulama:** temiz bir terminalde `npm run test:e2e` — elle sunucu başlatmadan
9 smoke testi yeşil olmalı.

**Tahmini iş:** ~30 dk.

---

## PR4 — Sitemap'te `etkinlik: 0` ve `kurulus: 0` (kod işi DEĞİL)

**Bu bir kusur değil, veri durumudur.** Ayrım önemli çünkü rakamı gören bir sonraki
oturum `generate-sitemap.mjs`'i "tamir etmeye" kalkabilir.

`npm run generate:sitemap` çıktısı:
```
113 URL yazıldı (statik: 30, commercial: 5, blog: 50, anket: 1,
                 diaspora: 7, directory/catalog: 20, kurulus: 0, etkinlik: 0)
```

**Script DB'ye bağlandı.** Bağlanamasaydı `[sitemap] Supabase env yok — etkinlikler
atlandı.` uyarısını basardı; basmadı, üstelik `blog: 50` ve `directory/catalog: 20`
aynı bağlantıdan geldi. Yani `status = 'published'` etkinlik gerçekten **yok**.

Kök neden: yeni etkinlik `status: "pending"` ile açılıyor (`src/lib/events-api.ts:158`)
ve `getEventRoutes` yalnız `published` olanları alır.

### Yapılacaklar
1. Etkinlik onay kuyruğunu boşalt (`publishEvent` → `src/lib/events-api.ts:176`).
2. Bağımsız kuruluş profillerinin yayın durumunu kontrol et (`kurulus: 0`).
3. `npm run generate:sitemap` tekrar çalıştır — sayılar kendiliğinden artar.

**Kod değişmeyecek.** Etkinlik detay sayfaları `Event` JSON-LD taşıdığı için
rich-result adayıdır; keşif dışı kalmaları doğrudan kayıptır.

---

## PR5 — Paralel oturumun bıraktıkları (rapor, bu planın işi değil)

Bu repoda **aynı anda başka oturumlar çalışıyor** ve çalışma dizini paylaşılıyor.
21 Eylül 15:00 itibarıyla `git status` **29 dosya** gösteriyordu; bunların yalnız
3'ü yukarıdaki planın işiydi ve `df6236d` ile commit'lendi.

**⚠️ İki migration `supabase/migrations/` parent dizininde duruyor:**
```
20260921090000_directory_search_anon_normalized.sql
20260921100000_ai_knowledge_base.sql
```
CLAUDE.md'de belgelenen kör nokta bu: **parent dizin sürüm karşılaştırmasına dâhil
değildir.** Dosyalar `applied/` (bugün 149 dosya) altında yaşamalı. `check:migrations`
artık bunu ayrı sinyal olarak yakalıyor (`findStrayParentMigrations`), ama taşıma işi
o migration'ları yazan oturumun.

**⚠️ Commit alırken dizin pathspec'i kullanma.** `git commit -- <dosya>` ile tek tek
al; `git commit -a` ya da dizin pathspec'i başka oturumun yarım işini commit'e sokar.
Bu tuzak bu repoda daha önce yaşandı.
