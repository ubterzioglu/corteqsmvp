# Devir notu — 9 Eylül 2026

> **Nasıl kullanılır:** yeni bir oturumda yalnız batch numarasını söyle (ör. `T3`).
> Ajan bu dosyayı ve `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md`'yi açar,
> o batch'i okur ve yapar. Batch'ler arasında bilgi taşınmaz.

## Bugün ne yapıldı

27 Ağustos'ta yapılan iki dış denetimin (`docs/cadde-300/2026-08-27-ux-degerlendirme.md`,
`2026-08-27-ui-kritigi.md`) **31 açık maddesinden 14'ü** kapatıldı. Hepsi push'lu.

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
| `2afbe9f` | Duyuru kaydı (mail gönderildi, `sent`, 2 alıcı) |

**Yol üstünde kapatılan eski borçlar** (önceki oturumlardan commit'lenmemiş kalmıştı):
`74b16fb` S1 · `5493de7` S2 · `088d12d` S3 · `01fa683` T1+T2 tip borcu · `60d03ed` O2
güvenlik · `f376a4f` araç kataloğu · `382bbf2` sahipsiz dosyalar.

**Taban:** 260 dosya / **1.822 test** yeşil (gün başı 256/1.768) · lint 0 · `tsc` **6** ·
build yeşil · migration 386/386 · çalışma ağacı temiz · `origin/main` senkron.

---

## ⚠️ ÖNCE BUNU OKU — bu oturumun en pahalı dersi

**Plandaki reçeteler DÖRT KEZ yanlış çıktı.** Dördü de dosya açılmadan doğru varsayılsaydı
zarar verecekti:

1. **H1** — plan iki adres veriyordu, dördü vardı. Verilen `:974` yalnız tepki paneli
   *açıkken* çiziliyor; kapalı kartta görünen sayaç başka bir yerde.
2. **H2** — plan "testi de kaldır" diyordu. O satır ayrı bir test değil, B1 soğuk
   başlangıç testinin içindeki üç iddiadan biriydi; silmek B1 kapsamını götürürdü.
   Ayrıca "ölü kod" denen `scrollToComposer` ve `Megaphone` **canlı kullanımdaydı**,
   silinseydi derleme kırılırdı.
3. **B1** — plan `:1283` diyordu, metin `:1305`'teydi ve boş durum kartında değil sağ
   raildeki panelin içindeydi (dört test ona bağlı). Ayrıca daraltmanın **iki** mekanizması
   var, plan birini anlatıyordu.
4. **Y1** — plan "başlığı header'a taşı" diyordu; ölçünce taşınacak başlık olmadığı
   (h1 yok, `CardTitle` var) ve şerit yüksekliğini **zilin** belirlediği çıktı. Sözlük
   anlamıyla uygulansa ~0px kazandırıp 61 rotayı riske atacaktı.

**Kural:** batch metnindeki satır numarası ve "şunu da sil" talimatı, **dosya açılmadan
doğru varsayılmaz.** Önce oku, sonra uygula.

---

## Kalan işler — küçük batch'ler

Kaynak: `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md`. Pano: `/admin/workshop/cadde`
(WS3 sekmesi, **14/31**).

### T — Tasarım sistemi *(6 batch kaldı)*

Token'lar tanımlı ve birincil eylem/aktif kapsam yüzeylerinde kullanılmaya başladı.
Kural: `docs/modules/cadde-design-tokens.md`.

| Batch | İş | Süre | Not |
|---|---|---|---|
| **T3** | Buton hiyerarşisini üçe indir | ~25 dk | |
| **T4** | Üst nav'ı tek nötr renge indir | ~10 dk | `SiteHeader.tsx`, 4 farklı renk |
| **T5** | Gökkuşağı şeridi pillar renk koduna çevir | ~25 dk | ⚠️ `.cadde-panel` yan kolonda da kullanılıyor |
| **T6** | Rozetleri üç tipe indir | ~25 dk | H3 "Sabit"i yaptı, stili burada |
| **T7** | Yüzey: tek yarıçap, iki gölge, gri alt sınırı | ~20 dk | |
| **T8** | Cafe kartındaki çelişen sinyali gider | ~10 dk | T6'dan sonra |

### C — Cafe *(2 batch kaldı)*

| Batch | İş | Not |
|---|---|---|
| **C0** | **KARAR:** Cafe formatı async-first mi, programlı canlı slotlar mı? | Kod yok, cevap gerekiyor |
| **C3** | Süre dolunca ne olduğunu oda kartında yaz | C0'a bağlı — cevap metni değiştirir |

C0 gerçek bir ürün kararı: bugün 2 saatlik canlı pencere var. Kritiğin tespiti *"boş bir
akış kötüdür, boş bir CANLI oda çok daha kötüdür"*. Oda süresi `cadde_settings`'te, yani
karar bir SQL güncellemesi — kod değişikliği değil.

### K — Karar *(1 batch)*

**K1** — Tepki seti 5'ten 3'e insin mi? ⚠️ `CaddePage.test.tsx` "beş tepki tek tetiğin
arkasında" sözleşmesini kilitliyor ve o sözleşme 2 Eylül'de bilerek yazıldı. Kritiğin
şikâyet ettiği görsel yığılma **zaten çözülmüş**; kalan tek soru "5 tip fazla mı?".

### İ — İçerik / soğuk başlangıç *(5 batch — KOD İŞİ DEĞİL)*

> Kaynak dokümanın en kritik başlığı: *"Header'ı düzeltmek 1 saatlik iş; boş akış ürünü
> öldürür."* Bugün kodu yapıldı, **içeriği duruyor.**

**Bugün ölçülen canlı durum — bu grubun neden acil olduğu:**
21 yayınlanmış public gönderi · 58 şehrin **10'unda** paylaşım var · en dolu şehir **4**
(Doha, Antalya) · Berlin **1** · en dolu ülke Türkiye **8**.

| Batch | İş | Kim |
|---|---|---|
| **İ1** | Test gönderilerini ve test cafe'lerini canlı akıştan temizle | UBT (DB) |
| **İ2** | Test içeriği için admin'e görünür seviye ya da staging kur | UBT (kod+DB) |
| **İ3** | Berlin, Londra, Sydney, Dubai için 8-10 gerçek soru/not hazırla | Burak + içerik |
| **İ4** | Resmî hesaptan yayınla, tarihleri geriye yay | Burak · İ3'ten sonra |
| **İ5** | Blog ↔ Cadde döngüsü | Burak |

⚠️ İ1'de canlı DB'ye Türkçe SQL yazacaksan **UTF-8 dosya + `psql -f`** kullan; PowerShell
komut satırından geçen Türkçe karakter bozulur.

---

## Bekleyen doğrulama — kod değil, göz

**Bugünkü işlerin çoğu görsel ve hiçbiri tarayıcıda görülmedi.** jsdom transition ya da
yerleşim hesaplamıyor. Sıradaki oturumdan önce `/cadde`'ye girip şunlara bak:

1. **Üst alan** — kimlik şeridi kalktı; üstteki boşluk doğru mu, ilk gönderi fold'un
   üstünde mi?
2. **Scroll'da header** — daralma akıcı mı, titreme var mı, yukarı dönünce düzgün büyüyor mu?
3. **Zilin yeni yeri** — filtre satırının sağ ucunda, saatin yanında; dar ekranda alta
   düşüyor mu, tıklanabilir mi?
4. **Kapsam şeridi 40px→44px çıktı** (zil daha uzun) — dar ekranda sarma bozuldu mu?
5. **Boş şehir akışı** — `?city=<boş bir şehir>` ile aç, "Almanya akışındaki N paylaşım"
   düğmesi çıkıyor mu, tıklayınca çalışıyor mu?
6. **Cafe odası** — payda gitti mi, Arşivle üç nokta menüsünde mi?

Ayrıca ölçüm önerisi: DevTools'ta 375 / 1366 / 1920 genişliklerde, beta bandı açık ve
kapalı hâlde, ilk gönderi kartının üst kenarını ölç. Bugün iddia edilen ~90px kazanç
**hesapla çıkarıldı, ekranda doğrulanmadı.**

---

## Bu oturumda öğrenilen tuzaklar

1. **`toContain` sözleşme testinde YETMEZ.** Yazdığım sınıf-adı testi, adı `__logoX`
   yapınca **düşmedi** — alt dize eşliyor. Sınır (word-boundary) regex şart. Kasten
   bozarak doğrulamasaydım koruduğunu sanıp bırakacaktım.
2. **Kırılgan testte önce mock'a bak, iddiaya değil.** Yorum sayfalama testini iki kez
   yanlış düzelttim (`toHaveBeenLastCalledWith` → `toHaveBeenNthCalledWith`); ikisi de
   sıra varsayımına dayanıyordu. Asıl sorun `mockResolvedValueOnce` zincirinin çağrı
   sırasına güvenmesiydi — mock imlece bağlanınca kökten çözüldü.
3. **`ingest:tools`'u koşmayı üç kez atladım** ve hiçbir test yakalamadı. Plan "yoksa
   `tools-catalog.test.mjs` kırılır" diyor — **kırılmıyor**. `src/lib` altına yeni export
   ya da `scripts/` altına yeni dosya ekleyince **elle** koş.
4. **`git checkout -- <dosya>` commit'lenmemiş işi siler.** Bir sözleşme testini denerken
   kendi CSS bloğumu böyle kaybettim (geri koydum). Denemeden önce commit et ya da kopyala.
5. **Alt ajanlara şema zorunlu kıl.** Serbest metin dönen Explore ajanları bu oturumda üç
   kez boş döndü; şemalı ajanların 10/10'u dolu döndü.

## İlgili belgeler

- `docs/plans/2026-09-09-cadde-ux-ui-batch-plani.md` — batch dökümü (H/B/Y grupları ✅ işaretli)
- `docs/modules/cadde-design-tokens.md` — T grubunun dayanağı
- `docs/cadde-300/2026-08-27-ux-degerlendirme.md` · `2026-08-27-ui-kritigi.md` — kaynak denetimler
- `docs/plans/2026-09-07-kalan-isler-batch-listesi.md` — genel teknik borç (ayrı plan;
  ⚠️ harf çakışması var: orada `T` = tip borcu, burada `T` = tasarım sistemi)
