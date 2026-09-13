# Devir notu — 13 Eylül 2026 gecesi: büyük dosya temizliği (clean code)

> **Bu belge sıfırdan gelen biri için yazıldı.** Başka bir şey okumana gerek yok.
> Oturum "cleancode uygulamasını başlat" isteğiyle başladı, kapsam "HEPSİ" seçildi,
> 2 saatlik kutu verildi ve **büyük dosya borcuna** odaklanıldı.
>
> Aynı günün ÖNCEKİ işleri (S-serisi, acil liste, Komuta Merkezi/Workshop triyajı)
> ayrı bir belgede: `docs/handover/2026-09-09-devir-notu.md` §0.8. O belge kendi
> konusunda "YARIM KALDI" işaretlidir; bu belge onun devamı **değil**, ayrı bir iştir.

---

## 0. Otuz saniyede durum

| | |
|---|---|
| Depo | `C:\temp_private\corteqs\corteqs_fin` · branch `main` |
| Son commit | `fb7f2a4` · `origin/main` ile senkron · çalışma ağacı **temiz** |
| Bu oturumun commit aralığı | `76206e4..fb7f2a4` (14 commit) |
| Test | **278 dosya / 1.958 test** yeşil (taban 276/1.935 idi, 23 test eklendi) |
| `tsc` | **0 hata** |
| ESLint | **0 hata** |
| Production build | `npm run build` **exit 0**, bundle chunk'ları doğrulandı |
| `check:dead` | 0 erişilemez dosya |
| `ingest:tools:check` | temiz (bu oturumda bayatlamıştı, kapatıldı) |
| Migration | **393/393** sapmasız — bu oturumda hiç migration yazılmadı |
| 800 satır üstü üretilmemiş dosya | **13 → 5** |
| Panel duyurusu | Kayıt eklendi (`20260913-buyuk-dosya-temizligi`), özet maili **GÖNDERİLDİ** (status=sent, 2 alıcı, 00:16:31) |

⚠️ **Canlıya çıkılmadı.** Her şey `main`'de ama Coolify deploy'u yapılmadı.

---

## 1. Ne yapıldı

Projenin kendi kuralı (`CLAUDE.md` + `~/.claude/rules/common/coding-style.md`):
**"many small files > few large files, 200-400 satır tipik, 800 max."**
13 üretilmemiş dosya bu sınırı aşıyordu. 11'i bölündü, **16.615 satır** taşındı.

| Dosya | Önce | Sonra | Nereye |
|---|---|---|---|
| `admin-shell/social-diaspora-posts.ts` | 2934 | **37** | `social-diaspora-posts/posts-*.ts` + `theme-labels` + `types` |
| `pages/ProfilePage.tsx` | 2782 | **795** | `components/profile/*` + `hooks/profile/*` + `lib/profile-*.ts` |
| `admin-shell/admin-updates.ts` | 2210 | **31** | `admin-updates/2026-*.ts` (aylık) |
| `commandcenter/CommandCenterManager.tsx` | 2127 | **25** | `commandcenter/manager/*` (19 dosya) |
| `pages/AddWhatsAppPage.tsx` | 1747 | **493** | `components/whatsapp/*` + `lib/whatsapp-landing-*.ts` |
| `admin-shell/burak-share-tools.ts` | 1418 | **49** | `burak-share-tools/tool-01..12.ts` + `types` |
| `dashboard/command-center-items.ts` | 1276 | **107** | `command-center-items/*` (13 dosya) |
| `pages/admin/AdminCatalogPage.tsx` | 1249 | **393** | `components/admin/catalog/*` + `lib/admin-catalog-display.ts` |
| `admin-shell/social-test-tools.ts` | 1189 | **32** | `social-test-tools/tools-*.ts` + `types` |
| `dashboard/links/LinkManager.tsx` | 967 | **131** | `links/*` bileşen+hook + `lib/dashboard/resource-*.ts` |
| `admin-shell/admin-navigation-registry.ts` | 849 | **40** | `admin-navigation-registry/<grup>.ts` (13 grup) |

**Uygulanan desen (yenisini bölerken bunu kopyala):** orijinal dosya ince bir **barrel**'a
dönüşür; içerik yeni bir alt klasöre doğal gruplara bölünür; barrel aynı public API'yi
**aynı sırada** re-export eder → hiçbir import site'ı değişmez. Örnek olarak
`src/lib/admin-shell/admin-updates.ts` ve `admin-navigation-registry.ts` barrel'larını oku.

---

## 2. ⚠️ Bu sınıfta ÜÇ SESSİZ KIRILMA VAR — ne lint ne test yakalar

`src/lib/**` altına dosya ekleyen **her** refactor bunları bozabilir. Üçü de bu oturumda
gerçekten yaşandı:

1. **`vite.config.ts` → `manualChunks`.** Kurallar **tam dosya yoluna** bakar
   (`".../social-test-tools.ts"`). Dosyayı klasöre bölersen parçalar o chunk'ın DIŞINDA
   kalır ve bundle bölünmesi sessizce değişir. Çözüm: kuraldaki `.ts` uzantısını kaldırıp
   uzantısız önek yap. Şu an `social-diaspora-posts`, `social-test-tools`, `burak-share-tools`
   uzantısız; `social-share-vault.ts` hâlâ uzantılı **ve bu doğru** (o klasöre bölünmedi).
   Doğrulama: `npm run build` sonrası `dist/assets/social-vault-*` her biri **tek** dosya olmalı.
2. **`scripts/` altındaki doğrudan kaynak okuyucular.** İki tanesi var:
   - `scripts/sync-admin-updates.mjs` → `admin-updates.ts`'i Node tip-sıyırma kipiyle
     **import eder**; ESM uzantısız göreli yol çözemez → o barrel'ın alt modül import'ları
     **bilinçli olarak `.ts` uzantısı taşır**, kaldırma.
   - `scripts/reseed-social-share-outputs.mjs` → `burak-share-tools` kaynağını **regex'le
     okuyup** 12 eşleme çıkarır, bulamazsa fırlatır. Bölünme sonrası parça dosyaların
     birleşimini okuyacak şekilde güncellendi.
3. **`npm run ingest:tools:check`.** `src/lib/**` altına eklenen her dosya ajan araç
   kataloğunu bayatlatır (`docs/agent/tools.json` + `src/lib/agent/tools-catalog.generated.ts`
   + `docs/agent/openapi.yaml`). Bu katalog `/admin/tool-registry` ve `/admin/agent-analytics`
   ekranlarına gider. **`prelint` yalnız `check:drift` çalıştırır, bunu DEĞİL.**
   Çözüm tek komut: `npm run ingest:tools`, sonra 3 üretilen dosyayı commit'le.
   (Dalga 1 bu adım atlanmış hâlde push edildi, `8218718` ile kapatıldı.)

---

## 3. Süreç notu: ayrıştıran ile denetleyen AYRI olmalı

Dalga 2'de her dosyayı bölen ajandan **bağımsız** bir gözden geçirici çalıştırıldı ve
görevi "onayla" değil **"çürütmeye çalış"** olarak tanımlandı. Karşılığını verdi —
yukarıdaki 3 numaralı tuzağı, aşağıdaki ölçüm hatalarını ve iki ölü kod parçasını
bölen taraf değil **denetleyen taraf** buldu. Bölen ajanlar "tsc temiz, lint temiz,
testler yeşil" diyordu ve teknik olarak haklıydılar; kusurlar "yeşil ama yanlış"
sınıfındandı.

⚠️ **`check:dead`'i iş sürerken çalıştırma** — parçalar oluşturulmuş ama henüz
bağlanmamışken yanlış alarm verir (bir gözden geçirici önce 6, dakikalar sonra 10
"yetim" dosya raporladı; iş bitince 0 çıktı).

---

## 4. Dürüst not — bu oturumda yapılan ÜÇ ölçüm hatası

Üçü de aynı sınıftan: **ölçüm aracının kör noktası sorgulanmadan rakama güvenildi.**

1. **"0 doğrudan `supabase.from/rpc` kaldı" İDDİASI YANLIŞTI.** Gerçek **2**, ikisi de
   `src/components/auth/AuthProvider.tsx` (satır 14-15, 19-20). Sebep: desen **tek satırda**
   arandı, bu iki çağrı ise çok satırlı zincir. **Multiline ara:** `supabase\s*\n?\s*\.from\(`.
   CLAUDE.md'de B6 maddesi tekrar **AÇIK**'a çevrildi.
2. **PowerShell `Measure-Object -Line` boş satırları saymaz.** `burak-share-tools.ts` için
   1091 der, gerçek 1418. Doğru ölçüm `(Get-Content $f).Count` veya `wc -l`.
3. **`check:dead` iş bitmeden çalıştırıldı** → yanlış alarm (bkz. §3).

---

## 5. KALDIĞIMIZ YER — sıradaki iş

### 5.1 Deploy + tarayıcıda gözle QA (EN ÖNCELİKLİ, hiç yapılmadı)

**16.615 satır taşındı ve hiçbiri tarayıcıda açılıp görülmedi.** Testler mantığı
doğrular, yerleşimi doğrulamaz. Bu repoda "yeşil testlerin arkasında canlıda kırık"
sınıfı defalarca yaşandı (fontlar CSP yüzünden hiç yüklenmiyordu, Cadde hata haritası
aylarca ölüydü).

1. Coolify'dan deploy (kullanıcı tetikler).
2. Deploy sonrası **gözle** bak: **Profil sayfası**, **WhatsApp topluluk sayfası**,
   **Komuta Merkezi**, **Katalog yönetimi**, **Kaynak/Link yöneticisi** — yerleşim
   bozulmuş mu, boş ekran var mı, konsol hatası var mı.
3. `BASE_URL=https://corteqs.net npm run verify:release`
4. Panel duyurusu (`/admin/about` + zil menüsü) deploy edilmeden **canlıda görünmez**.

### 5.2 Cadde ikilisi — bilerek ertelendi, testsiz bölme YASAK

| Dosya | Satır | Importer | Test |
|---|---|---|---|
| `src/lib/cadde-api.ts` | 986 | **25** | **YOK** |
| `src/pages/cadde/CaddePage.tsx` | 1716 | 19 | var (1845 satır) |

CLAUDE.md'nin Cadde bölümü bu alanın *sessizce* kırıldığı üç ayrı olayı belgeliyor
(fold-insensitive eşleşme, `instanceof Error` hatası aylarca canlıda kaldı, hedef
eşleşmesi). **Doğru sıra: önce `cadde-api.ts` için karakterizasyon testi yaz, sonra böl.**
Ayrıca SQL↔TS ayna sözleşmeleri var (`can_post_kopru` ↔ `cadde-rules.ts`,
`list_cadde_feed_v1` ↔ `cadde-ranking.ts`) — bunlara dokunmadan böl.

### 5.3 Kalan 800+ dosyalar (bilgi)

`CaddePage.test.tsx` (1845, test) · `CaddePage.tsx` (1716) · `ProfilePage.test.tsx`
(1028, test) · `cadde-api.ts` (986) · `zgen-data.ts` (980, veri).
Yani **ertelenenler dışında 800'ü aşan üretim kaynak dosyası kalmadı.**

⚠️ **300+ dosya sayısı 92'den 97'ye ÇIKTI ve bu gerileme DEĞİL** — bir devi 8 parçaya
bölmek 300-500 bandını şişirir ama devi yok eder. Bu maddede takip edilecek metrik
**800 üstü sayısıdır**.

### 5.4 Dokunulmayanlar

- `public/sitemap.xml` build sırasında yeniden üretilip 30 URL'in `lastmod`'unu bugüne
  çekiyor. `0a38d75` ile commit'lendi ama içerik değişmeden tarih bumplamak zayıf bir
  SEO sinyali — istenirse geri alınabilir.
- Fonksiyon uzunluğu, isimlendirme, hata yönetimi gibi **diğer clean-code boyutlarına
  hiç girilmedi**; bu oturum yalnız dosya boyutuna baktı.

---

## 6. Kapanış turu (her batch sonrası koş)

```bash
npx tsc -p tsconfig.app.json --noEmit     # 0 hata
npm run lint                              # 0 hata
npm run test                              # 278/1.958 yeşil
npm run build                             # exit 0
node scripts/check-dead-code.mjs          # 0 erişilemez  (İŞ BİTTİKTEN SONRA)
node scripts/ingest-tools.mjs --check     # temiz  (src/lib'e dosya eklediysen)
```

Satır sayarken `(Get-Content $f).Count` kullan, `Measure-Object -Line` **kullanma**.
