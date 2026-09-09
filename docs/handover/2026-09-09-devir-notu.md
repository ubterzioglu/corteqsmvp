# Devir notu — 9 Eylül 2026 (gün sonu)

> **Bu belge sıfırdan gelen biri için yazıldı.** Başka bir şey okumana gerek yok.
> Batch numarasını al, o batch'i yap, kapanış turunu koş, commit'le. Batch'ler
> arasında bilgi taşınmaz.

---

## 0. Otuz saniyede durum

| | |
|---|---|
| Depo | `C:\temp_private\corteqs\corteqs_fin` · branch `main` |
| Son commit | `dce73ad` · `origin/main` ile senkron · çalışma ağacı **temiz** |
| Test tabanı | **262 dosya / 1.851 test** yeşil |
| `tsc` | **6** hata (taban — artmamalı, hiçbiri canlı kusur değil) |
| ESLint | **0** |
| Migration | sapma yok |
| Pano | `/admin/workshop/cadde` → WS3 sekmesi · **18/31** |

**⚠️ AÇIK TEK OPERASYON İŞİ:** son commit (`1e0d65f`, acil maddelere yorum sistemi)
**canlıya çıkmadı**. Ölçüldü:
`curl -sI https://corteqs.net/assets/CommandCenterManager-B177ZBk0.js` → **404**.
Commit 21:19 UTC'de atıldı, o sıradaki deploy 21:20:15'te *bitti* — yani build
commit'ten önce başlamış ve bu commit kuyruğa girmemiş. Coolify'dan yeniden yayın
gerekiyor; kullanıcı bunu üstlendi. **Yayından sonra doğrulama:** aynı komut **200**
dönmeli.

---

## 1. Bugün ne yapıldı

27 Ağustos'ta yapılan iki dış denetimin (`docs/cadde-300/2026-08-27-ux-degerlendirme.md`,
`2026-08-27-ui-kritigi.md`) **31 açık maddesinden 18'i** kapatıldı.

| Commit | İş |
|---|---|
| `cdfa100` | H1 — sıfır tepki/yorum/paylaşım sayaçları gizlendi |
| `60d1df8` | H2 — anlamsız "Caddeye Çık" butonu kaldırıldı |
| `765fb7c` | H3 — Pinned→Sabit, Feedback Ver→Geri Bildirim, Host→Ev Sahibi (8 yer) |
| `08225f7` | H4 — girişli üyeye pazarlama sloganı gösterilmiyor |
| `9021507` | H5 — beta bandı kapatılabilir + kalıcı |
| `d90350d` | **B1+B2** — boş daraltılmış akışta üst kapsam sunuluyor |
| `d5ec924` | C1+C2 — kapasite paydası gizlendi, Arşivle kebaba taşındı |
| `bdb6de8` | Y1 — kimlik şeridi kaldırıldı, zil kapsam şeridine taşındı |
| `a82d86c` | Y2 — scroll'da header daralması |
| `3a236e5` | T1 — marka token'ları + tasarım kuralı dokümanı |
| `3853a1d` | T2 — bronz birincil eylem |
| `2aa4dab` | T3 — buton hiyerarşisi |
| `0af23bf` | T4 — üst nav tek nötr renk |
| `1e0d65f` | Acil maddelere soru/cevap yorum sistemi |
| `dce73ad` | T5 — gökkuşağı şerit pillar renk koduna çevrildi |

Yol üstünde kapatılan eski borçlar: `74b16fb` S1 · `5493de7` S2 · `088d12d` S3 ·
`01fa683` tip borcu · `60d03ed` O2 güvenlik · `f376a4f` araç kataloğu ·
`382bbf2` sahipsiz dosyalar · `72f4bdd` kırılgan test.

---

## 2. ⚠️ ÖNCE BUNU OKU — bu oturumun en pahalı dersi

**Plandaki reçeteler DÖRT KEZ yanlış çıktı.** Dördü de dosya açılmadan doğru
varsayılsaydı zarar verecekti:

1. **H1** — plan iki adres veriyordu, **dördü** vardı. Verilen `:974` yalnız tepki
   paneli *açıkken* çiziliyor; kapalı kartta görünen sayaç başka yerde.
2. **H2** — plan "testi de kaldır" diyordu; o satır ayrı bir test değil, başka bir
   testin içindeki üç iddiadan biriydi. Ayrıca "ölü kod" denen `scrollToComposer` ve
   `Megaphone` **canlı kullanımdaydı** — silinseydi derleme kırılırdı.
3. **B1** — plan `:1283` diyordu, metin `:1305`'teydi ve **başka bir yüzeydeydi**
   (boş durum kartı değil, sağ raildeki panel). Dört test ona bağlıydı.
4. **Y1** — plan "başlığı header'a taşı" diyordu; ölçünce taşınacak başlık olmadığı
   (`h1` yok) ve şerit yüksekliğini **zilin** belirlediği çıktı. Sözlük anlamıyla
   uygulansa **~0px** kazandırıp 61 rotayı riske atacaktı.

> **KURAL:** batch metnindeki satır numarası ve "şunu da sil" talimatı, **dosya
> açılmadan doğru varsayılmaz.** Önce oku, sonra uygula.

---

## 3. Her batch'in değişmez kapanış turu

```
npm run test        # taban 262 dosya / 1.851 — DÜŞERSE DUR
npm run lint        # taban 0
npx tsc -p tsconfig.app.json --noEmit   # taban 6 — ARTMAMALI
```

**Çalışma dizini BÜYÜK harfli `C:` olmalı.** Küçük harfli `c:` ile vitest testlerin
çoğunu *sahte* kırar (Node `file:///c:/` ile `file:///C:/` adreslerini farklı modül
sayar). Bağımlılık düşürme.

**Commit her zaman pathspec'li:** `git commit -- <yalnız dokunduğun dosyalar>`.

**`src/lib` altına yeni export ya da `scripts/` altına yeni dosya eklediysen
`npm run ingest:tools` çalıştır.** Uyarı: plan "yoksa test kırılır" diyor —
**kırılmıyor**, bu oturumda üç kez sessizce sapma bıraktı. Elle koş.

---

## 4. KALAN İŞLER — küçük batch'ler

Kaynak plan: `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md`.
Tasarım kuralı: `docs/modules/cadde-design-tokens.md`.

### T — Tasarım sistemi *(3 batch)*

| Batch | Madde | İş | Süre |
|---|---|---|---|
| **T6** | m142 | Rozetleri üç tipe indir | ~25 dk |
| **T7** | m143-145 | Tek köşe yarıçapı + iki gölge + `#6b7280` gri alt sınırı | ~20 dk |
| **T8** | m149 | Cafe kartındaki çelişen sinyali gider | ~10 dk |

**T6 detay:** bugün 6 ayrı rozet stili var. Üç tip, üç sabit kural: **durum** (dolu renk),
**kimlik** (tek ikon + nötr), **kategori** (outline). Paylaşılan bir rozet bileşeni
üzerinden geçir. H3 "Pinned"i "Sabit" yaptı; **stili** burada değişecek.

**T8 detay:** `CaddeCafePage.tsx:188` yeşil `bg-emerald-500` "Canlı" rozeti ile karttaki
turuncu/amber çerçeve çelişiyor. Tek sinyal, tek renk. **T6'dan sonra yap.**

⚠️ **T grubunun tamamı `src/lib/cadde-style-contract.test.ts` ile çevrili:** 7 Cadde
yüzey dosyasında `bg-[#...]`, `text-[#...]`, `border-[#...]`,
`bg-[linear-gradient...]` **yasak**. Renk token'dan gelmek zorunda. **Testi gevşetme**,
`src/index.css`'e token ekle.

### C — Cafe *(2 batch)*

| Batch | Madde | İş |
|---|---|---|
| **C0** | m159 | **KARAR** — Cafe formatı async-first mi, programlı canlı slotlar mı? |
| **C3** | m162 | Süre dolunca ne olduğunu oda kartında yaz |

**C0 kod işi DEĞİL, ürün kararı.** Bugün 2 saatlik canlı pencere var. Kritiğin tespiti:
*"boş bir akış kötüdür, boş bir CANLI oda çok daha kötüdür"* — kullanıcı girer, kimse
yoktur, süre akmaktadır, bir daha denemez. Oda süresi `cadde_settings` tablosunda, yani
karar bir **SQL güncellemesi**, kod değişikliği değil.

**C3, C0'a bağlı** — cevap metni değiştirir. Bilgi bugün yalnız kod yorumunda
(`CaddeCafePage.tsx:4`), kullanıcı göremiyor ve bilmeden yazmıyor.

### K — Karar *(1 batch)*

**K1 (m156)** — Tepki seti 5'ten 3'e insin mi?
⚠️ `CaddePage.test.tsx` "beş tepki tek tetiğin arkasında" sözleşmesini kilitliyor ve o
sözleşme 2 Eylül'de **bilerek** yazıldı. Kritiğin şikâyet ettiği görsel yığılma
**zaten çözülmüş**; kalan tek soru "5 tip fazla mı?". Cevap gelmeden koda dokunma.

### İ — İçerik / soğuk başlangıç *(5 batch — KOD İŞİ DEĞİL)*

> Kaynak dokümanın en kritik başlığı: *"Header'ı düzeltmek 1 saatlik iş; boş akış ürünü
> öldürür."* Bugün **kodu** yapıldı, **içeriği** duruyor.

**Bugün ölçülen canlı durum — bu grubun neden acil olduğu:**
**21** yayınlanmış public gönderi · 58 şehrin **10'unda** paylaşım var · en dolu şehir
**4** (Doha, Antalya) · Berlin **1** · en dolu ülke Türkiye **8**.

| Batch | Madde | İş | Kim |
|---|---|---|---|
| **İ1** | m163 | Test gönderilerini ve test cafe'lerini canlı akıştan temizle | UBT (DB) |
| **İ2** | m164 | Test içeriği için admin'e görünür seviye ya da staging kur | UBT (kod+DB) |
| **İ3** | m165 | Berlin, Londra, Sydney, Dubai için 8-10 gerçek soru/not hazırla | Burak |
| **İ4** | m166 | Resmî hesaptan yayınla, tarihleri geriye yay | Burak · İ3 sonrası |
| **İ5** | m167 | Blog ↔ Cadde döngüsü | Burak |

⚠️ İ1'de canlı DB'ye **Türkçe SQL** yazacaksan **UTF-8 dosya + `psql -f`** kullan;
PowerShell komut satırından geçen Türkçe karakter bozulur (`0xc7 0x69` hatası).
⚠️ `geo_cities` **76.990** satır. Satır başına fonksiyon çağıran keşif sorgusu
**canlıyı düşürür** — 5 Ağustos'ta tam olarak bu oldu, 50 dakika kesinti. Önce
`select distinct` ile küçült, sonra join'le.

---

## 5. Acil işler listesi (TOP 10 HOT FIX) — kod değil, **cevap** bekliyor

Panoda 4 madde var, dördü de 5 Eylül'den, hiçbiri başlanmamış. **Ölçtüm; dördü de
yazılandan farklı çıktı:**

| Yazılan | Gerçek durum |
|---|---|
| Radar'ı "açalım" | Kapalı **değil**. Cron her sabah 05:00 başarıyla koşuyor (88 başarılı çalışma) ama **20 Temmuz'dan beri tek tarama üretmiyor** — ~7 haftadır sessizce bozuk. **"Aç" işi değil, "tamir" işi.** |
| Grupları "açalım" | Sayfalar 4 Ağustos'ta **silinmiş** (hiçbir yerden bağlantı yoktu). Veri duruyor (10 grup). Katılım talebi tablosu **boş**. |
| Etkinlik "kolayca eklenir" | `events`/`event_details` tabloları var ama **tamamen boş**. Cadde'deki "Etkinlikler" süzgeci 4 Ağustos'ta **kullanıcının kendi kararıyla** kaldırılmış. |
| Google Auth | Planı **2 Ağustos'ta yazılmış** (`docs/operations/2026-08-02-supabase-custom-domain-google-oauth.md`), hiçbir adımı başlamamış. Çoğu ayar işi. |

Sorular hazır: **`docs/plans/2026-09-09-hotfix-sorulari.md`** (20 soru, günlük dille,
şıklı — cevaplayacak kişi geliştirici değil).

Cevaplar panodaki **"Soru / cevap"** bölümüne yazılacak (bugün eklendi, `1e0d65f`).
**Cevaplar gelmeden bu dört madde için kod yazma** — dördünde de yanlış işe girişilir.

---

## 6. Bekleyen doğrulama — kod değil, **göz**

Bugünkü işlerin çoğu görsel ve **hiçbiri tarayıcıda görülmedi** (jsdom yerleşim/geçiş
hesaplamıyor). Yayından sonra `/cadde`'ye girip bak:

1. **Üst alan** — kimlik şeridi kalktı; boşluk doğru mu, ilk gönderi fold'un üstünde mi?
2. **Scroll'da header** — daralma akıcı mı, titreme var mı, yukarı dönünce büyüyor mu?
3. **Zilin yeni yeri** — filtre satırının sağ ucunda; dar ekranda alta düşüyor mu?
4. **Kapsam şeridi 40px→44px çıktı** (zil daha uzun) — dar ekranda sarma bozuldu mu?
5. **Boş şehir akışı** — `?city=<boş bir şehir>` ile aç; "Almanya akışındaki N paylaşım"
   düğmesi çıkıyor mu, tıklayınca çalışıyor mu?
6. **Cafe odası** — payda gitti mi, Arşivle üç nokta menüsünde mi?
7. **Bronz butonlar** — kontrast okunur mu, sayfa başına tek primary kuralı tutuyor mu?

⚠️ İddia edilen **~90px** kazanç hesapla çıkarıldı, **ekranda ölçülmedi**. DevTools'ta
375 / 1366 / 1920 genişlikte, beta bandı açık ve kapalı hâlde ilk gönderi kartının üst
kenarını ölç.

---

## 7. Bu oturumda öğrenilen tuzaklar

1. **Sözleşme testinde `toContain` YETMEZ.** Yazdığım sınıf-adı testi, adı `__logoX`
   yapınca **düşmedi** — alt dize eşliyor. Word-boundary regex şart. *Kasten bozarak
   denemeseydim, koruduğunu sanıp bırakacaktım.*
2. **Kırılgan testte önce mock'a bak, iddiaya değil.** Yorum sayfalama testini **iki kez
   yanlış** düzelttim (`toHaveBeenLastCalledWith` → `toHaveBeenNthCalledWith`); ikisi de
   çağrı sırasına dayanıyordu. Asıl sorun `mockResolvedValueOnce` zinciriydi — mock
   imlece bağlanınca kökten çözüldü.
3. **`git checkout -- <dosya>` commit'lenmemiş işi siler.** Bir testi denerken kendi CSS
   bloğumu böyle kaybettim. Denemeden önce commit et.
4. **Yeni DB tablosu eklerken `types.ts`'i yeniden üret**, `as any` ile geçiştirme.
   Yol: Management API + `.env.local`'daki `SUPABASE_ACCESS_TOKEN`. (tsc 6→12 çıkmıştı,
   üretince 6'ya döndü.)
5. **supabase-js hataları DÜZ NESNEDİR**, `Error` değil. `sanitizeError` yalnız
   `instanceof Error` bakıyor — supabase hatalarında mesajı yutar. Kardeş modüllerdeki
   `message`/`details`/`hint` okuyan eşleyiciyi kullan.
6. **Deploy'u "oldu" sayma, canlı bundle'da kendi metnini ara.** Bugün son commit
   push'luydu ve deploy zaman damgası taze görünüyordu ama chunk **404** döndü.

---

## 8. İlgili belgeler

- `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md` — batch dökümü (H/B/Y ✅, T kısmen)
- `docs/plans/2026-09-09-hotfix-sorulari.md` — acil maddeler için sorular
- `docs/modules/cadde-design-tokens.md` — T grubunun dayanağı
- `docs/cadde-300/2026-08-27-ux-degerlendirme.md` · `2026-08-27-ui-kritigi.md` — kaynak denetimler
- `docs/plans/2026-09-07-kalan-isler-batch-listesi.md` — genel teknik borç (ayrı plan)
  ⚠️ **Harf çakışması:** orada `T` = tip borcu, burada `T` = tasarım sistemi. Batch
  numarası söylerken hangi plandan olduğunu belirt.
