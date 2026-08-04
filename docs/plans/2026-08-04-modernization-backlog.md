# Modernizasyon Backlog — 2026-08-04

Bu dosya, 2026-08-04 modernizasyon çalışmasında **bilinçli olarak ertelenen** işleri
kaydeder. Uygulanan işler için bkz. `docs/plans/2026-08-04-modernization-plan.md`.

Buradaki her madde ya (a) ürün kararı gerektirdiği, ya (b) risk/kapsam olarak batch
dışında kaldığı, ya da (c) altyapı erişimi olmadığı için ertelendi. Hiçbiri "unutuldu"
değil.

## Ölçüm tabanı (2026-08-04, değişiklikler uygulandıktan sonra)

Aşağıdaki maddelerdeki sayılar bu tabana göredir. Tekrar tahmin etme, tekrar ölç.

| Metrik | Değer |
|---|---|
| src altında `.ts`/`.tsx` | 989 (pages 209 · components 429 · lib 278) |
| Test dosyası | 202 (+ 18 Playwright `.spec.ts`) |
| Migration | 352, hepsi `supabase/migrations/applied/` |
| Edge Function | 7 |
| `tsc -p tsconfig.app.json --noEmit` | 103 hata → **98 hata** |
| `npm run lint` | 1280 problem (1060 error, 220 warning) |
| `npm run build` | exit 0 |
| `npm run verify:text` | geçiyor (1307 dosya UTF-8) |
| `App.tsx` | 283 satır, 51 `lazy()` |
| `"@/contexts/AuthContext"` import eden dosya | 21 |
| `as any` | 89 |
| src altında `console.log` | 0 |
| sitemap URL | 107 → **108** |

---

## 1. Sıradaki iş — deploy sonrası hemen

Bu üç madde bloke edicidir. Batch 1 ve 2 (nginx güvenlik başlıkları, CSP, 301
yönlendirmeleri) **çalışan bir nginx üzerinde doğrulanmadı**; doğrulanmadan canlıya
güvenilmemeli.

### N-1 · Konteyner doğrulaması yapılmadı (docker build + curl)

| | |
|---|---|
| **Risk** | Yüksek |
| **Karar sahibi** | Mühendislik |

**Neden ertelendi:** Rancher Desktop kapalıydı, docker daemon'a bağlanılamadı. Yerine
`src/lib/redirects.test.ts` `nginx.conf.template` dosyasının **metnini** denetliyor
(location blokları, 301 hedefleri, CSP tekrar sayısı, `unsafe-inline` yokluğu). Bu
gerçek bir doğrulamadır ama çalışan nginx'in **davranışını** kanıtlamaz.

Özellikle riskli iki nokta:
1. nginx imajının `20-envsubst-on-templates.sh` scripti template'i `envsubst`'tan
   geçirir. CSP değişkeni `$corteqs_csp` çakışmayı önlemek için daraltıldı, ama bu
   yalnızca çalışan konteynerde kanıtlanır.
2. nginx'te `add_header` **kalıtılmaz**. Başlıklar 5 location'da tekrarlandı; bir
   location atlanmışsa o yol sessizce korumasız kalır.

**Yapılacaklar:**
```bash
# Rancher Desktop / Docker Desktop açıkken
docker build -t corteqs-verify .
docker run --rm -p 8099:80 corteqs-verify

# 1) Güvenlik başlıkları TÜM kritik yollarda var mı?
for p in / /index.html /env-config.js /robots.txt /assets/ /admin /login; do
  echo "== $p"; curl -sI "http://localhost:8099$p" \
    | grep -Ei 'content-security-policy|x-frame-options|x-content-type|referrer-policy|permissions-policy'
done
# Beklenen: HER yolda aynı 8 başlık. Boş çıkan yol = regresyon.

# 2) 301'ler ve query string korunumu
curl -sI "http://localhost:8099/hakkimizda?utm_source=x" | grep -Ei 'HTTP/|location'
curl -sI "http://localhost:8099/whatsapp-groups/berlin"  | grep -Ei 'HTTP/|location'
# Beklenen: 301 + Location'da ?utm_source=x korunmuş.

# 3) X-Robots-Tag geri gelmemiş olmalı
curl -sI http://localhost:8099/ | grep -i x-robots-tag   # çıktı BOŞ olmalı

# 4) 15 redirect location'ının hepsi
node -e "const{LEGACY_REDIRECTS}=require('./src/lib/redirects.ts')" # veya testi koş
npm run test -- src/lib/redirects.test.ts
```
**Kabul:** 4 kontrolün hepsi geçer. Geçmezse deploy YAPMA.

---

### N-2 · Canlı CSP ihlali kontrolü (deploy sonrası, tarayıcı konsolu)

| | |
|---|---|
| **Risk** | Yüksek |
| **Karar sahibi** | Mühendislik |

**Neden gerekli:** `script-src`'de `'unsafe-inline'` **yok**. `index.html`'deki iki
inline script (gtag config + Clarity yükleyici) `public/analytics.js`'e taşındı. CSP
allowlist'i yalnızca ölçülen üçüncü taraflara açık: googletagmanager, analytics.ahrefs.com,
clarity.ms, fonts.googleapis.com, fonts.gstatic.com, google-analytics, c.bing.com.
Gözden kaçan **tek bir** inline script veya allowlist dışı bir host, o özelliği sessizce
öldürür.

**Yapılacaklar:** Deploy sonrası DevTools Console açık şekilde şu yolları gez:

| Yol | Neye bakılacak |
|---|---|
| `/` (LandingTrialPage) | Analytics yüklendi mi, `Refused to ...` yok mu |
| `/login` | CSP + form gönderimi |
| `/admin` (giriş yapmış) | En yüksek riskli alan — batch öncesi CSP'siz servis ediliyordu |
| `/directory` | Harita/görsel varlıkları `img-src`'ye takılıyor mu |
| `/blog/<bir yazı>` | Gömülü içerik `frame-src` ihlali veriyor mu |
| `/cadde` | Supabase realtime `connect-src` |

**Kabul:** Hiçbir sayfada `Refused to load/execute/connect` satırı yok. Varsa: ihlal eden
host'u `nginx.conf.template` içindeki `map $host $corteqs_csp` bloğuna ekle,
`src/lib/redirects.test.ts`'i güncelle, yeniden deploy et. **Çözüm olarak
`'unsafe-inline'` ekleme** — kök nedeni bul.

---

### N-3 · Canlı sitemap ve llms.txt tazeliği

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Mühendislik |

**Neden:** Sitemap build sırasında üretiliyor; sonuç 107 → 108 URL (çıkan `/cadde`,
eklenen `/campaign/vlogger` + `/campaign/blogger`). `public/llms.txt`'teki 7 ölü çapa
düzeltildi. İkisi de ancak canlıda doğrulanır.

**Yapılacaklar:**
```bash
BASE_URL=https://corteqs.net npm run verify:release
curl -s https://corteqs.net/sitemap.xml | grep -c '<loc>'        # 108 beklenir
curl -s https://corteqs.net/sitemap.xml | grep -c '/cadde<'      # 0 beklenir
curl -sI https://corteqs.net/404-olmayan-bir-yol | head -1        # bkz. B-4
curl -s https://corteqs.net/llms.txt | grep -oE 'https?://[^ )]+' \
  | while read u; do printf "%s %s\n" "$(curl -so /dev/null -w '%{http_code}' "$u")" "$u"; done
# Beklenen: hepsi 200, hiçbiri 301 değil.
```
**Kabul:** 108 URL, `/cadde` yok, llms.txt'teki her URL 200.

---

## 2. Ürün kararı bekleyen

Bu maddeler teknik olarak çözülebilir ama **içerik/iddia/politika** kararı gerektirir.
Mühendislik tek başına karar veremez.

### B-1 · index.html JSON-LD kapsamı

| | |
|---|---|
| **Risk** | Orta |
| **Karar sahibi** | Ürün |

**Neden ertelendi:** Kullanıcı açık talimat verdi — "dokunma, raporla".

**Bulgu:**

| Sorun | Detay |
|---|---|
| FAQPage 12 soru | Sayfada FAQ içeriği var ama **çapası yok**. Google, yapısal veride görünen soruların sayfada bulunabilir olmasını ister. |
| Offer (99 EUR) | Fiyat `index.html`'de sabit gömülü. Fiyat değişirse yapısal veri yalan söyler. |
| `dateModified: 2026-07-06` | Sabit. Her deploy'da bayatlıyor. |
| BreadcrumbList | `index.html`'de olduğu için **tüm rotalar** miras alıyor. `/blog/foo` sayfası ana sayfanın breadcrumb'ını gösteriyor. |

**Yapılacaklar (karar verilirse):**
1. FAQ bloğuna gerçek çapa id'leri ver (`id="sss-1"` …) veya FAQPage'i kaldır.
2. `Offer`/`price` alanını tek kaynağa bağla (fiyat sabiti) veya statik JSON-LD'den çıkar.
3. `dateModified`'ı build zamanında üret (`scripts/generate-sitemap.mjs` yanında bir
   adım) veya alanı kaldır.
4. BreadcrumbList'i `index.html`'den **çıkar**, `useSeo({ jsonLd })` ile sayfa başına
   ver — altyapı zaten hazır (`src/lib/seo.ts` `jsonLd` alanını destekliyor ve unmount'ta
   temizliyor).

---

### B-2 · Doğrulanamayan iddialar (yapısal veri + içerik)

| | |
|---|---|
| **Risk** | Orta (itibar/uyum) |
| **Karar sahibi** | Ürün |

**Neden ertelendi:** Bunlar mühendislik hatası değil, **doğruluk** kararı.

**Bulgu — `index.html` ve `public/llms.txt` içinde:**
- "164 ülkede 8,8 milyon" — kaynağı yok
- `foundingDate: 2026`, `foundingLocation: Istanbul`
- İki kurucu `Person` kaydı (Qualtron Sinclair, Akcakanat-Terzioglu)
- "$1.000 / $10.000 kurucu katkısı"

**Yapılacaklar:** Her iddia için üç seçenekten biri: (a) kaynak göster, (b) yumuşat
("tahmini", "kaynak: X"), (c) kaldır. `Organization` JSON-LD'sindeki `Person` kayıtları
gerçek kişilerse yayınlanmaya rıza kontrolü de gerekir.

---

### B-3 · Geçersiz SearchAction, serbest SpeakableSpecification, meta keywords

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Ürün (içerik) / Mühendislik (uygulama) |

**Bulgu:**
- `SearchAction` hedefi `google.com/search?q=site:...` — bu **geçersiz**. `SearchAction`
  sitenin **kendi** arama uç noktasını göstermelidir. Yanlış hedef sinyali bozar.
- `SpeakableSpecification` gelişigüzel CSS seçicilerle tanımlı; Google bunu yalnızca
  sınırlı haber içeriğinde destekler.
- `meta keywords` — 2009'dan beri hiçbir arama motoru kullanmıyor, gürültü.

**Yapılacaklar:** `SearchAction`'ı ya gerçek bir site içi arama URL'ine bağla
(`/directory?q={search_term_string}` gibi) ya da tamamen kaldır. `SpeakableSpecification`
ve `meta keywords`'ü kaldır. Hepsi `index.html`'de tek yerde.

---

### B-5 · AI crawler politikası

| | |
|---|---|
| **Risk** | Düşük (teknik) / Orta (iş) |
| **Karar sahibi** | Ürün |

**Bulgu:** `public/robots.txt` şu an GPTBot, CCBot, Google-Extended ve Bytespider'a
**izin veriyor**. Yani üye profilleri, katalog kayıtları ve blog içeriği model eğitimine
serbest.

**Yapılacaklar:** Ürün "içerik AI eğitimine açık olsun mu?" sorusuna karar versin.
Kapatılacaksa:
```
User-agent: GPTBot
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: Bytespider
Disallow: /
```
Not: `Google-Extended`'i kapatmak normal Google aramasını **etkilemez**, yalnızca
Gemini/AI Overviews eğitimini etkiler. `public/llms.txt` zaten bilinçli olarak AI'ya
yapılandırılmış içerik sunuyor — politika bu iki dosya arasında tutarlı olmalı.

---

### B-10 · SONDURUM.md kök konumu

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Kullanıcı |

**Bulgu:** `CLAUDE.md` "kökte yalnız 4 doküman" diyor; gerçek 5 `.md`
(`AGENT_CONTEXT.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `README.md`, `SONDURUM.md`) +
`rapor.html`. `SONDURUM.md` 26 KB ve fazladan.

**Yapılacaklar:** İki seçenek:
- (a) `SONDURUM.md` kökte kalsın → `CLAUDE.md`'deki "4 doküman" ifadesini 5'e güncelle.
- (b) `docs/`'a taşı → kök 4'e döner, ama SONDURUM.md aktif bir çalışma dosyası olduğu
  için kullanıcının erişim alışkanlığı değişir.

Bu bir doküman düzeni kararıdır, kullanıcı verir. Hangisi olursa olsun `CLAUDE.md`
düzeltilmeli — şu an yanlış.

---

### B-11 · `public/burak-stripe-rehberi.html` herkese açık servis ediliyor

| | |
|---|---|
| **Risk** | **Orta–Yüksek** (içeriğe bağlı) |
| **Karar sahibi** | Ürün + Kullanıcı |

**Bulgu:** Dosya git'te izleniyor ve `https://corteqs.net/burak-stripe-rehberi.html`
adresinde **kimlik doğrulaması olmadan** servis ediliyor. `public/robots.txt` yalnızca
`/admin`'i engelliyor, bu dosyayı engellemiyor. Yani hem erişilebilir hem indekslenebilir.

**Neden ertelendi:** İçeriğin gerçekten gizli olup olmadığı ürün bilgisi. Mühendislik
"herkese açık" olduğunu kanıtlar, "olmamalı" kararını veremez.

**Yapılacaklar (gizli ise, sıra önemli):**
1. Dosyayı `public/`'ten çıkar (gerekiyorsa `docs/` altına taşı).
2. Deploy et ve 404 döndüğünü doğrula: `curl -sI https://corteqs.net/burak-stripe-rehberi.html`
3. Git geçmişinde kalır — içinde **anahtar/sır** varsa geçmişten temizleme + anahtar
   rotasyonu ayrıca gerekir.
4. Genel kural: `public/` = "herkese açık" demektir. Buraya gizli bir şey konmaz.

---

## 3. Teknik borç

### B-6 · `Suspense fallback={null}` — lazy chunk yüklenirken boş ekran

| | |
|---|---|
| **Risk** | Düşük (regresyon) / Orta (LCP) |
| **Karar sahibi** | Mühendislik |

**Bulgu:** `App.tsx` 51 `lazy()` route kullanıyor, `Suspense fallback={null}`. Yavaş
bağlantıda chunk inerken kullanıcı **beyaz ekran** görüyor. Bu doğrudan LCP (Largest
Contentful Paint) metriğine yazılır.

**Yapılacaklar:**
1. `src/components/RouteFallback.tsx` — iskelet (skeleton) veya minimal marka bloğu.
   Layout shift üretmemesi için ana içerik alanıyla aynı yüksekliği rezerve etsin.
2. `App.tsx`'te `fallback={null}` → `fallback={<RouteFallback />}`.
3. Public rotalarla admin rotaları farklı iskelet isteyebilir — `PublicLayout` /
   `AdminLayout` seviyesinde ayrı `Suspense` düşünülebilir.

**Dikkat:** Prerender ile etkileşimi var — bkz. **D-3**. Fallback iskeleti prerender
çıktısına yakalanırsa durum kötüleşir, iyileşmez. D-3 ile birlikte ele al.

---

### B-7 · Bundle: kullanım haritası yok, `manualChunks` yok

| | |
|---|---|
| **Risk** | Orta |
| **Karar sahibi** | Mühendislik |

**Bulgu:**
- `recharts`, `d3-geo`, `framer-motion` bağımlılıkları var; **hangi sayfalarda
  kullanıldıkları ölçülmedi**.
- `vite.config.ts`'te `manualChunks` tanımlı değil → vendor bölme Vite varsayılanına
  bırakılmış.
- `vite.config.ts`'te ikinci bir entry var (`lansman/index.html`) — bu bölmeyi
  etkiliyor olabilir.

**Yapılacaklar:**
```bash
# 1) Gerçek kullanım haritası (tahmin etme, ölç)
rg -l "from ['\"]recharts" src/ | wc -l
rg -l "from ['\"]d3-geo"   src/ | wc -l
rg -l "from ['\"]framer-motion" src/ | wc -l

# 2) Bundle görselleştirme
npm i -D rollup-plugin-visualizer
# vite.config.ts'e ekle, sonra:
npm run build && open dist/stats.html
```
3. Ölçüme göre `manualChunks` ile ağır kütüphaneleri ayır (chart'lar yalnızca dashboard
   rotalarında iniyorsa vendor'dan ayrılmalı).
4. Kullanılmayan bağımlılık çıkarsa `package.json`'dan sil.

---

### B-8 · 112 dosya 300 satırdan uzun

| | |
|---|---|
| **Risk** | Orta (dokunulan dosyaya bağlı) |
| **Karar sahibi** | Mühendislik |

**Bulgu:** En büyükleri:

| Dosya | Satır |
|---|---|
| `src/pages/ProfilePage.tsx` | 2511 |
| `src/pages/admin/CommandCenterManager.tsx` | 1987 |
| `src/pages/admin/AddWhatsAppPage.tsx` | 1611 |

Global kural 200–400 satır tipik, 800 maksimum. 112 dosya bunu aşıyor.

**Neden ertelendi:** Toptan bölme = yüksek regresyon riski, düşük görünür fayda. Test
kapsamı olmayan 2500 satırlık bir sayfayı bölmek kanıtsız bir bahis olur.

**Yapılacaklar (kademeli, fırsatçı):**
1. **Yeni kural:** 800+ satırlık bir dosyaya dokunulduğunda, o dokunuşla birlikte en az
   bir mantıksal blok ayrı dosyaya çıkarılır. Toptan kampanya yapma.
2. `ProfilePage.tsx` (2511) için özel not: Faz D'de `CaddeTanitimPanel` çıkarımı zaten
   planlı (`docs/cadde-300/frontend-devir-notu-2026-08-02.md`, F14 hedefi
   `ProfilePage:1683`). O işle birleştir.
3. Bölmeden **önce** o dosya için karakterizasyon testi yaz — yoksa bölme doğrulanamaz.

---

### B-9 · Component içinde doğrudan veri erişimi + `as any`

| | |
|---|---|
| **Risk** | Orta |
| **Karar sahibi** | Mühendislik |

**Bulgu:**
- 83 dosyada component içi `supabase.from(`
- 42 dosyada component içi `supabase.rpc(`
- 89 adet `as any`

`CLAUDE.md` bunu zaten anti-pattern ilan ediyor ("Direct component fetch"), tercih edilen
katman `src/lib/*-api.ts` + React Query.

**Neden ertelendi:** 125 çağrı noktası tek batch'e sığmaz ve her biri kendi hata/yükleme
davranışını taşıyor.

**Yapılacaklar:** Faz D pilotu (bölüm 4) tam olarak bunun **kanıtı**. Pilot 5 sayfada
deseni gösterecek; sonra domain domain genişletilir. Sıra önerisi:
1. Faz D pilot domain (public content) — bkz. D-2.
2. `as any` temizliği B-1 (types.ts) çözüldüğü için artık **mümkün** — 89'un çoğu bayat
   tiplere karşı savunma olarak yazılmıştı, artık gereksiz olabilir. Önce ölç:
   `rg -n "as any" src/ | rg -v "\.test\." | wc -l`
3. Yeni kod için kural zaten net: `*-api.ts` + React Query. Yeni ihlal eklenmesin.

---

### T-1 · Kalan 98 `tsc` hatası

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Mühendislik |

**Bulgu:** Baseline 103 hataydı; 5 ölü sayfanın silinmesiyle 16'ya düştü. kalan 98 hata
**B1 ile ilgisiz** — `types.ts` güncel (`cadde_posts`, `revision_request*` tanımlı).
Kalan hata sınıfları:

| Sınıf | Not |
|---|---|
| Varyant/accent tipleri | UI bileşenlerinde union daralması |
| `ProfilePage.tsx` boolean atamaları | `strictNullChecks: false` altında gizlenen gerçek tip uyuşmazlıkları |
| `role_taxonomy_rules` tablosu yok | Kod, **var olmayan** bir tabloya referans veriyor — bu bir tip hatası değil, **ölü/bozuk kod** işareti |

**Yapılacaklar:**
```bash
npx tsc -p tsconfig.app.json --noEmit 2>&1 | tee /tmp/tsc.txt
```
1. Önce `role_taxonomy_rules` referanslarını incele — tablo AFS rebuild'de düşürüldü
   (`CLAUDE.md`: taxonomy kavramı kaldırıldı). Bu kod muhtemelen ölü; siliniyorsa hata da
   gider.
2. Varyant/accent hatalarını tip düzeltmesiyle çöz (`as any` ile susturma).
3. `ProfilePage.tsx` boolean hataları için önce hangi değerin gerçekten `null`
   olabildiğini doğrula — bunlar gerçek runtime bug adayı olabilir.

**Hedef:** 98 → 0. Sonrasında `tsc --noEmit` CI kapısına eklenebilir (şu an eklenemez,
çünkü kırmızı).

---

### T-2 · 1280 lint problemi (1060 error, 220 warning)

| | |
|---|---|
| **Risk** | Düşük (tekil) / Orta (kapı olarak) |
| **Karar sahibi** | Mühendislik |

**Bulgu:** Bu çalışmayla ilgisiz, önceden var olan durum. Çoğunluk
`@typescript-eslint/no-explicit-any`. `eslint.config.js` minimal;
`no-unused-vars` kapalı.

**Neden ertelendi:** 1060 error'ı tek seferde temizlemek devasa bir diff üretir ve
inceleme değeri sıfıra düşer.

**Yapılacaklar (kademeli):**
```bash
# 1) Kural bazında dağılımı ölç
npm run lint -- -f json > /tmp/lint.json
node -e "const r=require('/tmp/lint.json');const m={};for(const f of r)for(const x of f.messages)m[x.ruleId]=(m[x.ruleId]||0)+1;console.log(Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,15))"
```
1. Dağılımı gör. Tek bir kural %70+ ise (muhtemelen `no-explicit-any`), o kuralı
   **B-9'un `as any` temizliğiyle birlikte** ele al — aynı kök neden.
2. Otomatik düzeltilebilenleri ayır: `npm run lint -- --fix` (diff'i incele, körlemesine
   commit etme).
3. Kalan için **baseline dondurma** yaklaşımı: mevcut ihlalleri kabul et, ama CI'da
   "yeni ihlal ekleme" kapısı kur (değişen dosyalarda lint). Böylece sayı monoton azalır.

---

## 4. Varlık / performans

### B-12 · `public/` içinde ~78 MB video

| | |
|---|---|
| **Risk** | Düşük (fonksiyonel) / Yüksek (LCP + imaj boyutu) |
| **Karar sahibi** | Mühendislik + Ürün (hangi video kalacak) |

**Bulgu:**

| Dosya | Boyut |
|---|---|
| `public/footer-community.mp4` | 48 MB |
| `public/hero-people.mp4` | 11 MB |
| `public/hero-network.mp4` | 7,9 MB |
| `public/whatmaskot.mp4` | 5,4 MB |
| `public/herovideo.mp4` | 3,5 MB |
| `public/earth-night.webm` | 2,9 MB |

**Toplam ~78 MB ve hepsi Docker imajına giriyor.** Bu her deploy'da taşınıyor, her
nginx katmanında saklanıyor.

Özellikle `footer-community.mp4` (48 MB) bir **footer** öğesi için savunulamaz — sayfanın
en altında, çoğu kullanıcının hiç görmediği bir konumda.

**Yapılacaklar:**
1. **Ölç:** Her videonun hangi sayfada, `autoplay` ile mi yoksa etkileşimle mi
   yüklendiğini tespit et. `autoplay` + 48 MB = kritik.
2. **Sıkıştır:** Hedef web teslimatı, kaynak kalitesi değil.
   ```bash
   ffmpeg -i public/footer-community.mp4 -vf "scale=-2:720" -c:v libx264 -crf 28 \
     -preset slow -an -movflags +faststart public/footer-community.opt.mp4
   # -an: footer videosunda ses gerekmiyorsa sil. faststart: metadata başa alınır.
   ```
   48 MB → tipik olarak 3–6 MB bandına iner.
3. **Lazy load:** `preload="none"` + `IntersectionObserver` ile görünürlüğe girince yükle.
   Footer videosu için zorunlu.
4. **Docker imajından çıkarmayı değerlendir:** Videolar Supabase Storage veya bir CDN'den
   servis edilirse imaj küçülür, deploy hızlanır. Bu bir mimari karar — nginx zaten tek
   runtime, statik varlıkları da o servis ediyor.
5. **`.dockerignore` kontrolü:** Kullanılmayan videolar imaja hiç girmemeli.

---

### B-13 · Şüpheli yinelenen görseller

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Mühendislik |

**Bulgu:**

| Şüphe | Detay |
|---|---|
| `sweet.png` (586 KB) + `sweet.jpg` (310 KB) | Aynı görselin iki formatı |
| `last.png` / `newbg.png` | **Aynı boyut** (745 KB) → muhtemelen birebir kopya |
| `og-image.png` + `og-image-new.jpg` | `seo.ts` `SEO_DEFAULT_OG_IMAGE` olarak **`og-image-new.jpg`** kullanıyor; eskisi hâlâ duruyor |
| `denemesremake.png`, `yeniinffffffff.png` | İsimlendirmeden anlaşılıyor: deneme artığı |

**Yapılacaklar:**
```bash
# 1) Gerçek kopyaları hash ile bul (boyut eşitliği kanıt değil)
cd public && find . -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) \
  -exec sha256sum {} + | sort | uniq -w64 -D

# 2) Her aday için referans var mı? (silmeden ÖNCE)
rg -n "og-image\.png|denemeremake|yeniinffffffff|newbg|last\.png" src/ public/ index.html
```
Referansı olmayanları sil. **Dikkat:** `og-image.png` dış sitelerde (LinkedIn/X önbelleği,
eski paylaşımlar) hâlâ isteniyor olabilir — silmeden önce erişim logu veya en azından
bekleme süresi düşün.

---

## 5. Faz D — clean-code pilotu (public content domain)

Bu bölüm bir "temizlik" listesi değil, **desen kanıtı**. Amaç: B-9'un (component içi veri
erişimi) çözümünü 5 sayfalık dar, düşük riskli, birbirine benzeyen bir domainde göstermek
ve sonraki domainlere kopyalanabilir bir şablon bırakmak.

**Pilot domain (5 sayfa, hepsi public, hepsi mevcut):**

```
src/pages/RadarHubPage.tsx
src/pages/BlogPostPage.tsx
src/pages/DiasporaDetailPage.tsx
src/pages/CommercialDocumentPage.tsx
src/pages/IndependentProfilePage.tsx
```

**Neden bu beşi:** Hepsi public (auth karmaşası yok), hepsi "slug/id → veri getir →
SEO yaz → içerik göster" aynı şeklini paylaşıyor, hepsi sitemap'e girdi üretiyor. Yani
tek bir soyutlama beşine de oturur. Regresyon yüzeyi dar ve gözle doğrulanabilir.

---

### D-1 · Ortak `usePublicContentSeo` hook'u

| | |
|---|---|
| **Risk** | Düşük |
| **Karar sahibi** | Mühendislik |

**Bulgu:** Beş sayfa da `useSeo(...)` çağrısını kendi içinde kuruyor; title/description
kesme, fallback, `ogImage` seçimi ve `canonicalPath` üretimi her sayfada tekrar yazılmış.
Bu, Batch 3'te düzeltilen canonical sızıntısının **tekrar oluşabileceği** yer: yeni bir
sayfa `canonicalPath` vermeyi unutursa `resolveCanonical` `window.location.pathname`'e
düşer — artık güvenli, ama açık `canonicalPath` her zaman daha iyi.

**Yapılacaklar:**
1. `src/lib/seo/usePublicContentSeo.ts` oluştur:
   ```ts
   interface PublicContentSeoInput {
     kind: "radar" | "blog" | "diaspora" | "commercial" | "profile";
     slug: string;                 // canonicalPath buradan türetilir — zorunlu
     title?: string;
     description?: string;
     image?: string | null;
     publishedAt?: string | null;
     isLoading: boolean;           // bkz. D-3
     notFound?: boolean;           // true ise robots: "noindex, follow"
   }
   ```
2. Kural: `canonicalPath` **hook içinde** `kind` + `slug`'dan üretilir, çağıran serbest
   metin veremez. Böylece canonical drift'i yapısal olarak imkânsızlaşır.
3. Açıklama kesme (ör. 155 karakter) ve `ogImage` fallback tek yerde.
4. `notFound` → `robots: "noindex, follow"` (Batch 3'te `NotFound.tsx` için yapılanın
   aynısı; içerik bulunamayan dinamik sayfalar da soft-404'tür ve indekslenmemeli).
5. Test: `src/lib/seo/usePublicContentSeo.test.ts` — 5 `kind` için canonical üretimi,
   notFound → noindex, description kesme.

---

### D-2 · Veri erişimini `*-api.ts` katmanına çekme + React Query key factory

| | |
|---|---|
| **Risk** | Orta |
| **Karar sahibi** | Mühendislik |

**Bulgu:** Beş sayfa da `supabase.from(...)` çağrılarını component gövdesinde yapıyor
(B-9'un bir alt kümesi). Sonuçlar: hata davranışı sayfa başına farklı, önbellek yok,
aynı veri iki bileşende iki kez çekiliyor, test için mock yüzeyi component'e yapışık.

**Yapılacaklar:**

1. **API katmanı** — `muhasebe-api.ts` desenini birebir izle (`CLAUDE.md`'de referans
   mimari olarak gösteriliyor):
   ```
   src/lib/public-content/radar-api.ts
   src/lib/public-content/blog-api.ts
   src/lib/public-content/diaspora-api.ts
   src/lib/public-content/commercial-api.ts
   src/lib/public-content/independent-profile-api.ts
   ```
   Her modül: sorgu + Zod doğrulama + tipli dönüş. `supabase` importu **yalnızca** burada.

2. **Query key factory** — dağınık string dizisi yerine tek kaynak:
   ```ts
   // src/lib/public-content/query-keys.ts
   export const publicContentKeys = {
     all: ["public-content"] as const,
     radar: () => [...publicContentKeys.all, "radar"] as const,
     radarList: (filters: RadarFilters) => [...publicContentKeys.radar(), filters] as const,
     blogPost: (slug: string) => [...publicContentKeys.all, "blog", slug] as const,
     diaspora: (slug: string) => [...publicContentKeys.all, "diaspora", slug] as const,
     commercial: (slug: string) => [...publicContentKeys.all, "commercial", slug] as const,
     profile: (id: string) => [...publicContentKeys.all, "profile", id] as const,
   } as const;
   ```
   Fayda: invalidation hedeflenebilir olur (`publicContentKeys.radar()` tüm radar
   sorgularını düşürür), key yazım hatası tip hatasına dönüşür.

3. **PostgREST 1000 satır tuzağı:** Batch 4'te `scripts/generate-sitemap.mjs` için
   `fetchAllRows()` helper'ı yazıldı. Liste döndüren her yeni API fonksiyonu **aynı
   tuzağa** açıktır. Ya sayfalama uygula ya da `.limit()` ile bilinçli sınır koy —
   sessiz kesme yapma. (Bu tuzak bu projede daha önce de vurdu: "son WA 6 Temmuz"
   yanılgısı ve `geo_countries` sayfalaması.)

4. **Sıra:** Bir sayfayı baştan sona bitir (öneri: `BlogPostPage.tsx` — en basit şekil),
   deseni doğrula, sonra kalan dördünü uygula. Beşini paralel başlatma.

5. **Test:** Her `*-api.ts` için Zod doğrulama + hata yolu testi. Component testleri
   artık `supabase` yerine api modülünü mock'lar — mock yüzeyi küçülür.

---

### D-3 · `seo.ts` `render-complete`'i mount anında dispatch ediyor

| | |
|---|---|
| **Risk** | **Orta–Yüksek** (SEO açısından sessiz hata) |
| **Karar sahibi** | Mühendislik |

**Bulgu — kanıt:** `src/lib/seo.ts:183`

```ts
// Prerender servisine "render tamam" sinyali.
document.dispatchEvent(new Event("render-complete"));
```

Bu satır `applySeo()` gövdesinin sonunda, koşulsuz çalışır. `useSeo()` ise
`useEffect(..., deps)` içinde, yani **mount anında** çağrılır.

Sonuç: async veri yükleyen dinamik bir sayfada (`BlogPostPage`, `DiasporaDetailPage`,
`IndependentProfilePage`, `RadarHubPage`, `CommercialDocumentPage` — tam olarak pilot
domain) sıralama şudur:

```
1. Component mount olur, veri henüz YOK
2. useSeo çalışır (fallback/boş title ile)
3. render-complete dispatch edilir      ← prerender BURADA yakalar
4. Veri gelir, gerçek title/description/JSON-LD yazılır  ← prerender bunu GÖRMEZ
```

Prerender iskeleti yakalar. Yani arama motoruna giden HTML'de gerçek başlık, açıklama ve
içerik olmayabilir. Bu **sessiz** bir hatadır — hiçbir test kırılmaz, konsola bir şey
yazılmaz, yalnızca indeks kalitesi düşer.

**Not:** B-6 (Suspense fallback) bu sorunu **büyütür**. Fallback iskeleti eklenirse ve
`render-complete` hâlâ erken atılırsa, prerender çıktısı gerçek içerik yerine iskeleti
içerir. İki maddeyi birlikte çöz.

**Yapılacaklar:**
1. `render-complete` dispatch'ini `applySeo`'dan **ayır**. `applySeo` yalnızca meta yazsın.
2. Yeni açık sinyal: `signalRenderComplete()` — ayrı export, idempotent (birden fazla
   çağrı tek event üretir).
3. `usePublicContentSeo` (D-1) `isLoading` alanını zaten alıyor:
   ```ts
   // isLoading false OLDUKTAN SONRA, meta yazıldıktan sonra sinyal ver
   useEffect(() => {
     if (isLoading) return;
     signalRenderComplete();
   }, [isLoading]);
   ```
4. **Emniyet supabı:** Veri hiç gelmezse (hata, timeout) prerender sonsuza kadar bekler.
   Mount'tan itibaren bir üst sınır zamanlayıcı koy (ör. 8 sn) ve o dolduğunda ne olursa
   olsun sinyal ver. Prerender servisinin kendi timeout'unun **altında** kalmalı.
5. Statik sayfalar (veri beklemeyen) için davranış değişmemeli — mount'ta sinyal versinler.
6. **Doğrulama (bu maddenin asıl kabul kriteri):**
   ```bash
   # Prerender çıktısında gerçek başlık var mı?
   curl -s -A "Googlebot" https://corteqs.net/blog/<bir-yazi-slug> \
     | grep -E '<title>|name="description"'
   # Beklenen: yazının GERÇEK başlığı. Genel site başlığı çıkıyorsa hata devam ediyor.
   ```
   Bu kontrolü mevcut durumda **önce** çalıştır — sorunun canlıda gerçekten olup
   olmadığını kanıtlar (kod analizi olabileceğini gösterir, olduğunu göstermez).

---

### D-4 · Faz D kabul kriterleri

Faz D "bitti" sayılması için hepsi doğrulanmalı:

- [ ] 5 pilot sayfada component gövdesinde `supabase.from(` / `supabase.rpc(` **0** kaldı
      (`rg -n "supabase\.(from|rpc)\(" src/pages/{RadarHubPage,BlogPostPage,DiasporaDetailPage,CommercialDocumentPage,IndependentProfilePage}.tsx`)
- [ ] 5 sayfa da `usePublicContentSeo` kullanıyor, hiçbiri `useSeo`'yu doğrudan çağırmıyor
- [ ] Query key'ler `publicContentKeys` factory'sinden geliyor, elle string dizisi yok
- [ ] Her yeni `*-api.ts` için test var; liste döndüren fonksiyonlarda sayfalama veya
      bilinçli `.limit()` var
- [ ] `render-complete` yalnızca veri hazır olduktan sonra atılıyor + timeout emniyet supabı var
- [ ] `curl -A Googlebot` ile 5 sayfa tipinin her birinde gerçek başlık/açıklama görülüyor
- [ ] `npm run build` exit 0, `npm run verify:text` geçiyor, `tsc` hata sayısı **artmadı**
- [ ] Sitemap URL sayısı beklenmedik şekilde değişmedi (108 taban)

---

## 6. Özet — öncelik sırası

| Sıra | Madde | Risk | Karar sahibi |
|---|---|---|---|
| 1 | **N-1** Konteyner doğrulaması | Yüksek | Mühendislik |
| 2 | **N-2** Canlı CSP konsol kontrolü | Yüksek | Mühendislik |
| 3 | **N-3** Sitemap + llms.txt tazeliği | Düşük | Mühendislik |
| 4 | **B-11** Herkese açık Stripe rehberi | Orta–Yüksek | Ürün + Kullanıcı |
| 5 | **D-3** `render-complete` erken dispatch | Orta–Yüksek | Mühendislik |
| 6 | **B-12** 78 MB video | Yüksek (LCP) | Mühendislik + Ürün |
| 7 | **D-1/D-2** Faz D pilot | Orta | Mühendislik |
| 8 | **T-1** 98 tsc hatası | Düşük | Mühendislik |
| 9 | **B-6** Suspense fallback (D-3 ile) | Orta (LCP) | Mühendislik |
| 10 | **B-7** Bundle ölçümü | Orta | Mühendislik |
| 11 | **B-1/B-2/B-3** JSON-LD + iddialar | Orta | Ürün |
| 12 | **B-5** AI crawler politikası | Orta (iş) | Ürün |
| 13 | **T-2** 1280 lint problemi | Düşük | Mühendislik |
| 14 | **B-9** Veri erişimi + `as any` (D-2'den sonra) | Orta | Mühendislik |
| 15 | **B-13** Yinelenen görseller | Düşük | Mühendislik |
| 16 | **B-8** 112 uzun dosya (fırsatçı) | Orta | Mühendislik |
| 17 | **B-10** SONDURUM.md konumu | Düşük | Kullanıcı |
| 18 | **B-4** Gerçek HTTP 404 | Orta | Mühendislik (bkz. aşağı) |

### B-4 · Gerçek HTTP 404 (soft-404'ün tam çözümü)

| | |
|---|---|
| **Risk** | Orta |
| **Karar sahibi** | Mühendislik |

**Bulgu:** SPA fallback nedeniyle her bilinmeyen yol `index.html` ile **HTTP 200**
döner. Batch 3'te `NotFound.tsx`'e `robots: "noindex, follow"` eklendi — bu **hafifletme**,
çözüm değil. Arama motoru hâlâ 200 görüyor.

**Neden ertelendi:** Gerçek 404 için sunucunun geçerli rota listesini **bilmesi** gerekir.
Bu, mimari bir karar: ya nginx'e rota listesi enjekte edilir (build zamanında üretilen bir
`map` bloğu), ya prerender katmanı 404 durum kodunu geri yazar, ya da SSR'a geçilir.

**Yapılacaklar (seçeneklerle):**
- (a) **Build-time nginx rota haritası:** `src/lib/redirects.ts` deseninin aynısı —
  `App.tsx`'ten rota listesi çıkarılıp `nginx.conf.template`'e `map $uri $known_route`
  olarak yazılır, bilinmeyen yollar `return 404`. Drift'i test ile kilitle (aynı
  `redirects.test.ts` deseni). En düşük riskli seçenek.
- (b) **Prerender 404:** Prerender servisi `meta[name=robots]="noindex"` gördüğünde 404
  durum kodu döndürsün. Yalnızca crawler yolunu düzeltir, kullanıcı yolunu düzeltmez.
- (c) **SSR:** Kapsam olarak bu backlog'un dışında.

Öneri: (a). `src/lib/redirects.ts` + `redirects.test.ts` deseni bunun için zaten kanıtlanmış
bir şablon bıraktı.

---

## Notlar

- Bu dosyadaki tüm sayılar 2026-08-04'te **ölçüldü**. Bir maddeye başlamadan önce ilgili
  sayıyı yeniden ölç — arada değişmiş olabilir.
- Yazım kuralı: dosyalar UTF-8. `npm run verify:text` mojibake denetimi yapıyor ve
  `predev`/`prebuild`/`prelint`/`pretest` üzerinden otomatik koşuyor.
- Türkçe metin dönüşümlerinde `src/lib/text-normalization.ts` (`trIncludes`, `trUpper`,
  `trLower`, `trCompare`) kullan — bare `toUpperCase()/toLowerCase()` yalnızca teknik
  değerlerde doğrudur.
