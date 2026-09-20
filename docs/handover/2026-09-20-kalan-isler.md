# Kalan işler — 20 Eylül 2026

Bu oturumda ana sayfadaki "Sistemin 6 Katmanı" kusuru kapatıldı (commit `03a4a82`,
push'landı) ve doküman temizliği yapıldı. Aşağıdakiler **açık** kalanlardır.

Her madde için kanıt yazılmıştır. **Rakamları ezberlemeyin, değiştirmeden önce
komutu tekrar çalıştırın** — bu depoda bayat rakamlar daha önce ödenmiş borcu
yeniden ödetti.

---

## 1. Deploy + gözle QA — ZORUNLU, en öncelikli

Dört yeni public rota canlıya çıkmadı: **`/city-ambassadors`**, **`/consultants`**,
**`/businesses`**, **`/isletme/:slug`**.

- Coolify deploy gerekiyor (üretim runtime **nginx**'tir, `server.mjs` DEĞİL).
- Deploy sonrası: `BASE_URL=https://corteqs.net npm run verify:release`
- Tarayıcı konsolunda **CSP ihlali** olup olmadığına bak. Yeni sayfalar dış görsel
  yüklemiyor, ama `DemoPageBanner` ve Radix `Select` ilk kez bu rotalarda çiziliyor.
- Ana sayfada **İşletmeler kartında DEMO rozeti** görünmeli; `/businesses`'a girince
  beta bandının altında **kapatılamaz DEMO bandı** çıkmalı. Görünmüyorsa
  `src/lib/demo-pages.ts` içindeki `path` ile `App.tsx`'teki `path` birebir
  eşleşmiyor demektir (hata hiçbir yerde görünmez).
- Sitemap'i yenile: `npm run generate:sitemap` (yeni: `/city-ambassadors`,
  `/consultants`; `/businesses` **bilinçli olarak yok** — demo içerik).

## 2. 61 uzman kaydını yayına al — kod işi DEĞİL, en yüksek getirili iş

**Yer:** `/admin/data` → durum filtresi **"İncelemede"**.

Ölçüldü (canlı, 2026-09-20): `Consultant_*` + kişi niteliğindeki `Healthcare_*`
rollerinde **81 gerçek kayıt** var ama yalnız **20'si** vitrine çıkabiliyor.
Kalan **61'inin 61'i de** tek tip durumda: `status='pending_review'` +
`visibility='private'` + `unverified`. Hepsi **17 Haziran 2026'da**, `created_by`
boş olarak, tek bir toplu içe aktarmayla girmiş (`/admin/bulk-import`) ve
**üç aydır onay kuyruğunda bekliyor.**

| Rol | Bekleyen |
|---|---|
| `Consultant_LawTax` | 20 |
| `Healthcare_Doctor` | 16 |
| `Consultant_VisaImmigration` | 7 |
| `Healthcare_Dentist` | 7 |
| `Consultant_RealEstate` | 4 |
| `Consultant_BusinessSetupWork` | 3 |
| `Consultant_PsychologistCoach` | 3 |
| `Consultant_PracticalLife` | 1 |

Onaylandığında `/consultants` **20 → 81 kayda** çıkar; kod değişikliği gerekmez,
sayfa kendiliğinden dolar.

Teyit sorgusu:

```sql
select platform_role_key, count(*)
from catalog_items
where deleted_at is null and not is_placeholder and status = 'pending_review'
  and (platform_role_key like 'Consultant\_%' or platform_role_key like 'Healthcare\_%')
group by 1 order by 2 desc;
```

## 3. `/directory` giriş duvarı — KARAR gerekiyor

**Bulgu:** `search_directory_catalog` RPC'si ilk satırında `auth.uid()` null ise
`authentication required` (42501) ile **patlıyor**. `DirectoryPage` de giriş
yapmamış ziyaretçiye "Birleşik katalog araması sadece giriş yapmış kullanıcılara
açık" diyor. Ama `/directory` **sitemap'te ilan edilmiş** durumda
(`priority 0.7, weekly`).

Google **anonim** tarar → sitemap'te içeriği giriş formundan ibaret bir sayfa var.

⚠️ `scripts/generate-sitemap.test.mjs` bunu **yakalayamaz**: o test yalnız
`RequireAuth` / `RequireFeature` sarmalayıcısına bakar, RPC düzeyindeki kapıya
bakmaz. Yani sözleşme testi yeşil olduğu hâlde kural ihlal ediliyor.

**Seçenekler:** (a) `/directory`'yi sitemap'ten çıkar, (b) RPC'yi anonim okumaya
aç (yeni sayfaların kullandığı `public-catalog-api.ts` deseni hazır — RLS
`catalog_items`'ı `anon`a zaten açıyor).

**Buna bağlı ikinci açık:** ana sayfadaki **İnsanlar kartı hâlâ `/directory`'ye
gidiyor**, yani Burak'ın şikâyeti o tek kart için kapanmadı. İnsanlar bilinçli
olarak kapsam dışı bırakılmıştı (gerekçe: `/directory` zaten üye dizinidir).

## 4. Mock veri kararı — Uzmanlar ve Şehir Elçileri

Karar "Kuruluşlar gibi melez" idi; **İşletmeler'de aynen uygulandı**. Uzmanlar ve
Şehir Elçileri'nde **mock KOYULMADI.** Gerekçe: `mock.ts`'teki `consultants` ve
`cityAmbassadors` uydurma **kişi** adları, puanlar ve "127 üye kazandırdı" gibi
sayılar taşıyor; ziyaretçi var olmayan bir avukata veya doktora ulaşmaya
çalışabilir. Gerçek kayıt (20 ve 9) sayfayı dolduruyor.

Aksini istersen: `PublicListingPage`'e `demoRows` prop'u geçmek yeterli, desen
`BusinessesPage.tsx`'te hazır.

## 5. Doküman temizliğinden kalanlar

**Yapıldı:** 4 aşılmış plan `docs/archive/2026-09-20-guncelligini-yitirenler/`'e
donduruldu (ölçüt + taşınMAYANLAR listesi o klasörün `README.md`'sinde) ·
`platform-safety-core.md` yanlış yerdeydi (`docs/architecture/` dizini tek
kaynak `docs/ARCHITECTURE.md` ile kavramsal olarak çakışıyordu), `docs/plans/`
altına alındı ve boş dizin kaldırıldı · `supabase/manual/` altındaki iki işletim
notu `docs/operations/`'a taşındı, o dizin artık yalnız SQL içeriyor.

Açık kalanlar:

- **`docs/` kökündeki 5 Supabase çıkış dokümanı** (`supabase-exit-plan.md`,
  `migration-runbook.md`, `migration-status.md`, `coolify-deployment.md`,
  `supabase-plan-decision.md`) **bilinçli olarak taşınmadı.** Birbirlerine
  `docs/...` önekli **19 çapraz atıf** yapıyorlar, `migration-status.md` canlı
  ilerleme takibi ve `scripts/migration/backup-rotate.mjs` de birine atıf
  yapıyor. Yürüyen bir işe 20 bağlantı düzeltmesi riski getirmek kazancına
  değmez. **Supabase çıkışı bitince** `docs/operations/` altına alınabilir —
  o zaman atıfları birlikte güncelle.
- **`docs/architecture/platform-safety-core.md`** (artık `docs/plans/`) depoda
  **0 atıf** alıyor ve **uygulanmamış bir tasarım** gibi duruyor. Bayat mı,
  bekleyen iş mi — karar senin. Bayatsa arşive, iş ise `plans/`'ta tarihli ada
  kavuşmalı.
- **`walast.txt`** (kökte, **1,67 MB**, 23.402 satır) bir **WhatsApp sohbet
  dökümü** ve içinde **gerçek telefon numaraları** ile özel yazışmalar var.
  `.gitignore` satır 130'da, yani depoya hiç girmiyor — bu yüzden dokunmadım.
  Ama `docs/` **yanlış yer**: orası dokümantasyon içindir, üçüncü kişilerin
  kişisel verisi için değil. Öneri: depo dışına al. Aynı durum `.secretdb`
  (gitignore satır 109) için de geçerli.
- `docs/reference-clones/` **1448 dosya** taşıyor (Lovable export klonları,
  `.gitignore` notuna göre 2026-07-18'de taşınmış) ve `docs/reference/` **397**.
  İkisi de `verify:text` denetiminden muaf. Gerçekten gerekiyor mu, bir gün
  ölçülmeli — ama atıf alıyorlar (4 yerden), kör silme yapılmamalı.

## 6. Paralel akışın commit edilmemiş işi — SENDE

Bu oturum boyunca **başka bir akış** aynı çalışma dizininde çalıştı ve işi
**commit edilmemiş** durumda:

- **relocation motoru:** `relocation-chat-api.ts`, `relocation-content-api.ts`,
  `relocation-content-format.ts`, `relocation-chat-context.ts`, yeni sekme
  panelleri, `RelocationHomePage.tsx`, `useRelocationMoveContent.ts`,
  `supabase/functions/relocation-assistant/`, 1 migration
- **events:** `events-api.ts`, `event-form-draft.ts`, `events-timezone.ts`,
  `event-share.ts`, 1 migration
- `SiteHeader.tsx`, `eslint.config.js`, `docs/README.md`, `docs/audits/`

⚠️ **Araç kataloğu:** `docs/agent/tools.json`, `docs/agent/openapi.yaml` ve
`src/lib/agent/tools-catalog.generated.ts` şu an **hem benim hem onların** yeni
`src/lib/**` modüllerini içeriyor. Bu üç dosyayı benim commit'ime **almadım**
(depoda var olmayan dosyalara atıf yapan bir katalog bırakmamak için). Sonuç:
commit'li katalog benim 7 yeni modülümü içermiyor. Onlar commit edince
kendiliğinden düzelir; etmezse bir kez `npm run ingest:tools` yeter.
**Ne lint ne test bunu yakalar** (`prelint` yalnız `check:drift` koşar).

⚠️ Ayrıca benim `EcosystemRailSection.tsx`'e eklediğim DEMO rozeti, onların
`1948626` commit'ine karıştı (aynı dosyanın iki hunk'ı, git ayıramaz). Sonuç
doğru, ama tarihçede o değişiklik benim commit'imde değil.

⚠️ **`docs/README.md` de aynı durumda ve HENÜZ COMMIT EDİLMEDİ.** Dosya iki
değişiklik taşıyor: benim eklediğim `archive/` satırı (yeni
`2026-09-20-guncelligini-yitirenler/` klasörünü indeksleyen) ve onların orphan
denetimi notu. Onların notu `docs/audits/` altındaki **commit edilmemiş**
dosyalara bağlantı verdiği için dosyayı benim commit'ime almadım — alsaydım
depoda kırık bağlantı kalırdı. Yani **indeks satırı onların commit'iyle
girecek**; girmezse `docs/README.md`'deki `archive/` satırını elle ekle.
(Arşiv klasörünün kendi `README.md`'si zaten her şeyi anlatıyor, bilgi kaybı yok.)

ℹ️ Onların orphan denetimi bu oturumun işine değen bir bulgu içeriyor:
**`/radio/:id/song-request` rotası YOK ama düğme çiziliyor** — `Associations.tsx`
Radyo tipindeki kartlarda "İstek Parça" düğmesini o adrese bağlıyor. Kuruluşlar
sayfasında canlı kırık link demektir; bu oturumda dokunulmadı.

## 7. Daha önceden açık duran, bu oturumda dokunulmayanlar

- **Cadde ikilisi** (`cadde-api.ts` 986 satır / **25 importer, hiç testi yok** +
  `CaddePage.tsx` 1716 satır / 19 importer). CLAUDE.md md.7: 800 satırı aşan
  üretim dosyası olarak yalnız bunlar kaldı. **Doğru sıra: önce karakterizasyon
  testi, sonra ayrıştırma.** Bu alan üç kez *sessizce* kırıldı (fold-insensitive
  eşleşme, `instanceof Error` hatası aylarca canlıda kaldı, hedef eşleşmesi) —
  testsiz ayrıştırma kabul edilemez.
- **B6 (karışık veri çekme):** 2 çağrı kaldı, ikisi de
  `src/components/auth/AuthProvider.tsx`'te (oturum kurulumu, savunulabilir).
  ⚠️ Bu deseni sayarken **çok satırlı** arama kullan (`supabase\s*\n?\s*\.from\(`),
  yoksa borcu sıfır sanırsın.
- **Playwright** hâlâ az kullanılıyor (18 `.spec.ts`); kritik akışlar için
  etkinleştirilmeli.

---

## Bu oturumun doğrulama kanıtı (commit anında)

`npx tsc -p tsconfig.app.json --noEmit` → **0 hata** ·
`npm run lint` → **0 problem** ·
`npm run test` → **288 dosya / 2116 test yeşil** ·
`npm run ingest:tools:check` → güncel

⚠️ `tsc` ne `prelint`te ne `pretest`te koşar — dosya ekleyen her oturum onu
**elle** çalıştırmalı.

Yol boyunca yük altında sahte kırılan iki test sağlamlaştırıldı
(`phone-country-derivation.test.ts`, `App.aiform-routes.test.tsx`): yalnız
**süre** uzatıldı ve taramadaki ~1100 gereksiz `statSync` çağrısı kaldırıldı;
taranan küme ve doğrulanan sözleşmeler **aynı**.
