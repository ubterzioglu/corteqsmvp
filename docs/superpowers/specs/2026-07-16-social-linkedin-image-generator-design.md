# LinkedIn Görsel Üretim Sistemi — Tasarım

**Tarih:** 2026-07-16
**Kapsam:** `BURAK_SHARE_TOOLS` (12 araç × 3 varyant = 36 içerik) için otomatik 1200×1200 LinkedIn görsel üretimi.

## Amaç

`/admin/social-share-vault` → "BURAK BURAYA BAK" sekmesindeki 36 içerik varyantı (12 test aracı × 3 varyant, her biri bir Canva promptu + bir Türkçe LinkedIn postu) için manuel Canva çalışması yerine, tek komutla yeniden üretilebilir, marka tutarlı, otomatik görsel üretim sistemi kurmak.

## Kapsam Dışı

- `SOCIAL_SHARE_TOOLS` (Araç Tanıtımları sekmesi, 10 araç), `DIASPORA_POSTS` (Diaspora Postları, 50 post), `SOCIAL_TEST_TOOLS` (Test Araçları, 10 araç) — bu sistemin ilk sürümü yalnız `BURAK_SHARE_TOOLS` kaynağını işler. Aynı motor ileride diğer içerik kaynaklarına genişletilebilir ama bu spec kapsamında değil.
- Canva'ya otomatik yükleme veya Canva hesabına browser automation — yapılmayacak.
- Gerçek AI görsel üretim API entegrasyonu — repo'da böyle bir servis/anahtar yok (bkz. Teknik Karar).

## Teknik Karar: Hibrit Deterministik SVG + Sharp Compositing

Repo incelemesi:
- **Görsel üretim API/MCP yok**: `.env.example`, `CLAUDE.md`, kod tabanında hiçbir image-generation servisi/anahtarı tanımlı değil.
- **Sharp zaten `devDependencies`'te** (`^0.34.5`, `vite-plugin-image-optimizer` için) — PNG compositing için de kullanılabilir, yeni bağımlılık gerekmez.
- Bu nedenle: metinsiz arka plan illüstrasyonları **deterministik SVG** olarak kod içinde üretilir (Canva promptundaki temaya göre, sabit seed — `Math.random`/`Date.now` yok, `variantIndex`'ten türetilen formüller), Sharp ile PNG'ye rasterize edilir; başlık/açıklama/CTA/logo/domain metinleri ayrı bir SVG katmanı olarak **programatik** olarak üstüne bindirilir (SVG `<text>` + Sharp `composite`).
- Font: sistemde kurulu **Segoe UI** (Windows, Türkçe tam destek) → yoksa **Arial** → yoksa **DejaVu Sans/Noto Sans** (Linux) fallback zinciri. Harici font indirme yok.
- Logo: `src/assets/corteqs-logo.png` (1024×1024, navy zeminli, glob+"CorteQS" wordmark) kullanılır. İkinci logo dosyası `corteqs-logo-globe.png` krem/açık zeminli olduğu için (navy arka planla uyuşmuyor) kullanılmaz. İlk logodan dolu içerik şeridini (glob+wordmark) içeren dar yatay bant crop'lanıp köşeye yerleştirilir — logonun kendi navy zemini üretilen arka planın navy zeminiyle kaynaşır, görünür çerçeve olmaz.

**Gerekçe (repo durumuna göre en verimli seçim):**
1. Görsel üretim API/anahtarı repo'da tanımlı değil — kurulum/onay beklemeden ilerlenebilir.
2. Sharp zaten bağımlılık — yeni paket riski yok.
3. Deterministik SVG, Satori/Resvg gibi ek paket gerektirmez (düz template-literal SVG + Sharp rasterization yeterli).
4. Kod olarak repo'da yaşar — `git diff` ile izlenebilir, versiyon kontrollü.
5. Sıfır maliyet, sıfır rate-limit, sıfır network bağımlılığı; CI/offline çalışabilir.
6. Türkçe karakter garantisi — sistem fontu + doğrudan kontrol edilen SVG text render.
7. 36 görsel arasında piksel-piksel marka tutarlılığı garanti edilir (sabit grid, yalnız motif/vurgu renk değişir).
8. Font harici indirilmez — sistemde kurulu, açık lisanslı, Türkçe destekli fontlar kullanılır.
9. Logo gerçek dosyadan alınır, sahte logo üretilmez.
10. Node.js ESM tek komut — repo'nun mevcut `scripts/*.mjs` konvansiyonuna uyar, platform bağımsız.

## Dosya Yapısı

```
scripts/social-generate/
├── index.mjs              # CLI giriş noktası (--tool, --variant, --all, --force-backgrounds)
├── config.mjs              # marka renkleri, boyutlar, font yolu, grid sabitleri
├── background-motifs.mjs   # 12 araç → motif fonksiyonu eşlemesi (deterministik SVG üretir)
├── compose.mjs              # arka plan + logo + metin katmanlarını Sharp ile birleştirir
├── text-utils.mjs           # description → ≤90 karakter kısa özet (Türkçe-güvenli kırpma)
└── manifest.mjs             # manifest.json + generation-report.md yazar

public/social/generated/
├── backgrounds/burak-tool-N-variant-M.png   (cache; --force-backgrounds ile yeniden üretilir)
├── posts/burak-tool-N/variant-M.png          (nihai 1200×1200 çıktı)
├── manifest.json
└── generation-report.md
```

`package.json`'a eklenecek komutlar:
```
"social:generate": "node scripts/social-generate/index.mjs"
```
Kullanım: `npm run social:generate -- --tool burak-tool-1 --variant 1`, `--all`, `--all --force-backgrounds`.

**Cache mantığı:** Varsayılan davranış mevcut `backgrounds/*.png` dosyasını yeniden üretmez (var olan dosya atlanır). `--force-backgrounds` verilirse `backgrounds/` içindeki ilgili dosyalar silinip yeniden üretilir. `posts/*.png` (nihai çıktı, metin+logo+CTA bindirilmiş) her çalıştırmada güncellenir — böylece yalnız metin değişse bile arka plan yeniden üretilmez.

## Marka Sistemi

**Renkler** (repo'daki `src/index.css` CSS custom properties'inden HEX'e çevrilmiş — talimattaki örnek renkler değil, gerçek marka kaynağı esas alınmıştır):

| Rol | Kaynak | HEX |
|---|---|---|
| Ana (golden-bronze) | talimat + marka | `#aa8c42` |
| Arka plan (deep navy) | logo zemin rengi | `#1b1e29` |
| teal | `--glow-teal: 170 65% 42%` | `#28a693` |
| orange | `--glow-orange: 18 85% 55%` | `#e8703c` |
| blue | `--brand-blue: 205 80% 50%` | `#1a8fe3` |
| indigo | `--brand-indigo: 255 60% 58%` | `#7861db` |
| pink | `--brand-pink: 330 75% 58%` | `#e33d94` |
| yellow | `--brand-yellow: 45 90% 55%` | `#eeb821` |

**Sabit grid (1200×1200 px), 36 görselde değişmez:**

```
y=0-140     üst şerit: logo (sol, crop'lanmış glob+wordmark, ~100px yükseklik) + kategori/seri etiketi (sağ, küçük pill badge)
y=140-420   başlık bölgesi: araç adı (büyük, 2 satıra kadar sarabilir) + kısa açıklama (≤90 karakter, 1-2 satır)
y=420-980   merkez illüstrasyon (deterministik SVG motif, araca özel tema)
y=980-1080  CTA buton: "Ücretsiz Testi Çöz" (dolgu golden-bronze pill buton)
y=1080-1200 alt şerit: "corteqs.net" (ortalanmış, düşük vurgu)
```

Varyant numarası veya teknik bilgi görselde **gösterilmez** — yalnızca manifest'te saklanır.

## İllüstrasyon Motifleri (12 araç → 1 motif ailesi, 3 varyant = deterministik kompozisyon farkı)

| Araç | Motif |
|---|---|
| 1. Hangi Ülke Sana Uygun? | Glob + iniş pini |
| 2. Mesleğin Dünyada Ne Kazandırıyor? | Bar-chart sütunları / madeni para |
| 3. Yurt Dışına Taşınmaya Hazır mısın? | Gösterge/ibre (gauge) |
| 4. Hangi Şehir Sana Daha Uygun? | Şehir işaretli harita |
| 5. Diaspora Ağı Eşleştirme | Bağlı profil düğümleri |
| 6. Yurt Dışında Hangi Kariyer Sana Uygun? | Dallanan yol/kariyer patikaları |
| 7. Yurt Dışı Yaşam Tarzın Ne? | Kişilik rozetleri / parçacıklar |
| 8. İlk 90 Gün Planlayıcı | Zaman çizelgesi şeridi + kilometre taşları |
| 9. Önce Hangi Soruna Odaklanmalısın? | Radar/spot ışık odak noktası |
| 10. Yurt Dışında İş Bulma Şansın? | Olasılık göstergesi + CV silüeti |
| 11. Almanya'da Sana Hangi Banka Uygun? | Kart + telefon + sıralı banka rozetleri |
| 12. Almanya'da Hangi Sigortalar Sana Şart? | Kalkan + küçük ikonlar (sağlık/araba/ev) |

Her motif: basit SVG path/circle şekilleri (Lucide ikonlarından esinlenilmiş) + marka renkleriyle gradient tanımları + glow filtresi. 3 varyant, aynı motif fonksiyonuna `variantIndex` (0/1/2) parametresi geçirilerek pozisyon/rotasyon/vurgu-renk-çifti deterministik olarak değişir.

## Metin Üretme Kuralları

- Başlık: `name` alanından birebir.
- Alt açıklama: `description` alanından türetilir, **≤90 karakter**, anlam korunur, yeni vaat/istatistik eklenmez, Türkçe karakterler eksiksiz korunur (`CLAUDE.md` Türkçe metin kurallarına uyulur — bare `toUpperCase/toLowerCase` kullanılmaz, gerekirse `trUpper`/`trLower`).
- LinkedIn postunun tamamı görsele yazılmaz; yalnızca manifest + metadata'da saklanır.

## Kalite Kontrolü (Otomatik)

Her üretimden sonra script içinde çalışır, sonuç `generation-report.md`'ye yazılır:

- Dosya var mı + boyutu > 0 bayt mı
- Sharp `metadata()` ile PNG format + tam 1200×1200 doğrulaması
- Metin taşma kontrolü: SVG `<text>` kutusu sabit genişliği aşarsa otomatik font-size küçültme (binary search, min. okunabilir boyuta kadar); taşma hâlâ varsa raporlanır
- Türkçe karakter bozulma kontrolü: üretilen metin ile kaynak (`BURAK_SHARE_TOOLS`) UTF-8 byte eşleşmesi doğrulanır
- Aynı başlık iki kez gösterilmesi: sabit grid tasarımı gereği yapısal olarak imkânsız (başlık tek yerde render edilir)
- Logo oranı: crop + resize sabit oran korunur (`fit: 'inside'`)
- Kontrast: CTA sabit golden-bronze dolgu + koyu/beyaz metin kombinasyonu, WCAG AA hedefiyle önceden belirlenmiş

## CLI Davranışı

- Argümanlar: `--tool <id>`, `--variant <1-3>`, `--all`, `--force-backgrounds`
- Varsayılan: mevcut `backgrounds/*.png` atlanır, `posts/*.png` her çalıştırmada üzerine yazılır
- Her varyant kendi `try/catch` bloğunda işlenir — bir varyant başarısız olursa süreç durmaz, `generation-report.md`'de "başarısız" olarak işaretlenir, sonraki varyanta geçilir; süreç sonunda konsola başarısız sayısı özeti yazılır
- Görsel üretim API'si kullanılmadığı için retry/timeout mekanizması gerekmez (bu kural yalnız API tabanlı üretim için); dosya I/O hatalarına karşı yine de try/catch var

## Manifest Şeması (`manifest.json`)

```json
{
  "toolId": "burak-tool-1",
  "toolName": "Hangi Ülke Sana Uygun?",
  "variant": 1,
  "canvaPrompt": "...",
  "linkedinPost": "...",
  "shortDescription": "...",
  "backgroundPath": "public/social/generated/backgrounds/burak-tool-1-variant-1.png",
  "outputPath": "public/social/generated/posts/burak-tool-1/variant-1.png",
  "generatedAt": "2026-07-16T12:00:00.000Z",
  "backgroundMethod": "deterministic-svg",
  "status": "success"
}
```

> Not: Bu bir Node CLI script'idir (Workflow script'i değil) — `Date.now()`/`new Date()` kullanımı serbesttir.

## Uygulama Sırası

1. İlk örnek: yalnızca `burak-tool-1` / `variant-1` üretilir.
2. 1200×1200 boyut doğrulaması + PNG format doğrulaması + Türkçe karakter kontrolü yapılır.
3. Hizalama/taşma/okunabilirlik gözden geçirilir, gerekirse düzeltilir.
4. İlk örnek başarılıysa aynı sistem 36 görsel için (`--all`) çalıştırılır.
5. Manifest ve üretim raporu oluşturulur.
6. Doğrulama çalıştırılır: `npm run test` (mevcut test paketi kırılmamalı — bu script'in kendisi için yeni test eklenmez, saf üretim aracı). `eslint.config.js` yalnız `**/*.{ts,tsx}` kapsadığından (repo'daki diğer `scripts/*.mjs` dosyalarıyla aynı durum) yeni `.mjs` dosyaları `npm run lint`/`tsc --noEmit` kapsamı dışındadır — bu beklenen ve mevcut repo konvansiyonuyla tutarlıdır.

## Teslimat Kriterleri

- Seçilen teknik yaklaşım ve gerekçesi raporlanır.
- Eklenen/değiştirilen dosyalar listelenir.
- Kullanılan komutlar gösterilir.
- Üretilen görsel sayısı ve başarısız üretimler raporlanır.
- Görsel üretim API'si kullanılmadığı (deterministic-svg olduğu) açıkça belirtilir.
- İlk örnek görselin tam dosya yolu verilir.
- Tüm çıktıların bulunduğu dizin belirtilir.
- Lint/test/doğrulama sonuçları raporlanır.
